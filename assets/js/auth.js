// =============================================================================
// auth.js: registro, inicio y cierre de sesión, recuperación de contraseña,
// guarda de página por rol, perfil completo obligatorio y sesión expirada.
// Dueño: P3. P4 usa protegerPagina() en profesional/ y admin/.
//
// RECORDATORIO DE SEGURIDAD (enunciado 11.2 y plan P14):
//   protegerPagina() solo MEJORA LA EXPERIENCIA: evita que alguien vea una
//   pantalla que no le sirve. NO es autorización. Cualquiera puede saltarse este
//   archivo desde la consola del navegador. Lo que de verdad impide leer o
//   modificar datos ajenos son las políticas RLS y las RPC de la base (P2).
//
// API:
//   registrar({ nombres, correo, contrasena })   → { error, requiereConfirmacion }
//   iniciarSesion({ correo, contrasena })        → { error, destino }
//   cerrarSesion()                               → redirige a index.html
//   enviarRecuperacion(correo)                   → { error }
//   cambiarContrasena(nueva)                     → { error }
//   obtenerPerfil()                              → { data: perfil, error }
//   perfilCompleto(perfil)                       → true | false
//   protegerPagina({ roles, exigirPerfilCompleto }) → { sesion, perfil } | null
//   manejarSesionExpirada(error)                 → true si redirigió
//   urlDe('paciente/perfil.html')                → URL absoluta dentro del sitio
//   rutaInicio(rol)                              → URL del inicio de cada rol
//   supabase                                     → el cliente (reexportado)
//
// Uso en una página privada:
//   <script type="module">
//     import { protegerPagina } from '../assets/js/auth.js';
//     const acceso = await protegerPagina({ roles: ['paciente'] });
//     if (acceso) { …cargar la página con acceso.perfil… }
//   </script>
// =============================================================================

import { codigoDeError } from './ui/mensajes.js';
import { mostrarAccesoDenegado, mostrarError } from './ui/estados.js';

// ---------- Cliente de Supabase ----------
//
// Hay un solo cliente en toda la aplicación y lo crea P4 en
// assets/js/datos/cliente.js (plan, sección 11). Aquí solo se importa y se
// reexporta, para que las páginas que ya importan `supabase` desde auth.js sigan
// funcionando. (En la ronda 1 había un cliente temporal mientras cliente.js no
// existía; se quitó en la ronda 2.)
import { supabase } from './datos/cliente.js';
export { supabase };

// ---------- Rutas ----------
//
// La raíz del sitio se calcula a partir de la ubicación de ESTE archivo
// (assets/js/auth.js → dos carpetas arriba). Así funciona igual en un servidor
// local (http://localhost:8000/) y en GitHub Pages, que publica el sitio en una
// subcarpeta (https://usuario.github.io/diseno/).
const RAIZ = new URL('../../', import.meta.url);

/** URL absoluta de una página del sitio: urlDe('paciente/perfil.html'). */
export function urlDe(ruta) {
  return new URL(ruta, RAIZ).href;
}

/** Página de inicio de cada rol (plan, sección 11). */
const INICIO_POR_ROL = {
  paciente: 'paciente/index.html',
  profesional: 'profesional/agenda.html',
  admin: 'admin/resumen.html',
};

export function rutaInicio(rol) {
  return urlDe(INICIO_POR_ROL[rol] ?? 'index.html');
}

/**
 * Valida el parámetro ?volver= antes de usarlo para redirigir. Solo se aceptan
 * páginas de ESTE sitio; si no, alguien podría armar un enlace de inicio de
 * sesión que lleve a un sitio falso (redirección abierta, OWASP).
 */
export function rutaSegura(volver) {
  if (!volver) return null;
  try {
    const destino = new URL(volver, location.href);
    if (destino.origin !== RAIZ.origin || !destino.pathname.startsWith(RAIZ.pathname)) return null;
    return destino.href;
  } catch {
    return null;
  }
}

/** Ruta actual, para volver a ella después de iniciar sesión o completar el perfil. */
function rutaActual() {
  return location.pathname + location.search;
}

/** Redirige al inicio de sesión con un motivo (lo lee index.html para mostrar el aviso). */
function irAlInicioDeSesion(motivo, volver) {
  const destino = new URL(urlDe('index.html'));
  destino.searchParams.set('motivo', motivo);
  if (volver) destino.searchParams.set('volver', volver);
  location.replace(destino.href);
}

// ---------- Registro, inicio y cierre de sesión ----------

/**
 * Registra un paciente. Solo se envían los nombres como metadato: el trigger
 * tg_crear_perfil (P2) crea el perfil SIEMPRE con rol 'paciente'. El rol nunca
 * se manda desde aquí, porque los metadatos los controla el cliente y se pueden
 * falsificar (plan, P4).
 *
 * requiereConfirmacion es true si el proyecto exige confirmar el correo (en ese
 * caso Supabase no devuelve sesión).
 */
