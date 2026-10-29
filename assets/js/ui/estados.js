// =============================================================================
// ui/estados.js: los cinco estados de interfaz de la sección 8.2 del enunciado
// (cargando, vacío, error, acceso denegado y éxito) y los avisos flotantes.
// Dueño: P3. Lo usan P3 y P4. Aspecto: docs/wireframes/estados.md.
//
// Seguridad: todo el texto entra con textContent y los nodos se crean con
// createElement. NUNCA innerHTML, así que un texto que venga de la base de
// datos (p. ej. un nombre con <script>) se muestra como texto (CP-18).
//
// API (todas reemplazan el contenido de `zona`, un elemento del DOM):
//   mostrarCargando(zona, texto?)
//   mostrarVacio(zona, texto, accion?)
//   mostrarError(zona, errorOTexto, { reintentar }?)
//   mostrarAccesoDenegado(zona, { texto?, enlace? }?)
//   mostrarExito(zona, texto, { titulo?, enfocar? }?)
//   limpiar(zona)
//   avisar(texto, tipo?)            aviso flotante breve: 'exito' | 'info' | 'aviso' | 'error'
//   crearAlerta(tipo, texto, titulo?) devuelve el nodo, para insertarlo donde se quiera
//
// `accion` (para vacío) es { texto, href } para un enlace o { texto, alPulsar }
// para un botón.
//
// Ejemplo típico en una página:
//   mostrarCargando(lista, 'Buscando horas disponibles…');
//   const { data, error } = await …;
//   if (error) return mostrarError(lista, error, { reintentar: buscar });
//   if (data.length === 0) return mostrarVacio(lista, 'No hay horas disponibles');
//   limpiar(lista); …pintar los datos…
// =============================================================================

import { mensajeDeError } from './mensajes.js';

// Ícono (texto, decorativo) de cada tipo de alerta. El lector de pantalla no lo
// lee (aria-hidden); el texto de la alerta ya explica el problema.
const ICONOS = { info: 'ℹ', exito: '✔', aviso: '!', error: '⚠', denegado: '🔒' };

// Las alertas de error interrumpen al lector de pantalla (role=alert); las demás
// se anuncian cuando termina de hablar (role=status).
const ROLES = { info: 'status', exito: 'status', aviso: 'status', error: 'alert', denegado: 'alert' };

