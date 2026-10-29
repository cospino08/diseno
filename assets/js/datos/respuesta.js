// Normaliza las respuestas de Supabase a un formato único (responsable: P4).
//
// Todos los módulos de assets/js/datos/ devuelven SIEMPRE un objeto { data, error }:
//
//   - Si todo sale bien:   { data: <resultado>, error: null }
//   - Si algo falla:       { data: null, error: { codigo, detalle } }
//
// `codigo` es uno de los códigos del contrato (docs/contrato_api.md), por ejemplo
// 'FRANJA_OCUPADA' o 'TRANSICION_INVALIDA', o uno de los códigos técnicos de abajo.
// assets/js/ui/mensajes.js (P3) traduce ese código a un mensaje claro para la persona.
// `detalle` es el mensaje original de Supabase: sirve para depurar, NO para mostrarlo.
//
// Las funciones nunca lanzan excepciones: así cada página solo tiene que revisar `error`.

// Códigos técnicos que no vienen de las RPC sino de la red, la sesión o PostgreSQL.
// Se coordinan con P3 para que mensajes.js también los traduzca.
export const ERROR_RED = 'ERROR_RED';
export const SESION_EXPIRADA = 'SESION_EXPIRADA';
export const NO_AUTORIZADO = 'NO_AUTORIZADO';
export const HORARIO_SUPERPUESTO = 'HORARIO_SUPERPUESTO';
export const DUPLICADO = 'DUPLICADO';
export const EN_USO = 'EN_USO';
export const ERROR_DESCONOCIDO = 'ERROR_DESCONOCIDO';

// Las RPC de P2 lanzan `raise exception 'CODIGO'` o `'CODIGO: detalle'`
// (por ejemplo 'TRANSICION_INVALIDA: atendida -> programada'). PostgreSQL devuelve ese texto
// en error.message, así que el código es la palabra en MAYÚSCULAS del inicio.
const PATRON_CODIGO_CONTRATO = /^([A-Z][A-Z0-9_]{2,})(?=$|[:\s])/;

/**
 * Convierte un error de Supabase (o una excepción de red) en un código del contrato.
 * @param {object|Error} errorOriginal
 * @returns {string}
 */
export function codigoDeError(errorOriginal) {
  if (!errorOriginal) return ERROR_DESCONOCIDO;
  const mensaje = String(errorOriginal.message ?? '');
  const codigoPg = String(errorOriginal.code ?? '');

  // Sin conexión: fetch falla con TypeError ("Failed to fetch" en Chrome,
  // "NetworkError" en Firefox, "Load failed" en Safari).
  if (/failed to fetch|networkerror|load failed/i.test(mensaje)) return ERROR_RED;

  // Token vencido o inválido (PostgREST responde PGRST301 / "JWT expired").
  // Va antes del patrón del contrato porque "JWT expired" también empieza en mayúsculas.
  if (codigoPg === 'PGRST301' || /\bjwt\b/i.test(mensaje)) return SESION_EXPIRADA;

  const coincidencia = mensaje.match(PATRON_CODIGO_CONTRATO);
  if (coincidencia) return coincidencia[1];

  // Códigos estándar de PostgreSQL (https://www.postgresql.org/docs/current/errcodes-appendix.html)
  switch (codigoPg) {
    case '42501': return NO_AUTORIZADO;        // insufficient_privilege: RLS o GRANT lo bloquean
    case '23P01': return HORARIO_SUPERPUESTO;  // exclusion_violation: franjas que se cruzan
    case '23505': return DUPLICADO;            // unique_violation: p. ej. especialidad repetida
    case '23503': return EN_USO;               // foreign_key_violation: registro referenciado
    default: return ERROR_DESCONOCIDO;
  }
}

/**
 * Ejecuta una consulta de supabase-js y devuelve { data, error } normalizado.
 * Recibe una función (no la promesa) para poder capturar también errores síncronos.
 * @param {() => PromiseLike<{data: any, error: any}>} consulta
 */
export async function ejecutar(consulta) {
  try {
    const { data, error } = await consulta();
    if (error) {
      return { data: null, error: { codigo: codigoDeError(error), detalle: error.message ?? '' } };
    }
    return { data, error: null };
  } catch (excepcion) {
    return { data: null, error: { codigo: codigoDeError(excepcion), detalle: String(excepcion?.message ?? excepcion) } };
  }
}
