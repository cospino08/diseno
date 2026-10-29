// Normaliza las respuestas de Supabase a un formato único (responsable: P4).
//
// Todos los módulos de assets/js/datos/ devuelven SIEMPRE un objeto { data, error }:
//
//   - Si todo sale bien:   { data: <resultado>, error: null }
//   - Si algo falla:       { data: null, error: { codigo, message, code, details, status } }
//
// `error.codigo` es el código para decidir qué hacer en la página. Sale de
// codigoDeError() de assets/js/ui/mensajes.js (P3), para que todo el proyecto use UN
// SOLO catálogo de códigos: los de negocio del contrato ('FRANJA_OCUPADA',
// 'TRANSICION_INVALIDA'...) y los técnicos de P3 ('SIN_CONEXION', 'SESION_EXPIRADA',
// 'NO_AUTORIZADO', 'DATO_DUPLICADO', 'DESCONOCIDO'...).
//
// `message`, `code`, `details` y `status` se conservan tal como los manda Supabase. Así el
// mismo objeto se puede pasar directamente a mostrarError() o mensajeDeError() de ui/,
// que leen esas propiedades para traducir el mensaje. `details` es técnico: va a la
// consola, nunca a la pantalla.
//
// Las funciones nunca lanzan excepciones: así cada página solo tiene que revisar `error`.
import { codigoDeError as codigoSegunMensajes } from '../ui/mensajes.js';

// Las RPC de P2 lanzan `raise exception 'CODIGO'` (contrato, sección 4.1). Si llega un
// código de negocio que ui/mensajes.js todavía no conoce, se conserva tal cual en vez de
// convertirlo en 'DESCONOCIDO', para que la página pueda reaccionar a él.
const PATRON_CODIGO_CONTRATO = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/;

/**
 * Código de un error de Supabase, de red o de JavaScript.
 * @param {object|Error} errorOriginal
 * @returns {string}
 */
export function codigoDeError(errorOriginal) {
  const codigo = codigoSegunMensajes(errorOriginal) ?? 'DESCONOCIDO';
  const mensaje = String(errorOriginal?.message ?? '');
  if (codigo === 'DESCONOCIDO' && PATRON_CODIGO_CONTRATO.test(mensaje)) return mensaje;
  return codigo;
}

/** Copia las propiedades útiles del error (un Error de JS no las expone con spread). */
export function normalizarError(errorOriginal) {
  return {
    codigo: codigoDeError(errorOriginal),
    message: String(errorOriginal?.message ?? errorOriginal ?? ''),
    code: errorOriginal?.code ?? '',
    details: errorOriginal?.details ?? '',
    status: errorOriginal?.status,
    name: errorOriginal?.name,
  };
}

/**
 * Ejecuta una consulta de supabase-js y devuelve { data, error } normalizado.
 * Recibe una función (no la promesa) para poder capturar también errores síncronos.
 * @param {() => PromiseLike<{data: any, error: any}>} consulta
 */
export async function ejecutar(consulta) {
  try {
    const { data, error } = await consulta();
    if (error) return { data: null, error: normalizarError(error) };
    return { data, error: null };
  } catch (excepcion) {
    return { data: null, error: normalizarError(excepcion) };
  }
}
