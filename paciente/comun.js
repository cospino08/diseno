// =============================================================================
// paciente/comun.js: piezas que comparten las vistas del paciente (P-01 a P-05).
// Dueño: P3.
//
// API:
//   misCitas()                       → { data: filas de mis_citas, error }
//   esProxima(cita)                  → true si está programada/confirmada y no ha terminado
//   separarCitas(citas)              → { proximas (más cercana primero), historial (más reciente primero) }
//   crearEtiquetaEstado(cita)        → <span class="etiqueta …">Programada</span>
//   crearTarjetaCita(cita, { nivel }) → <article class="tarjeta"> con fecha, hora, profesional…
//   urlBuscar({ especialidad, profesional, fecha, aviso }) → 'buscar.html?…'
//
// Seguridad: todo dato que viene de la base (nombres, motivo, observaciones)
// entra con textContent. Nunca innerHTML (CP-18).
// =============================================================================

import { supabase } from '../assets/js/datos/cliente.js';
import { ejecutar } from '../assets/js/datos/respuesta.js';
import { nombreEstado } from '../assets/js/ui/mensajes.js';
import { formatearFecha, formatearHora, instanteDeFranja } from '../assets/js/ui/formato.js';

/**
 * Citas del paciente de la sesión (RPC mis_citas, contrato 3.5). Devuelve las
 * columnas ya aplanadas: cita_id, fecha, hora_inicio, hora_fin, estado, motivo,
 * observaciones, profesional, especialidad, cancelado_por, puede_cancelar…
 * La base solo devuelve las citas propias: el filtro lo hace la RPC con
 * auth.uid(), no esta función.
 *
 * TODO(P3): pasar a assets/js/datos/citas.js cuando P4 agregue misCitas()
 * (pedido en docs/ESTADO.md). Mientras tanto se usa el mismo cliente y el mismo
 * formato { data, error } de la capa de datos.
 */
export function misCitas() {
  return ejecutar(() => supabase.rpc('mis_citas'));
}

const ESTADOS_ACTIVOS = ['programada', 'confirmada'];

/**
 * "Próxima" = programada o confirmada y todavía no ha terminado (se compara con
 * la hora de FIN, para que una cita en curso siga apareciendo como próxima).
 */
export function esProxima(cita, ahora = Date.now()) {
  return ESTADOS_ACTIVOS.includes(cita.estado) && instanteDeFranja(cita.fecha, cita.hora_fin) > ahora;
}

/** Separa y ordena las citas para las pestañas de "Mis citas" y el inicio. */
export function separarCitas(citas) {
  const clave = (cita) => `${cita.fecha} ${cita.hora_inicio}`;
  const proximas = citas.filter((cita) => esProxima(cita))
    .sort((a, b) => clave(a).localeCompare(clave(b)));
  const historial = citas.filter((cita) => !esProxima(cita))
    .sort((a, b) => clave(b).localeCompare(clave(a)));
  return { proximas, historial };
}

/**
 * Etiqueta de estado. El color nunca va solo: siempre lleva el texto (WCAG 1.4.1).
 * Si la canceló alguien que no es el paciente (profesional o admin), se dice
 * "Cancelada por la institución" (contrato 2.5, columna cancelado_por).
 */
export function crearEtiquetaEstado(cita) {
  const etiqueta = document.createElement('span');
  etiqueta.className = `etiqueta etiqueta--${cita.estado}`;
  const porInstitucion = cita.estado === 'cancelada' && cita.cancelado_por && cita.cancelado_por !== 'paciente';
  etiqueta.textContent = porInstitucion ? 'Cancelada por la institución' : nombreEstado(cita.estado);
  return etiqueta;
}

/** Párrafo "Etiqueta: valor" con el valor como texto. */
function parrafoConEtiqueta(etiqueta, valor) {
  const p = document.createElement('p');
  const fuerte = document.createElement('strong');
  fuerte.textContent = `${etiqueta}: `;
  p.append(fuerte, document.createTextNode(valor));
  return p;
}

/**
 * Tarjeta de una cita (wireframe P-04). `nivel` es la etiqueta del título
 * ('h2' o 'h3') para respetar la jerarquía de encabezados de cada página.
 */
export function crearTarjetaCita(cita, { nivel = 'h2' } = {}) {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'tarjeta';

  const titulo = document.createElement(nivel);
  titulo.className = 'tarjeta__titulo';
  titulo.textContent = `${formatearFecha(cita.fecha)} · ${formatearHora(cita.hora_inicio)}`;

  const profesional = document.createElement('p');
  profesional.className = 'tarjeta__meta';
  profesional.textContent = `${cita.profesional} · ${cita.especialidad}`;

  const estado = document.createElement('p');
  estado.append(crearEtiquetaEstado(cita));

  tarjeta.append(titulo, profesional, estado);
  if (cita.motivo) tarjeta.append(parrafoConEtiqueta('Motivo', cita.motivo));
  if (cita.observaciones) tarjeta.append(parrafoConEtiqueta('Nota de la clínica', cita.observaciones));
  return tarjeta;
}

/** URL de la búsqueda con filtros (omite los vacíos). Se usa para volver a P-02. */
export function urlBuscar({ especialidad, profesional, fecha, aviso } = {}) {
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries({ especialidad, profesional, fecha, aviso })) {
    if (valor) parametros.set(clave, valor);
  }
  const texto = parametros.toString();
  return texto ? `buscar.html?${texto}` : 'buscar.html';
}
