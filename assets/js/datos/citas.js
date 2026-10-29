// Acceso a datos de citas (responsable: P4; lo usan P3 y P4).
//
// Envuelve las tablas y RPC de docs/contrato_api.md (v1.2). Si P2 cambia el contrato, los
// nombres se ajustan AQUÍ y en ningún otro sitio: las páginas solo llaman a estas funciones.
//
// Todas devuelven { data, error } (ver respuesta.js). Ninguna lanza excepciones.
//
// Recordatorio de seguridad (contrato, sección 1): nadie escribe directamente en
// `appointments`. Toda escritura pasa por una RPC que valida en la base quién llama. Las
// lecturas directas solo devuelven las filas que la RLS permite a cada rol.
import { supabase } from './cliente.js';
import { ejecutar } from './respuesta.js';

/** Estados posibles de una cita (enum estado_cita). Para el texto visible: nombreEstado() de ui/mensajes.js. */
export const ESTADOS = ['programada', 'confirmada', 'atendida', 'cancelada', 'no_asistio'];

// ---------------------------------------------------------------------------------------
// Paciente (P3)
// ---------------------------------------------------------------------------------------

/**
 * Franjas libres y futuras (contrato 3.3). Todos los filtros son opcionales (null = todos).
 * Sin fecha, devuelve los próximos 30 días.
 * @param {{ especialidad?: number|null, profesional?: number|null, fecha?: string|null }} filtros
 *        fecha en formato 'AAAA-MM-DD'.
 */
export function franjasDisponibles({ especialidad = null, profesional = null, fecha = null } = {}) {
  return ejecutar(() => supabase.rpc('franjas_disponibles', {
    p_especialidad: especialidad,
    p_profesional: profesional,
    p_fecha: fecha,
  }));
}

/**
 * Reserva una franja (contrato 3.4). Devuelve en `data` el id de la cita creada.
 * Errores: SOLO_PACIENTES, PERFIL_INCOMPLETO, DATOS_INVALIDOS, FRANJA_NO_EXISTE,
 * FRANJA_PASADA, FRANJA_OCUPADA.
 */
export function reservarCita(idFranja, motivo = null) {
  return ejecutar(() => supabase.rpc('reservar_cita', {
    p_schedule_id: idFranja,
    p_motivo: motivo,
  }));
}

/**
 * Citas del paciente de la sesión, de la más reciente a la más antigua (contrato 3.5).
 * Cada fila trae `puede_cancelar` para decidir si se muestra el botón.
 * Errores: SOLO_PACIENTES.
 */
export function misCitas() {
  return ejecutar(() => supabase.rpc('mis_citas'));
}

/**
 * Cancela una cita (contrato 3.6): paciente dueño hasta 2 h antes, profesional asignado o
 * admin. La franja queda libre otra vez.
 * Errores: NO_AUTORIZADO, TRANSICION_INVALIDA, FUERA_DE_PLAZO.
 */
export function cancelarCita(idCita) {
  return ejecutar(() => supabase.rpc('cancelar_cita', { p_cita_id: idCita }));
}

// ---------------------------------------------------------------------------------------
// Profesional (P4)
// ---------------------------------------------------------------------------------------

/**
 * Agenda del profesional de la sesión entre dos fechas 'AAAA-MM-DD' incluidas (máximo 31
 * días), ordenada por fecha y hora (contrato 3.8). Incluye canceladas. Del paciente solo
 * trae nombre y teléfono.
 * Errores: NO_AUTORIZADO, DATOS_INVALIDOS.
 */
export function miAgenda(desde, hasta = desde) {
  return ejecutar(() => supabase.rpc('mi_agenda', { p_desde: desde, p_hasta: hasta }));
}

/**
 * Cambia el estado de una cita (contrato 3.7). Si `nuevoEstado` es el estado actual, solo
 * guarda las observaciones. Para cancelar se usa cancelarCita(), que además registra
 * quién canceló (`cancelado_por`).
 * Errores: NO_AUTORIZADO, TRANSICION_INVALIDA, ANTES_DE_HORA, DATOS_INVALIDOS.
 * @param {string|null} observaciones  null conserva las anteriores; máximo 500 caracteres.
 */
