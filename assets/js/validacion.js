// =============================================================================
// validacion.js: validación de formularios en el cliente.
// Dueño: P3. P4 puede usarlo en sus formularios.
//
// IMPORTANTE (enunciado 11.2): validar en el cliente solo sirve para dar
// retroalimentación rápida al usuario. NO es seguridad: cualquiera puede saltarse
// este archivo desde la consola. Las mismas reglas las impone la base de datos
// (CHECK, NOT NULL, RPC). Si la base y este archivo no coinciden, gana la base.
//
// API:
//   Reglas sueltas: cada una recibe el valor y devuelve '' si es válido o el
//   mensaje de error si no lo es.
//     validarCorreo, validarContrasena, validarNombres, validarDocumento,
//     validarTelefono, validarFechaNacimiento, validarFechaFutura, validarMotivo,
//     requerido(mensaje)
//
//   validarFormulario(formulario, reglas) → true | false
//     reglas = { nombreDelCampo: (valor, formulario) => mensaje }
//     Muestra cada error bajo su campo, marca aria-invalid y lleva el foco al
//     primer campo con error.
//
//   mostrarErrorCampo(control, mensaje)  /  limpiarErrores(formulario)
//   activarValidacionAlSalir(formulario, reglas)  revalida cada campo al salir de él
//
// Convención de HTML que espera (ver componentes.css, sección 2):
//   <input id="X" name="X" aria-describedby="X-ayuda X-error">
//   <p id="X-error" class="campo__error" hidden></p>
// =============================================================================

import { hoyEnBogota } from './ui/formato.js';

// ---------- Límites (coordinados con los CHECK de P2 en sql/esquema.sql) ----------
// Regla: el cliente puede ser IGUAL o MÁS estricto que la base, nunca más
// permisivo; si no, el usuario pasaría esta validación y la base lo rechazaría.

export const LIMITES = Object.freeze({
  contrasenaMin: 8,
  nombresMin: 2,
  nombresMax: 100,    // la base acepta hasta 120 (ck_profiles_nombres)
  documentoMin: 4,    // ck_profiles_documento: ^[A-Za-z0-9-]{4,20}$
  documentoMax: 20,
  telefonoMax: 20,    // ck_profiles_telefono: ^[0-9 +()-]{7,20}$ (largo total)
  motivoMax: 200,     // plan P15: el motivo se limita a 200 caracteres
  edadMax: 120,
});

// ---------- Reglas ----------

/** Devuelve una regla que solo exige que el campo no esté vacío. */
export function requerido(mensaje = 'Este campo es obligatorio.') {
  return (valor) => (String(valor ?? '').trim() === '' ? mensaje : '');
}

export function validarCorreo(valor) {
  const correo = String(valor ?? '').trim();
  if (!correo) return 'Escribe tu correo electrónico.';
  // Patrón sencillo a propósito: algo@algo.algo. La validación definitiva la
  // hace Supabase Auth al enviar el correo de confirmación.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  }
  return '';
}

export function validarContrasena(valor) {
  const clave = String(valor ?? '');
  if (!clave) return 'Escribe una contraseña.';
  if (clave.length < LIMITES.contrasenaMin) {
    return `La contraseña debe tener al menos ${LIMITES.contrasenaMin} caracteres.`;
  }
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(clave) || !/\d/.test(clave)) {
    return 'La contraseña debe tener letras y números.';
  }
  return '';
}

/** Regla para "Repite la contraseña": compara con otro campo del mismo formulario. */
export function coincideCon(nombreOtroCampo, mensaje = 'Las contraseñas no coinciden.') {
  return (valor, formulario) => {
    if (!valor) return 'Repite la contraseña.';
    return valor === formulario.elements[nombreOtroCampo].value ? '' : mensaje;
  };
}

export function validarNombres(valor) {
  const nombres = normalizarEspacios(valor);
  if (!nombres) return 'Escribe tus nombres y apellidos.';
  if (nombres.length < LIMITES.nombresMin) return 'El nombre es demasiado corto.';
  if (nombres.length > LIMITES.nombresMax) {
    return `El nombre puede tener máximo ${LIMITES.nombresMax} caracteres.`;
  }
  // Letras (con tildes), espacios, apóstrofo, punto y guion: "María José O'Neil-Peña".
  if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]+$/.test(nombres)) {
    return 'El nombre solo puede tener letras, espacios, puntos, guiones y apóstrofos.';
  }
  return '';
}

/**
 * Documento de identidad. Se aceptan letras, números y guion (de 4 a 20
 * caracteres, igual que ck_profiles_documento) para cubrir cédula, tarjeta de identidad, pasaporte y los datos
 * ficticios 'TEST-0001' del plan (P15). No se valida el dígito de verificación:
 * es un sistema académico con datos inventados.
 */
export function validarDocumento(valor) {
  const documento = String(valor ?? '').trim();
  if (!documento) return 'Escribe tu número de documento.';
  const patron = new RegExp(`^[A-Za-z0-9-]{${LIMITES.documentoMin},${LIMITES.documentoMax}}$`);
  if (!patron.test(documento)) {
    return `El documento debe tener de ${LIMITES.documentoMin} a ${LIMITES.documentoMax} caracteres: letras, números o guion, sin espacios.`;
  }
  return '';
}