export async function registrar({ nombres, correo, contrasena }) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: correo.trim(),
      password: contrasena,
      options: {
        data: { nombres },
        emailRedirectTo: urlDe('index.html'),
      },
    });
    if (error) return { error, requiereConfirmacion: false };
    // Con confirmación de correo activa, si el correo ya existe Supabase no da
    // error (para no revelar qué correos existen) y devuelve un usuario sin
    // identidades. Se trata igual que un registro nuevo: "revisa tu correo".
    return { error: null, requiereConfirmacion: !data.session };
  } catch (error) {
    return { error, requiereConfirmacion: false };
  }
}

/**
 * Inicia sesión y decide a dónde ir: al ?volver= (si es seguro), al perfil si
 * falta completarlo (solo pacientes) o al inicio del rol.
 */
export async function iniciarSesion({ correo, contrasena, volver }) {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: correo.trim(),
      password: contrasena,
    });
    if (error) return { error, destino: null };

    const { data: perfil, error: errorPerfil } = await obtenerPerfil();
    if (errorPerfil) return { error: errorPerfil, destino: null };
    if (!perfil.activo) {
      await supabase.auth.signOut();
      return { error: new Error('CUENTA_INACTIVA'), destino: null };
    }
    return { error: null, destino: destinoTrasIngresar(perfil, volver) };
  } catch (error) {
    return { error, destino: null };
  }
}

/** A dónde va un usuario recién autenticado. */
export function destinoTrasIngresar(perfil, volver) {
  if (perfil.rol === 'paciente' && !perfilCompleto(perfil)) {
    return urlConParametros('paciente/perfil.html', { completar: '1', volver });
  }
  return rutaSegura(volver) ?? rutaInicio(perfil.rol);
}

// Marca que el cierre de sesión lo pidió el usuario. Así el vigilante de sesión
// (abajo) no lo confunde con una sesión expirada.
let cierreVoluntario = false;

export async function cerrarSesion() {
  cierreVoluntario = true;
  try {
    await supabase.auth.signOut();
  } finally {
    // Aunque falle la red, se olvida la sesión local y se sale.
    irAlInicioDeSesion('cerrada');
  }
}

// ---------- Recuperación de contraseña ----------

/**
 * Envía el correo de recuperación. El enlace vuelve a index.html, donde
 * Supabase dispara el evento PASSWORD_RECOVERY y se muestra el formulario de
 * contraseña nueva. La página muestra el mismo mensaje exista o no el correo.
 */
export async function enviarRecuperacion(correo) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(correo.trim(), {
      redirectTo: urlDe('index.html'),
    });
    return { error };
  } catch (error) {
    return { error };
  }
}

/** Guarda la contraseña nueva (requiere la sesión temporal del enlace de recuperación). */
export async function cambiarContrasena(nueva) {
  try {
    const { error } = await supabase.auth.updateUser({ password: nueva });
    return { error };
  } catch (error) {
    return { error };
  }
}

// ---------- Perfil ----------

// Columnas de profiles según docs/contrato_api.md (v1.1, sección 2.1). Si P2
// cambia los nombres en el contrato, se ajusta solo esta línea.
const COLUMNAS_PERFIL = 'id, email, nombres, documento, telefono, fecha_nacimiento, rol, activo';

/**
 * Lee el perfil del usuario autenticado. La RLS de profiles solo deja leer la
 * fila propia, así que el filtro por id es para pedir una fila, no por seguridad.
 * Se queda aquí (y no en datos/perfiles.js) porque auth.js necesita también el
 * usuario de Auth para el correo y para detectar la sesión vencida.
 */
export async function obtenerPerfil() {
  try {
    const { data: { user }, error: errorUsuario } = await supabase.auth.getUser();
    if (errorUsuario || !user) return { data: null, error: errorUsuario ?? new Error('SESION_EXPIRADA') };

    const { data, error } = await supabase
      .from('profiles')
      .select(COLUMNAS_PERFIL)
      .eq('id', user.id)
      .single();
    if (data) data.correo = user.email; // el correo vive en auth.users, no en profiles
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Datos obligatorios antes de reservar (plan, P4). La base también lo exige:
 * reservar_cita lanza PERFIL_INCOMPLETO.
 */
export function perfilCompleto(perfil) {
  return Boolean(
    perfil?.nombres?.trim() && perfil.documento && perfil.telefono && perfil.fecha_nacimiento,
  );
}

// ---------- Guarda de página ----------

/**
 * Se llama al inicio de cada página privada. Hace, en orden:
 *   1. Sin sesión → al inicio de sesión ("Inicia sesión para continuar").
 *   2. Lee el perfil. Si la cuenta está inactiva → cierra la sesión.
 *   3. Rol no permitido → muestra "Acceso denegado" en <main> y devuelve null.
 *   4. Paciente con perfil incompleto → a paciente/perfil.html?completar=1.
 *   5. Prepara el encabezado (menú, nombre y cerrar sesión) y empieza a
 *      vigilar la sesión.
 * Devuelve { sesion, perfil } si la página puede mostrarse; null si no.
 *
 * exigirPerfilCompleto: false solo en la página de perfil (si no, habría un
 * bucle de redirecciones).
 */
export async function protegerPagina({ roles, exigirPerfilCompleto = true }) {
  const main = document.querySelector('main');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    irAlInicioDeSesion('sin-sesion', rutaActual());
    return null;
  }

  const { data: perfil, error } = await obtenerPerfil();
  if (error) {
    if (manejarSesionExpirada(error)) return null;
    mostrarError(main, error, { reintentar: () => location.reload() });
    return null;
  }
  if (!perfil.activo) {
    cierreVoluntario = true;
    await supabase.auth.signOut();
    irAlInicioDeSesion('inactiva');
    return null;
  }

  prepararEncabezado(perfil);
  vigilarSesion();

  if (!roles.includes(perfil.rol)) {
    document.title = `Acceso denegado · ${document.title}`;
    const titulo = document.createElement('h1');
    titulo.textContent = 'Acceso denegado';
    const zona = document.createElement('div');
    mostrarAccesoDenegado(zona, {
      texto: 'Tu cuenta no tiene permiso para ver esta página.',
      enlace: { texto: 'Ir a mi inicio', href: rutaInicio(perfil.rol) },
    });
    main.replaceChildren(titulo, zona);
    return null;
  }

  if (exigirPerfilCompleto && perfil.rol === 'paciente' && !perfilCompleto(perfil)) {
    location.replace(urlConParametros('paciente/perfil.html', { completar: '1', volver: rutaActual() }));
    return null;
  }

  return { sesion: session, perfil };
}

/** Arma una URL del sitio con parámetros, omitiendo los vacíos. */
function urlConParametros(ruta, parametros) {
  const url = new URL(urlDe(ruta));
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor) url.searchParams.set(clave, valor);
  }
  return url.href;
}

