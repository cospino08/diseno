// =============================================================================
// ui/mensajes.js: traduce los errores de Supabase a mensajes claros en español.
// Dueño: P3. Lo usan P3 y P4.
//
// Por qué existe: las RPC de P2 lanzan códigos como 'FRANJA_OCUPADA' (plan,
// sección 7). Supabase Auth y PostgREST devuelven textos técnicos en inglés
// ('Invalid login credentials', 'JWT expired'…). El usuario nunca debe ver esos
// textos (enunciado 5.2: "mensajes claros"). Este módulo convierte CUALQUIER
// error en uno de nuestros códigos y cada código en un texto.
//
// API:
//   codigoDeError(error)  → 'FRANJA_OCUPADA' | 'SIN_CONEXION' | … | 'DESCONOCIDO'
//   mensajeDeError(error) → texto para mostrar al usuario
//   MENSAJES              → { CODIGO: 'texto' } (solo lectura)
//   nombreEstado(estado)  → 'no_asistio' → 'No asistió'
//
// Ejemplo:
//   const { error } = await supabase.rpc('reservar_cita', { … });
//   if (codigoDeError(error) === 'FRANJA_OCUPADA') { …recargar disponibilidad… }
//   mostrarError(zona, error);   // estados.js llama a mensajeDeError por dentro
//
// Para agregar un código nuevo del contrato: solo hay que añadirlo a MENSAJES.
// La detección es automática si la RPC lo lanza al inicio del mensaje.
// =============================================================================

/** Texto de cada código. Los de negocio vienen de docs/contrato_api.md (P2). */
export const MENSAJES = Object.freeze({
  // --- Reserva (reservar_cita) ---
  FRANJA_OCUPADA:
    'Otra persona acaba de reservar esa hora. Te mostramos las horas que siguen libres.',
  FRANJA_PASADA: 'Esa hora ya pasó. Elige una hora futura.',
  FRANJA_NO_EXISTE: 'Esa hora ya no está disponible. Elige otra.',
  PERFIL_INCOMPLETO: 'Completa tu perfil (documento, teléfono y fecha de nacimiento) antes de reservar.',
  SOLO_PACIENTES: 'Solo las cuentas de paciente pueden reservar citas.',

  // --- Cancelación y estados (cancelar_cita, cambiar_estado_cita) ---
  FUERA_DE_PLAZO:
    'Ya no puedes cancelar esta cita en línea: faltan menos de 2 horas. Comunícate con la clínica.',
  TRANSICION_INVALIDA: 'La cita ya no está en un estado que permita ese cambio. Recarga la página.',
  ANTES_DE_HORA: 'Solo puedes marcar la cita como atendida o no asistió después de su hora de inicio.',

  // --- Administración ---
  HORARIO_SUPERPUESTO: 'Ese horario se cruza con franjas que el profesional ya tiene.',
  // Código PROPUESTO para el trigger de P12 (mover o desactivar una franja con
  // cita activa). Aún no está en el contrato: pedido a P2 en docs/ESTADO.md.
  FRANJA_CON_CITA:
    'Esa franja tiene una cita activa. Cancela primero la cita para poder modificarla.',

  // --- Permisos ---
  NO_AUTORIZADO: 'No tienes permiso para realizar esta acción.',

  // --- Datos (errores de PostgreSQL) ---
  DATO_DUPLICADO: 'Ese dato ya está registrado. Revisa la información.',
  DATO_INVALIDO: 'Algún dato no es válido. Revisa el formulario.',
  NO_ENCONTRADO: 'No encontramos lo que buscabas. Puede que ya no exista.',

  // --- Autenticación ---
  CREDENCIALES_INVALIDAS: 'Correo o contraseña incorrectos.',
  CORREO_NO_CONFIRMADO:
    'Confirma tu correo con el enlace que te enviamos antes de iniciar sesión.',
  USUARIO_YA_EXISTE: 'Ya existe una cuenta con ese correo. Inicia sesión.',
  CONTRASENA_DEBIL: 'La contraseña es muy débil. Usa al menos 8 caracteres, con letras y números.',
  CONTRASENA_IGUAL: 'La contraseña nueva debe ser diferente de la anterior.',
  DEMASIADOS_INTENTOS: 'Hiciste demasiados intentos seguidos. Espera unos minutos y vuelve a intentarlo.',
  SESION_EXPIRADA: 'Tu sesión expiró. Inicia sesión de nuevo.',
  CUENTA_INACTIVA: 'Tu cuenta está desactivada. Comunícate con la clínica.',

  // --- Técnicos ---
  SIN_CONEXION: 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.',
  DESCONOCIDO: 'Ocurrió un error inesperado. Inténtalo de nuevo en unos minutos.',
});