/** Crea un elemento con clase y texto opcionales. Atajo interno. */
function crear(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

/** Vacía la zona y quita la marca de "ocupada". */
export function limpiar(zona) {
  zona.replaceChildren();
  zona.removeAttribute('aria-busy');
}

/**
 * Crea una alerta (sin insertarla). tipo: 'info' | 'exito' | 'aviso' | 'error' | 'denegado'.
 * Devuelve el nodo para que la página decida dónde ponerlo.
 */
export function crearAlerta(tipo, texto, titulo) {
  const alerta = crear('div', `alerta alerta--${tipo}`);
  alerta.setAttribute('role', ROLES[tipo] ?? 'status');

  const icono = crear('span', 'alerta__icono', ICONOS[tipo] ?? '');
  icono.setAttribute('aria-hidden', 'true');

  const cuerpo = crear('div', 'alerta__cuerpo');
  if (titulo) cuerpo.append(crear('strong', 'alerta__titulo', titulo));
  cuerpo.append(crear('p', null, texto));

  alerta.append(icono, cuerpo);
  return alerta;
}

/** Estado CARGANDO: indicador giratorio + texto. */
export function mostrarCargando(zona, texto = 'Cargando…') {
  const estado = crear('div', 'estado estado--cargando');
  estado.setAttribute('role', 'status');
  const indicador = crear('span', 'indicador-carga');
  indicador.setAttribute('aria-hidden', 'true');
  estado.append(indicador, crear('p', null, texto));

  zona.replaceChildren(estado);
  zona.setAttribute('aria-busy', 'true');
}

/** Estado VACÍO: la consulta funcionó pero no hay datos. */
export function mostrarVacio(zona, texto, accion) {
  const estado = crear('div', 'estado estado--vacio');
  estado.setAttribute('role', 'status');
  estado.append(crear('p', null, texto));
  if (accion) estado.append(crearAccion(accion, 'boton boton--secundario'));

  zona.replaceChildren(estado);
  zona.removeAttribute('aria-busy');
}

/**
 * Estado ERROR. Acepta un error de Supabase (se traduce con mensajes.js) o un
 * texto ya escrito. Si se pasa `reintentar`, agrega el botón "Reintentar".
 */
export function mostrarError(zona, errorOTexto, { reintentar } = {}) {
  const texto = typeof errorOTexto === 'string' ? errorOTexto : mensajeDeError(errorOTexto);
  const alerta = crearAlerta('error', texto);
  if (reintentar) {
    const boton = crear('button', 'boton boton--secundario', 'Reintentar');
    boton.type = 'button';
    boton.addEventListener('click', reintentar);
    alerta.querySelector('.alerta__cuerpo').append(boton);
  }

  zona.replaceChildren(alerta);
  zona.removeAttribute('aria-busy');
}

/**
 * Estado ACCESO DENEGADO. Recuerda: esto es solo información para el usuario.
 * Quien niega el acceso de verdad son las políticas RLS y las RPC.
 */
export function mostrarAccesoDenegado(zona, { texto, enlace } = {}) {
  const alerta = crearAlerta(
    'denegado',
    texto ?? 'No tienes permiso para ver esta página.',
    'Acceso denegado',
  );
  if (enlace) {
    const parrafo = crear('p');
    parrafo.append(crearAccion(enlace));
    alerta.querySelector('.alerta__cuerpo').append(parrafo);
  }

  zona.replaceChildren(alerta);
  zona.removeAttribute('aria-busy');
}

/**
 * Estado ÉXITO. Con `enfocar: true` mueve el foco a la alerta, para que el
 * usuario de teclado o de lector de pantalla sepa que el contenido cambió.
 */
export function mostrarExito(zona, texto, { titulo, enfocar = false } = {}) {
  const alerta = crearAlerta('exito', texto, titulo);
  zona.replaceChildren(alerta);
  zona.removeAttribute('aria-busy');
  if (enfocar) {
    alerta.tabIndex = -1;
    alerta.focus();
  }
}

/**
 * Aviso flotante breve (p. ej. "Perfil actualizado"). No reemplaza contenido.
 * Los de éxito, info y aviso desaparecen a los 6 s. Los de error se quedan
 * hasta que el usuario los cierra, para que alcance a leerlos.
 */
export function avisar(texto, tipo = 'exito') {
  const region = obtenerRegionAvisos();
  const alerta = crearAlerta(tipo, texto);

  const cerrar = crear('button', 'boton boton--enlace', 'Cerrar');
  cerrar.type = 'button';
  cerrar.addEventListener('click', () => alerta.remove());
  alerta.append(cerrar);

  region.append(alerta);
  if (tipo !== 'error') setTimeout(() => alerta.remove(), 6000);
}

/**
 * Crea (una sola vez por página) la región fija donde aparecen los avisos.
 * Es aria-live: los lectores de pantalla solo anuncian los cambios de una
 * región viva que YA existía antes del cambio, por eso se crea apenas se
 * carga este módulo (ver la llamada al final del archivo) y no en el primer aviso.
 */
function obtenerRegionAvisos() {
  let region = document.querySelector('.avisos');
  if (!region) {
    region = crear('div', 'avisos');
    region.setAttribute('aria-live', 'polite');
    document.body.append(region);
  }
  return region;
}

// Los módulos ES se ejecutan cuando el documento ya está analizado, así que
// document.body existe en este punto.
if (typeof document !== 'undefined' && document.body) obtenerRegionAvisos();

/** Enlace ({ texto, href }) o botón ({ texto, alPulsar }) para los estados. */
function crearAccion(accion, clase = '') {
  if (accion.href) {
    const enlace = crear('a', clase, accion.texto);
    enlace.href = accion.href;
    return enlace;
  }
  const boton = crear('button', clase, accion.texto);
  boton.type = 'button';
  boton.addEventListener('click', accion.alPulsar);
  return boton;
}
