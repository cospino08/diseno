// =============================================================================
// ui/formato.js: formato de fechas y horas para mostrar, en hora de Bogotá.
// Dueño: P3. Lo usan P3 y P4.
//
// Decisión C8 del plan: todo se maneja en hora de America/Bogota, y las franjas
// se guardan como fecha (date) + hora (time) locales de la clínica, SIN zona
// horaria. Por eso aquí NO se usa new Date('2026-10-29'): JavaScript lo
// interpreta como medianoche UTC y en Colombia (UTC-5) se vería como el día
// anterior. Se arma la fecha con Date.UTC y se formatea en 'UTC', así el día
// mostrado es exactamente el guardado.
//
// API:
//   formatearFecha('2026-10-29')    → 'jue 29 oct 2026'
//   formatearFechaLarga('2026-10-29') → 'jueves, 29 de octubre de 2026'
//   formatearHora('08:30:00')       → '08:30'
//   hoyEnBogota()                   → '2026-10-28' (para <input type=date min>)
//   sumarDias('2026-10-29', 1)      → '2026-10-30'
//   instanteDeFranja('2026-10-29', '08:30:00') → Date (el instante real, para comparar con ahora)
// =============================================================================

const ZONA_CLINICA = 'America/Bogota';
// Colombia no tiene horario de verano, así que el desfase es fijo: UTC-5.
const DESFASE_BOGOTA = '-05:00';

/** '2026-10-29' → Date en UTC a medianoche (uso interno). */
function fechaUTC(textoFecha) {
  const [anio, mes, dia] = textoFecha.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

const formatoCorto = new Intl.DateTimeFormat('es-CO', {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
});
const formatoLargo = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
});

/** 'jue 29 oct 2026'. Intl agrega puntos y comas ("jue., 29 oct. 2026"); se quitan para leer mejor. */
export function formatearFecha(textoFecha) {
  return formatoCorto.format(fechaUTC(textoFecha)).replace(/\./g, '').replace(/,/g, '');
}

/** 'jueves, 29 de octubre de 2026'. */
export function formatearFechaLarga(textoFecha) {
  return formatoLargo.format(fechaUTC(textoFecha));
}

/** '08:30:00' → '08:30' (formato de 24 h, sin ambigüedad AM/PM). */
export function formatearHora(textoHora) {
  return String(textoHora).slice(0, 5);
}

/** Fecha de hoy en Bogotá como 'AAAA-MM-DD', sin importar la zona del computador. */
export function hoyEnBogota() {
  // El formato 'en-CA' produce justo AAAA-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_CLINICA }).format(new Date());
}

/** Suma (o resta, con negativos) días a una fecha 'AAAA-MM-DD'. */
export function sumarDias(textoFecha, dias) {
  const fecha = fechaUTC(textoFecha);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

/**
 * Instante real (Date) en que empieza una franja, interpretando fecha y hora
 * como hora de Bogotá. Sirve para comparar con Date.now(), por ejemplo para
 * ocultar el botón "Cancelar" a menos de 2 h. Ojo: es solo para la interfaz; la
 * regla real la valida cancelar_cita en la base de datos.
 */
export function instanteDeFranja(textoFecha, textoHora) {
  return new Date(`${textoFecha}T${formatearHora(textoHora)}:00${DESFASE_BOGOTA}`);
}
