// Acceso a datos de catálogos: especialidades, profesionales y horarios (franjas).
// Responsable: P4. Lo usan P3 (búsqueda) y P4 (administración).
//
// Todas las funciones devuelven { data, error } (ver respuesta.js).
//
// Borrado: especialidades, profesionales y franjas NUNCA se borran; se desactivan
// (`activo = false`, plan, sección 4, P13). Por eso aquí no hay funciones de eliminar.
//
// Las escrituras solo funcionan para un admin: lo garantizan las políticas RLS de P2.
// Que el botón aparezca o no en la interfaz no da ni quita permisos.
import { supabase } from './cliente.js';
import { ejecutar } from './respuesta.js';

// ---------------------------------------------------------------------------------------
// Especialidades (tabla specialties)
// ---------------------------------------------------------------------------------------

/**
 * Lista especialidades ordenadas por nombre.
 * @param {{ incluirInactivas?: boolean }} opciones  true solo en el panel de admin.
 */
export function listarEspecialidades({ incluirInactivas = false } = {}) {
  return ejecutar(() => {
    let consulta = supabase
      .from('specialties')
      .select('id, nombre, descripcion, activo')
      .order('nombre');
    if (!incluirInactivas) consulta = consulta.eq('activo', true);
    return consulta;
  });
}

/** Crea una especialidad. Error DUPLICADO si el nombre ya existe. */
export function crearEspecialidad({ nombre, descripcion = '' }) {
  return ejecutar(() => supabase
    .from('specialties')
    .insert({ nombre, descripcion })
    .select('id, nombre, descripcion, activo')
    .single());
}

/** Edita nombre y descripción de una especialidad. */
export function actualizarEspecialidad(id, { nombre, descripcion }) {
  return ejecutar(() => supabase
    .from('specialties')
    .update({ nombre, descripcion })
    .eq('id', id)
    .select('id, nombre, descripcion, activo')
    .single());
}

/** Activa o desactiva una especialidad (borrado lógico). */
export function cambiarActivoEspecialidad(id, activo) {
  return ejecutar(() => supabase
    .from('specialties')
    .update({ activo })
    .eq('id', id)
    .select('id, activo')
    .single());
}

// ---------------------------------------------------------------------------------------
// Profesionales (tabla professionals)
//
// Un profesional NO se crea con insert desde aquí: la persona se registra como paciente y
// un admin la promueve con asignarRol() de perfiles.js, que crea la fila en professionals
// (plan, sección 4, P10). Crear cuentas ajenas exigiría la service_role, que está prohibida.
// ---------------------------------------------------------------------------------------

const COLUMNAS_PROFESIONAL = `
  id, nombre_publico, registro_profesional, activo, specialty_id,
  especialidad:specialties ( id, nombre )
`;

/**
 * Lista profesionales ordenados por nombre.
 * @param {{ especialidad?: number|null, incluirInactivos?: boolean }} opciones
 */
export function listarProfesionales({ especialidad = null, incluirInactivos = false } = {}) {
  return ejecutar(() => {
    let consulta = supabase
      .from('professionals')
      .select(COLUMNAS_PROFESIONAL)
      .order('nombre_publico');
    if (especialidad) consulta = consulta.eq('specialty_id', especialidad);
    if (!incluirInactivos) consulta = consulta.eq('activo', true);
    return consulta;
  });
}

/** Edita el nombre público, la especialidad o el registro profesional. */
export function actualizarProfesional(id, { nombrePublico, especialidad, registroProfesional = null }) {
  return ejecutar(() => supabase
    .from('professionals')
    .update({
      nombre_publico: nombrePublico,
      specialty_id: especialidad,
      registro_profesional: registroProfesional,
    })
    .eq('id', id)
    .select(COLUMNAS_PROFESIONAL)
    .single());
}

/** Activa o desactiva un profesional (borrado lógico). */
export function cambiarActivoProfesional(id, activo) {
  return ejecutar(() => supabase
    .from('professionals')
    .update({ activo })
    .eq('id', id)
    .select('id, activo')
    .single());
}

// ---------------------------------------------------------------------------------------
// Horarios (tabla schedules). Cada fila es UNA franja concreta (plan, corrección C2).
// ---------------------------------------------------------------------------------------

/**
 * Franjas de un profesional entre dos fechas 'AAAA-MM-DD' (incluidas), activas o no.
 * Para buscar franjas LIBRES (paciente) usa franjasDisponibles() de citas.js.
 */
export function listarFranjas({ profesional, desde, hasta }) {
  return ejecutar(() => supabase
    .from('schedules')
    .select('id, professional_id, fecha, hora_inicio, hora_fin, activo')
    .eq('professional_id', profesional)
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha')
    .order('hora_inicio'));
}

/**
 * Crea en bloque franjas de `minutos` minutos entre `inicio` y `fin` ('HH:MM') de una fecha.
 * Devuelve en `data` el número de franjas creadas.
 * Errores: NO_AUTORIZADO, HORARIO_SUPERPUESTO (la restricción de exclusión las rechaza, CP-11).
 */
export function generarFranjas({ profesional, fecha, inicio, fin, minutos }) {
  return ejecutar(() => supabase.rpc('generar_franjas', {
    p_profesional: profesional,
    p_fecha: fecha,
    p_inicio: inicio,
    p_fin: fin,
    p_minutos: minutos,
  }));
}

/**
 * Mueve una franja a otra fecha u hora.
 * Si la franja tiene una cita activa, el trigger de P2 lo rechaza (plan P12, CP-12).
 */
export function actualizarFranja(id, { fecha, horaInicio, horaFin }) {
  return ejecutar(() => supabase
    .from('schedules')
    .update({ fecha, hora_inicio: horaInicio, hora_fin: horaFin })
    .eq('id', id)
    .select('id, fecha, hora_inicio, hora_fin, activo')
    .single());
}

/** Activa o desactiva una franja. Rechazado si tiene una cita activa (plan P12). */
export function cambiarActivoFranja(id, activo) {
  return ejecutar(() => supabase
    .from('schedules')
    .update({ activo })
    .eq('id', id)
    .select('id, activo')
    .single());
}