// Códigos de PostgreSQL y PostgREST que se traducen a nuestros códigos.
// Referencias: https://www.postgresql.org/docs/current/errcodes-appendix.html
// y https://postgrest.org/en/stable/references/errors.html
const CODIGOS_POSTGRES = {
  '23505': 'DATO_DUPLICADO',   // unique_violation (fuera de las RPC)
  '23514': 'DATO_INVALIDO',    // check_violation
  '23502': 'DATO_INVALIDO',    // not_null_violation
  '22P02': 'DATO_INVALIDO',    // invalid_text_representation (p. ej. un id no numérico)
  '23P01': 'HORARIO_SUPERPUESTO', // exclusion_violation (restricción de franjas, plan P3)
  '42501': 'NO_AUTORIZADO',    // insufficient_privilege (GRANT o RLS)
  PGRST116: 'NO_ENCONTRADO',   // .single() sin filas
  PGRST301: 'SESION_EXPIRADA', // JWT expirado o inválido
  PGRST303: 'SESION_EXPIRADA', // JWT expirado (versiones nuevas de PostgREST)
};

// Códigos de Supabase Auth (propiedad error.code, supabase-js 2.x).
// Referencia: https://supabase.com/docs/guides/auth/debugging/error-codes
const CODIGOS_AUTH = {
  invalid_credentials: 'CREDENCIALES_INVALIDAS',
  email_not_confirmed: 'CORREO_NO_CONFIRMADO',
  user_already_exists: 'USUARIO_YA_EXISTE',
  email_exists: 'USUARIO_YA_EXISTE',
  weak_password: 'CONTRASENA_DEBIL',
  same_password: 'CONTRASENA_IGUAL',
  over_request_rate_limit: 'DEMASIADOS_INTENTOS',
  over_email_send_rate_limit: 'DEMASIADOS_INTENTOS',
  session_not_found: 'SESION_EXPIRADA',
  session_expired: 'SESION_EXPIRADA',
  refresh_token_not_found: 'SESION_EXPIRADA',
  user_banned: 'CUENTA_INACTIVA',
};

// Algunos servidores de Auth no envían error.code; se reconoce por el texto.
const TEXTOS_AUTH = [
  [/invalid login credentials/i, 'CREDENCIALES_INVALIDAS'],
  [/email not confirmed/i, 'CORREO_NO_CONFIRMADO'],
  [/already registered|already exists/i, 'USUARIO_YA_EXISTE'],
  [/password should|weak password/i, 'CONTRASENA_DEBIL'],
  [/rate limit|too many requests/i, 'DEMASIADOS_INTENTOS'],
  [/jwt expired|invalid jwt|refresh token/i, 'SESION_EXPIRADA'],
];

// Errores de red: fetch lanza TypeError y supabase-js los envuelve en
// AuthRetryableFetchError. El texto cambia según el navegador.
const TEXTO_RED = /failed to fetch|networkerror|load failed|network request failed|fetch failed/i;

/**
 * Devuelve el código de nuestro catálogo (una clave de MENSAJES) para cualquier
 * error: de una RPC, de PostgREST, de Auth, de red o un Error de JavaScript.
 * Si recibe null o undefined devuelve null (no hubo error).
 */
export function codigoDeError(error) {
  if (!error) return null;

  const texto = String(error.message ?? error);

  // 1. Errores de negocio de las RPC: el mensaje EMPIEZA con el código
  //    ('FRANJA_OCUPADA' o 'TRANSICION_INVALIDA: confirmada -> programada').
  const posibleCodigo = texto.match(/^[A-Z][A-Z_]+/);
  if (posibleCodigo && posibleCodigo[0] in MENSAJES) return posibleCodigo[0];

  // 2. Sin conexión (se revisa antes que el resto porque no trae código).
  if (TEXTO_RED.test(texto) || error.name === 'AuthRetryableFetchError') return 'SIN_CONEXION';
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'SIN_CONEXION';

  // 3. Códigos de Auth y de PostgreSQL/PostgREST.
  if (error.code && CODIGOS_AUTH[error.code]) return CODIGOS_AUTH[error.code];
  if (error.code && CODIGOS_POSTGRES[error.code]) return CODIGOS_POSTGRES[error.code];

  // 4. Último recurso para Auth: reconocer el texto.
  for (const [patron, codigo] of TEXTOS_AUTH) {
    if (patron.test(texto)) return codigo;
  }

  // 5. HTTP 401/403 sin más detalle.
  if (error.status === 401) return 'SESION_EXPIRADA';
  if (error.status === 403) return 'NO_AUTORIZADO';

  return 'DESCONOCIDO';
}

/**
 * Devuelve el texto en español para mostrar al usuario. Nunca devuelve el
 * mensaje técnico original: ese solo se escribe en la consola, para depurar.
 */
export function mensajeDeError(error) {
  const codigo = codigoDeError(error);
  if (!codigo) return '';
  if (codigo === 'DESCONOCIDO') console.error('Error sin traducir:', error);
  return MENSAJES[codigo];
}

/** Nombres para mostrar de los valores del enum estado_cita (plan, P1). */
const NOMBRES_ESTADO = Object.freeze({
  programada: 'Programada',
  confirmada: 'Confirmada',
  atendida: 'Atendida',
  cancelada: 'Cancelada',
  no_asistio: 'No asistió',
});

/** 'no_asistio' → 'No asistió'. Si el estado es desconocido, lo devuelve tal cual. */
export function nombreEstado(estado) {
  return NOMBRES_ESTADO[estado] ?? String(estado);
}