/**
 * Teléfono: de 7 a 15 dígitos y máximo 20 caracteres en total. Se permiten
 * espacios, guiones, paréntesis y '+' al inicio (ck_profiles_telefono).
 */
export function validarTelefono(valor) {
  const telefono = String(valor ?? '').trim();
  if (!telefono) return 'Escribe tu número de teléfono.';
  // Espacio literal y no \s: la base no acepta tabulaciones ni saltos de línea.
  if (!/^\+?[0-9 ()-]+$/.test(telefono)) {
    return 'El teléfono solo puede tener números, espacios, guiones y "+".';
  }
  const digitos = telefono.replace(/\D/g, '').length;
  if (digitos < 7 || digitos > 15) return 'El teléfono debe tener entre 7 y 15 dígitos.';
  if (telefono.length > LIMITES.telefonoMax) {
    return `El teléfono puede tener máximo ${LIMITES.telefonoMax} caracteres. Quita espacios o guiones.`;
  }
  return '';
}

/** Fecha de nacimiento 'AAAA-MM-DD': no futura y con una edad razonable. */
export function validarFechaNacimiento(valor) {
  if (!valor) return 'Escribe tu fecha de nacimiento.';
  if (!esFechaValida(valor)) return 'Escribe una fecha válida.';
  const hoy = hoyEnBogota();
  if (valor > hoy) return 'La fecha de nacimiento no puede ser futura.';
  const anioMinimo = Number(hoy.slice(0, 4)) - LIMITES.edadMax;
  if (Number(valor.slice(0, 4)) < anioMinimo) return 'Revisa el año de nacimiento.';
  return '';
}

/**
 * Fecha de hoy o futura (búsqueda de disponibilidad). Las fechas 'AAAA-MM-DD'
 * se pueden comparar como texto porque el orden alfabético coincide con el
 * cronológico. La base de datos también rechaza las franjas pasadas (FRANJA_PASADA).
 */
export function validarFechaFutura(valor) {
  if (!valor) return 'Elige una fecha.';
  if (!esFechaValida(valor)) return 'Escribe una fecha válida.';
  if (valor < hoyEnBogota()) return 'Elige hoy o una fecha futura.';
  return '';
}

/** Motivo de consulta: opcional, máximo 200 caracteres (plan P15). */
export function validarMotivo(valor) {
  const motivo = String(valor ?? '').trim();
  if (motivo.length > LIMITES.motivoMax) {
    return `El motivo puede tener máximo ${LIMITES.motivoMax} caracteres.`;
  }
  return '';
}

// ---------- Utilidades ----------

/** Quita espacios al inicio y al final y deja uno solo entre palabras. */
export function normalizarEspacios(valor) {
  return String(valor ?? '').trim().replace(/\s+/g, ' ');
}

/** true si el texto es una fecha 'AAAA-MM-DD' que existe (rechaza 2026-02-30). */
function esFechaValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [anio, mes, dia] = texto.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

// ---------- Mostrar errores en el formulario ----------

/** Busca el <p class="campo__error"> de un control (por su id: "<id>-error"). */
function elementoError(control) {
  return document.getElementById(`${control.id}-error`);
}

/** Muestra (o borra, si mensaje es '') el error de un control. */
export function mostrarErrorCampo(control, mensaje) {
  const salida = elementoError(control);
  if (mensaje) {
    control.setAttribute('aria-invalid', 'true');
    if (salida) {
      salida.textContent = mensaje;
      salida.hidden = false;
    }
  } else {
    control.removeAttribute('aria-invalid');
    if (salida) {
      salida.textContent = '';
      salida.hidden = true;
    }
  }
}

/** Borra todos los errores de un formulario. */
export function limpiarErrores(formulario) {
  for (const control of formulario.querySelectorAll('[aria-invalid]')) {
    mostrarErrorCampo(control, '');
  }
}

/**
 * Valida un formulario completo con las reglas dadas. Devuelve true si todo
 * está bien. Si hay errores, los muestra y enfoca el primer campo inválido
 * (el lector de pantalla lee la etiqueta y el error gracias a aria-describedby).
 */
export function validarFormulario(formulario, reglas) {
  let primerInvalido = null;
  for (const [nombre, regla] of Object.entries(reglas)) {
    const control = formulario.elements[nombre];
    if (!control) continue;
    const mensaje = regla(control.value, formulario);
    mostrarErrorCampo(control, mensaje);
    if (mensaje && !primerInvalido) primerInvalido = control;
  }
  if (primerInvalido) primerInvalido.focus();
  return primerInvalido === null;
}

/**
 * Revalida cada campo cuando el usuario sale de él ('blur'), pero solo si ya
 * tenía un error o si escribió algo. Así no aparecen errores en campos que la
 * persona todavía no ha tocado.
 */
export function activarValidacionAlSalir(formulario, reglas) {
  for (const [nombre, regla] of Object.entries(reglas)) {
    const control = formulario.elements[nombre];
    if (!control) continue;
    control.addEventListener('blur', () => {
      if (control.value === '' && !control.hasAttribute('aria-invalid')) return;
      mostrarErrorCampo(control, regla(control.value, formulario));
    });
  }
}