export function cambiarEstadoCita(idCita, nuevoEstado, observaciones = null) {
  return ejecutar(() => supabase.rpc('cambiar_estado_cita', {
    p_cita_id: idCita,
    p_estado: nuevoEstado,
    p_observaciones: observaciones,
  }));
}

// ---------------------------------------------------------------------------------------
// Detalle, historial y transiciones (profesional y admin)
// ---------------------------------------------------------------------------------------

/**
 * Detalle de una cita con los datos aplanados de mi_agenda (profesional) o de
 * citas_admin (admin), incluidos nombre y teléfono del paciente.
 *
 * Por qué dos pasos: el profesional no puede leer `profiles` de sus pacientes (RLS); los
 * datos del paciente solo llegan por mi_agenda / citas_admin, que piden un rango de
 * fechas. Primero se lee la fecha de la cita en `appointments` (la RLS solo deja ver las
 * propias) y luego se pide la agenda de ese día.
 *
 * Si la cita no existe o la RLS la oculta, devuelve { data: null, error: null }: la página
 * muestra "no encontrada o sin acceso" sin revelar cuál de las dos es (CP-03, CP-04).
 * @param {number} idCita
 * @param {{ comoAdmin?: boolean }} opciones
 */
export async function obtenerDetalleCita(idCita, { comoAdmin = false } = {}) {
  const base = await ejecutar(() => supabase
    .from('appointments')
    .select('id, franja:schedules ( fecha )')
    .eq('id', idCita)
    .maybeSingle());
  if (base.error || !base.data) return base;

  const fecha = base.data.franja.fecha;
  const dia = comoAdmin
    ? await citasAdmin({ desde: fecha, hasta: fecha })
    : await miAgenda(fecha, fecha);
  if (dia.error) return dia;
  return { data: dia.data.find((cita) => cita.cita_id === idCita) ?? null, error: null };
}

/** Historial de cambios de estado de una cita, del más antiguo al más reciente (contrato 2.6). */
export function historialCita(idCita) {
  return ejecutar(() => supabase
    .from('status_history')
    .select('id, estado_anterior, estado_nuevo, changed_by, changed_at')
    .eq('appointment_id', idCita)
    .order('changed_at', { ascending: true }));
}

/**
 * Transiciones permitidas, leídas de la tabla `transiciones_validas` (contrato 2.7) y
 * devueltas como mapa: { programada: ['confirmada', 'cancelada'], ... }.
 *
 * Se leen de la base en vez de copiarlas en JavaScript para que haya una sola fuente de
 * verdad. Sirven SOLO para no mostrar botones inútiles: quien bloquea una transición
 * inválida es la RPC (responde TRANSICION_INVALIDA, CP-10).
 */
export async function transicionesValidas() {
  const respuesta = await ejecutar(() => supabase.from('transiciones_validas').select('desde, hacia'));
  if (respuesta.error) return respuesta;
  const mapa = {};
  for (const { desde, hacia } of respuesta.data) {
    (mapa[desde] ??= []).push(hacia);
  }
  return { data: mapa, error: null };
}

// ---------------------------------------------------------------------------------------
// Administración (P4)
// ---------------------------------------------------------------------------------------

/**
 * Citas de todos los profesionales (contrato 3.9). Mismas columnas que mi_agenda más
 * professional_id, profesional, especialidad, patient_id y paciente_documento.
 * Rango máximo de 366 días. Por defecto: de hoy a 30 días.
 * Errores: NO_AUTORIZADO, DATOS_INVALIDOS.
 * @param {{ desde?: string|null, hasta?: string|null, profesional?: number|null, estado?: string|null }} filtros
 */
export function citasAdmin({ desde = null, hasta = null, profesional = null, estado = null } = {}) {
  // Solo se envían los parámetros con valor: así la base aplica sus valores por defecto.
  const parametros = {};
  if (desde) parametros.p_desde = desde;
  if (hasta) parametros.p_hasta = hasta;
  if (profesional) parametros.p_profesional = profesional;
  if (estado) parametros.p_estado = estado;
  return ejecutar(() => supabase.rpc('citas_admin', parametros));
}
