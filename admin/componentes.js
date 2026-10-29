// Piezas de interfaz que repiten los paneles del profesional y del administrador.
// Responsable: P4. Usa solo clases del CSS de P3 (assets/css/componentes.css).
//
// Está en admin/ porque P4 solo escribe en sus carpetas; profesional/ también lo importa.
// Si P3 lo considera útil para el paciente, puede moverse a assets/js/ui/.
//
// SEGURIDAD: todo dato que viene de la base entra con textContent y createElement.
// Nunca innerHTML (enunciado 8.2, prueba CP-18).
import { nombreEstado } from '../assets/js/ui/mensajes.js';
import { formatearFecha, formatearHora } from '../assets/js/ui/formato.js';

/**
 * Crea un elemento con clase y texto opcionales.
 * @param {string} etiqueta  'p', 'td', 'button'...
 * @param {string} [clase]
 * @param {string|number|null} [texto]  se asigna con textContent
 */
export function crear(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined && texto !== null) nodo.textContent = String(texto);
  return nodo;
}

/** Botón (type=button) con texto y acción. variante: 'primario' | 'secundario' | 'peligro' | 'enlace'. */
export function crearBoton(texto, alPulsar, variante = 'secundario') {
  const boton = crear('button', `boton boton--${variante}`, texto);
  boton.type = 'button';
  boton.addEventListener('click', alPulsar);
  return boton;
}

/** Enlace con texto. */
export function crearEnlace(texto, href) {
  const enlace = crear('a', null, texto);
  enlace.href = href;
  return enlace;
}

/** Etiqueta de color de un estado de cita: <span class="etiqueta etiqueta--confirmada">Confirmada</span>. */
export function etiquetaEstado(estado) {
  return crear('span', `etiqueta etiqueta--${estado}`, nombreEstado(estado));
}

/** Etiqueta Activa/Inactiva para catálogos. El texto no depende solo del color (WCAG 1.4.1). */
export function etiquetaActivo(activo, { si = 'Activo', no = 'Inactivo' } = {}) {
  return crear('span', `etiqueta etiqueta--${activo ? 'activo' : 'inactivo'}`, activo ? si : no);
}

/** '08:00 – 08:30' a partir de dos horas 'HH:MM:SS'. */
export function rangoHoras(inicio, fin) {
  return `${formatearHora(inicio)} – ${formatearHora(fin)}`;
}

/** 'jue 29 oct 2026 · 08:00 – 08:30'. */
export function fechaYHora(fecha, inicio, fin) {
  return `${formatearFecha(fecha)} · ${rangoHoras(inicio, fin)}`;
}

/** Instante timestamptz (ISO, UTC) mostrado en hora de Bogotá: '29/10/2026, 10:02'. */
export function formatearInstante(textoISO) {
  if (!textoISO) return '';
  return new Date(textoISO).toLocaleString('es-CO', {
    timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short',
  });
}

/**
 * Tabla accesible con el patrón de P3 (.tabla): en móvil cada fila se ve como tarjeta y
 * cada celda muestra su encabezado gracias a data-etiqueta. Lleva roles explícitos porque
 * algunos navegadores pierden la semántica de tabla al cambiar el display (ver
 * componentes.css, sección 11).
 *
 * @param {object} opciones
 * @param {string} opciones.titulo  título accesible de la tabla (<caption>, oculto a la vista)
 * @param {Array<{ titulo: string, valor: (fila: any) => (string|number|Node|null) }>} opciones.columnas
 * @param {any[]} opciones.filas
 * @returns {HTMLTableElement}
 */
export function crearTabla({ titulo, columnas, filas }) {
  const tabla = crear('table', 'tabla');
  tabla.setAttribute('role', 'table');

  const leyenda = crear('caption', 'visualmente-oculto', titulo);
  const thead = crear('thead');
  thead.setAttribute('role', 'rowgroup');
  const filaEncabezado = crear('tr');
  filaEncabezado.setAttribute('role', 'row');
  for (const columna of columnas) {
    const th = crear('th', null, columna.titulo);
    th.setAttribute('role', 'columnheader');
    th.scope = 'col';
    filaEncabezado.append(th);
  }
  thead.append(filaEncabezado);

  const tbody = crear('tbody');
  tbody.setAttribute('role', 'rowgroup');
  for (const fila of filas) {
    const tr = crear('tr');
    tr.setAttribute('role', 'row');
    for (const columna of columnas) {
      const td = crear('td');
      td.setAttribute('role', 'cell');
      td.dataset.etiqueta = columna.titulo;
      const valor = columna.valor(fila);
      if (valor instanceof Node) td.append(valor);
      else if (valor !== null && valor !== undefined) td.textContent = String(valor);
      tr.append(td);
    }
    tbody.append(tr);
  }

  tabla.append(leyenda, thead, tbody);
  return tabla;
}

/**
 * Prepara un <dialog class="dialogo"> que contiene un formulario (crear o editar).
 * Los botones con [data-cerrar] lo cierran. El <dialog> nativo atrapa el foco, se cierra
 * con Esc y devuelve el foco al botón que lo abrió (igual que ui/dialogo.js de P3).
 */
export function prepararDialogo(dialogo) {
  for (const boton of dialogo.querySelectorAll('[data-cerrar]')) {
    boton.addEventListener('click', () => dialogo.close());
  }
  return {
    abrir() {
      dialogo.showModal();
      dialogo.querySelector('input:not([type=hidden]), select, textarea')?.focus();
    },
    cerrar() {
      dialogo.close();
    },
  };
}

/**
 * Reemplaza las opciones de un <select>.
 * @param {HTMLSelectElement} select
 * @param {Array<{ valor: string|number, texto: string }>} opciones
 * @param {string|null} [textoVacio]  si se da, agrega primero una opción con valor ''.
 */
export function llenarSelect(select, opciones, textoVacio = null) {
  const anterior = select.value;
  select.replaceChildren();
  if (textoVacio !== null) select.append(new Option(textoVacio, ''));
  for (const { valor, texto } of opciones) select.append(new Option(texto, String(valor)));
  // Conserva la selección si la opción sigue existiendo.
  if ([...select.options].some((opcion) => opcion.value === anterior)) select.value = anterior;
}

/** Tarjeta con una cifra grande y su descripción (resumen e indicadores). */
export function tarjetaCifra(cifra, descripcion) {
  const tarjeta = crear('li', 'tarjeta');
  tarjeta.append(crear('p', 'tarjeta__titulo', cifra), crear('p', 'tarjeta__meta', descripcion));
  return tarjeta;
}

/** Contenedor para varios botones de una celda o fila (clase .acciones de P3). */
export function grupoAcciones(...botones) {
  const grupo = crear('div', 'acciones');
  grupo.append(...botones.filter(Boolean));
  return grupo;
}

/**
 * Lee un parámetro numérico de la URL (?id=12). Devuelve null si no es un entero positivo:
 * así un valor manipulado no llega a la base como texto raro (la base igual lo validaría).
 */
export function parametroEntero(nombre) {
  const valor = new URLSearchParams(location.search).get(nombre);
  return /^[1-9]\d{0,17}$/.test(valor ?? '') ? Number(valor) : null;
}

/** Lee un parámetro de fecha 'AAAA-MM-DD' de la URL, o null si no tiene ese formato. */
export function parametroFecha(nombre) {
  const valor = new URLSearchParams(location.search).get(nombre);
  return /^\d{4}-\d{2}-\d{2}$/.test(valor ?? '') ? valor : null;
}