// ---------- Sesión expirada (plan P14, CP-14) ----------

let vigilando = false;

/**
 * Escucha los cambios de sesión. Si la sesión se pierde sin que el usuario haya
 * pulsado "Cerrar sesión" (venció el token y no se pudo renovar, o se cerró en
 * otra pestaña), se redirige al inicio de sesión con el aviso de sesión
 * expirada y se guarda la página actual para volver después.
 *
 * Nota de supabase-js: no se debe llamar a otra función de supabase dentro de
 * este callback (puede bloquearse); por eso solo se redirige.
 */
function vigilarSesion() {
  if (vigilando) return;
  vigilando = true;
  supabase.auth.onAuthStateChange((evento) => {
    if (evento === 'SIGNED_OUT' && !cierreVoluntario) {
      irAlInicioDeSesion('sesion-expirada', rutaActual());
    }
  });
}

/**
 * Para usar después de cualquier llamada a la base: si el error es de sesión
 * vencida (JWT expirado, 401), redirige al inicio de sesión y devuelve true.
 * Ejemplo:
 *   const { error } = await supabase.rpc('reservar_cita', …);
 *   if (manejarSesionExpirada(error)) return;
 */
export function manejarSesionExpirada(error) {
  if (codigoDeError(error) !== 'SESION_EXPIRADA') return false;
  cierreVoluntario = true; // evita una segunda redirección desde el vigilante
  const volver = rutaActual();
  // Se olvida la sesión guardada en ESTE navegador (scope 'local': no cierra las
  // sesiones de otros dispositivos). Si no, index.html vería una sesión
  // "existente", aunque la base ya la rechazó, y devolvería al usuario aquí.
  supabase.auth.signOut({ scope: 'local' })
    .catch(() => {})
    .finally(() => irAlInicioDeSesion('sesion-expirada', volver));
  return true;
}

// ---------- Encabezado común de las páginas privadas ----------

const NOMBRES_ROL = { paciente: 'Paciente', profesional: 'Profesional', admin: 'Administración' };

/**
 * Activa el menú del encabezado (ver la estructura en docs/wireframes/acceso.md,
 * A-04):
 *   - botón .menu__boton que abre y cierra la lista (aria-expanded; Esc cierra)
 *   - [data-usuario] recibe "Nombre · Rol" (con textContent)
 *   - [data-accion="cerrar-sesion"] cierra la sesión
 *   - el enlace de la página actual recibe aria-current="page"
 */
export function prepararEncabezado(perfil) {
  const boton = document.querySelector('.menu__boton');
  const lista = document.querySelector('.menu__lista');
  if (boton && lista) {
    const alternar = (abrir) => {
      boton.setAttribute('aria-expanded', String(abrir));
      lista.dataset.abierto = String(abrir);
    };
    boton.addEventListener('click', () => alternar(boton.getAttribute('aria-expanded') !== 'true'));
    lista.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape' && boton.getAttribute('aria-expanded') === 'true') {
        alternar(false);
        boton.focus();
      }
    });
  }

  for (const enlace of document.querySelectorAll('.menu__enlace')) {
    if (new URL(enlace.href).pathname === location.pathname) enlace.setAttribute('aria-current', 'page');
  }

  const usuario = document.querySelector('[data-usuario]');
  if (usuario && perfil) {
    usuario.textContent = `${perfil.nombres || perfil.correo} · ${NOMBRES_ROL[perfil.rol] ?? perfil.rol}`;
  }

  for (const salir of document.querySelectorAll('[data-accion="cerrar-sesion"]')) {
    salir.addEventListener('click', cerrarSesion);
  }
}
