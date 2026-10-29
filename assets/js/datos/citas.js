// Acceso a datos de citas (responsable: P4; lo usan P3 y P4).
//
// Envuelve las RPC y consultas de la sección 7 del plan de trabajo. Cuando P2 publique
// docs/contrato_api.md, los nombres de columnas y parámetros se ajustan AQUÍ y en ningún
// otro sitio: las páginas solo llaman a estas funciones.
//
// Todas devuelven { data, error } (ver respuesta.js). Ninguna lanza excepciones.
//
// Recordatorio de seguridad: nadie escribe directamente en `appointments`. Toda escritura
// pasa por una RPC que valida en la base quién llama (plan, sección 4, P7). Las lecturas
// directas solo devuelven las filas que la RLS permite a cada rol.
import { supabase } from './cliente.js';
import { ejecutar } from './respuesta.js';

/** Estados posibles de una cita (enum estado_cita de la base). */
export const ESTADOS = ['programada', 'confirmada', 'atendida', 'cancelada', 'no_asistio'];

/** Texto legible de cada estado, para mostrar en la interfaz. */
export const NOMBRE_ESTADO = {
  programada: 'Programada',
  confirmada: 'Confirmada',
  atendida: 'Atendida',
  cancelada: 'Cancelada',
  no_asistio: 'No asistió',
};

/**
 * Transiciones válidas (plan, sección 4, P6). Es una COPIA de la tabla
 * `transiciones_validas` de la base, usada solo para no mostrar botones inútiles.
 * Quien de verdad bloquea una transición inválida es el trigger tg_validar_estado:
 * si esta tabla y la base no coinciden, manda la base (responde TRANSICION_INVALIDA).
 */
export const TRANSICIONES = {
  programada: ['confirmada', 'cancelada'],
  confirmada: ['atendida', 'no_asistio', 'cancelada'],
  atendida: [],
  cancelada: [],
  no_asistio: [],
};

/** Estados a los que puede pasar una cita desde `estadoActual`. */
export function transicionesDesde(estadoActual) {
  return TRANSICIONES[estadoActual] ?? [];
}

// Columnas que se leen de una cita con los datos de su franja, profesional y especialidad.
// Los nombres de las relaciones (schedules, professionals, specialties) son los del plan.
const COLUMNAS_CITA = `
  id, estado, motivo, observaciones, created_at, cancelled_at,
  patient_id, professional_id, schedule_id,
  franja:schedules ( fecha, hora_inicio, hora_fin ),
  profesional:professionals ( nombre_publico, especialidad:specialties ( nombre ) )
`;

// ---------------------------------------------------------------------------------------
// Paciente (P3)
// ---------------------------------------------------------------------------------------

/**
 * Franjas libres y futuras. Todos los filtros son opcionales (null = sin filtro).
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
 * Reserva una franja. Devuelve en `data` el id de la cita creada.
 * Errores: SOLO_PACIENTES, PERFIL_INCOMPLETO, FRANJA_NO_EXISTE, FRANJA_PASADA, FRANJA_OCUPADA.
 */
export function reservarCita(idFranja, motivo) {
  return ejecutar(() => supabase.rpc('reservar_cita', {
    p_schedule_id: idFranja,
    p_motivo: motivo,
  }));
}

/**
 * Cancela una cita (paciente dueño hasta 2 h antes; profesional asignado; admin).
 * Errores: NO_AUTORIZADO, FUERA_DE_PLAZO, TRANSICION_INVALIDA.
 */
export function cancelarCita(idCita) {
  return ejecutar(() => supabase.rpc('cancelar_cita', { p_cita_id: idCita }));
}

/**
 * Citas visibles para el usuario actual, de la más próxima a la más lejana.
 * La RLS hace que el paciente solo reciba las suyas; no hace falta filtrar por patient_id.
 */
export async function listarMisCitas() {
  const respuesta = await ejecutar(() => supabase.from('appointments').select(COLUMNAS_CITA));
  if (respuesta.data) respuesta.data.sort(compararPorFranja);
  return respuesta;
}

// Ordena por fecha y hora de la franja. Se hace en el navegador porque `.order()` con
// `referencedTable` ordena las filas embebidas, no las citas. Las fechas 'AAAA-MM-DD' y las
// horas 'HH:MM:SS' se comparan bien como texto.
function compararPorFranja(a, b) {
  const claveA = `${a.franja?.fecha ?? ''} ${a.franja?.hora_inicio ?? ''}`;
  const claveB = `${b.franja?.fecha ?? ''} ${b.franja?.hora_inicio ?? ''}`;
  return claveA.localeCompare(claveB);
}

// ---------------------------------------------------------------------------------------
// Profesional (P4)
// ---------------------------------------------------------------------------------------

/**
 * Agenda del profesional que inició sesión, entre dos fechas 'AAAA-MM-DD' (incluidas).
 * Incluye nombre y teléfono del paciente (y nada más del perfil, plan P9).
 * Errores: NO_AUTORIZADO.
 */
export function miAgenda(desde, hasta) {
  return ejecutar(() => supabase.rpc('mi_agenda', { p_desde: desde, p_hasta: hasta }));
}

/**
 * Cambia el estado de una cita (profesional asignado o admin).
 * Errores: NO_AUTORIZADO, ANTES_DE_HORA, TRANSICION_INVALIDA.
 */
export function cambiarEstadoCita(idCita, nuevoEstado) {
  return ejecutar(() => supabase.rpc('cambiar_estado_cita', {
    p_cita_id: idCita,
    p_estado: nuevoEstado,
  }));
}

// ---------------------------------------------------------------------------------------
// Detalle e historial (paciente, profesional y admin; la RLS decide qué ve cada uno)
// ---------------------------------------------------------------------------------------

/**
 * Una cita por id. Si la RLS no la permite, `data` es null y `error` es null:
 * la página debe mostrar "no encontrada o sin acceso" (CP-03).
 */
export function obtenerCita(idCita) {
  return ejecutar(() => supabase
    .from('appointments')
    .select(COLUMNAS_CITA)
    .eq('id', idCita)
    .maybeSingle());
}

/** Historial de cambios de estado de una cita, del más antiguo al más reciente. */
export function historialCita(idCita) {
  return ejecutar(() => supabase
    .from('status_history')
    .select('id, estado_anterior, estado_nuevo, changed_by, changed_at')
    .eq('appointment_id', idCita)
    .order('changed_at', { ascending: true }));
}

// ---------------------------------------------------------------------------------------
// Administración (P4)
// ---------------------------------------------------------------------------------------

/**
 * Todas las citas (solo un admin recibe filas de otros; la RLS lo garantiza).
 * @param {{ estado?: string|null, profesional?: number|null }} filtros
 */
export function listarCitas({ estado = null, profesional = null } = {}) {
  return ejecutar(() => {
    let consulta = supabase
      .from('appointments')
      .select(COLUMNAS_CITA)
      .order('created_at', { ascending: false })
      .limit(500);
    if (estado) consulta = consulta.eq('estado', estado);
    if (profesional) consulta = consulta.eq('professional_id', profesional);
    return consulta;
  });
}
