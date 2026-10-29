// R-02 Detalle de cita y cambio de estado (RF-11, RF-13, RF-18). Responsable: P4.
//
// Solo se muestran los botones de las transiciones válidas desde el estado actual, leídas
// de la tabla transiciones_validas. Eso es USABILIDAD: si alguien llama a la RPC desde la
// consola con una transición inválida (por ejemplo atendida → programada), la base la
// rechaza con TRANSICION_INVALIDA (CP-10). Y si la cita no es suya, con NO_AUTORIZADO (CP-04).
import { protegerPagina, manejarSesionExpirada } from '../assets/js/auth.js';
import {
  obtenerDetalleCita, transicionesValidas, historialCita, cambiarEstadoCita, cancelarCita,
} from '../assets/js/datos/citas.js';
import {
  mostrarCargando, mostrarError, mostrarVacio, limpiar, avisar,
} from '../assets/js/ui/estados.js';
import { confirmar } from '../assets/js/ui/dialogo.js';
import { nombreEstado } from '../assets/js/ui/mensajes.js';
import { formatearFecha, formatearHora, instanteDeFranja } from '../assets/js/ui/formato.js';
import { contadorDeCaracteres, conBotonOcupado } from '../assets/js/ui/formularios.js';
import { limpiarErrores, mostrarErrorCampo } from '../assets/js/validacion.js';
import {
  crear, crearBoton, etiquetaEstado, rangoHoras, fechaYHora, formatearInstante, parametroEntero,
} from '../admin/componentes.js';

const acceso = await protegerPagina({ roles: ['profesional', 'admin'] });

if (acceso) {
  const comoAdmin = acceso.perfil.rol === 'admin';
  const idCita = parametroEntero('id');

  const titulo = document.getElementById('titulo-cita');
  const zona = document.getElementById('zona-cita');
  const contenido = document.getElementById('contenido-cita');
  const datos = document.getElementById('datos-cita');
  const resultado = document.getElementById('resultado-cambio');
  const formulario = document.getElementById('form-estado');
  const observaciones = document.getElementById('observaciones');
  const botones = document.getElementById('botones-estado');
  const textoTransiciones = document.getElementById('texto-transiciones');
  const zonaHistorial = document.getElementById('zona-historial');
  const volver = document.getElementById('enlace-volver');

  // Menú y enlace de regreso según el rol (solo navegación; no da permisos).
  for (const item of document.querySelectorAll('[data-rol]')) {
    item.hidden = item.dataset.rol !== acceso.perfil.rol;
  }
  volver.href = comoAdmin ? '../admin/citas.html' : 'agenda.html';
  volver.textContent = comoAdmin ? '◂ Volver a citas' : '◂ Volver a mi agenda';
  contadorDeCaracteres(observaciones, document.getElementById('observaciones-contador'));

  /** Cita mostrada en pantalla (fila de mi_agenda o citas_admin). */
  let cita = null;

  async function cargar() {
    if (idCita === null) {
      mostrarError(zona, 'La dirección no tiene un número de cita válido.');
      return;
    }
    contenido.hidden = true;
    mostrarCargando(zona, 'Cargando la cita…');

    const [detalle, transiciones, historial] = await Promise.all([
      obtenerDetalleCita(idCita, { comoAdmin }),
      transicionesValidas(),
      historialCita(idCita),
    ]);
    const error = detalle.error ?? transiciones.error ?? historial.error;
    if (error) {
      if (manejarSesionExpirada(error)) return;
      mostrarError(zona, error, { reintentar: cargar });
      return;
    }
    if (!detalle.data) {
      // No se distingue "no existe" de "no es tuya", para no revelar qué citas existen.
      mostrarVacio(zona, 'No encontramos esta cita o no tienes acceso a ella.',
        { texto: volver.textContent.replace('◂ ', ''), href: volver.href });
      return;
    }

    cita = detalle.data;
    limpiar(zona);
    titulo.textContent = `Cita del ${formatearFecha(cita.fecha)} · ${formatearHora(cita.hora_inicio)}`;
    document.title = `${titulo.textContent} · Clínica San Rafael`;
    if (!comoAdmin) volver.href = `agenda.html?fecha=${cita.fecha}`;

    pintarDatos();
    pintarTransiciones(transiciones.data[cita.estado] ?? []);
    pintarHistorial(historial.data);
    observaciones.value = cita.observaciones ?? '';
    observaciones.dispatchEvent(new Event('input')); // actualiza el contador
    contenido.hidden = false;
  }

  function pintarDatos() {
    const filas = [
      ['Fecha', formatearFecha(cita.fecha)],
      ['Hora', rangoHoras(cita.hora_inicio, cita.hora_fin)],
      ['Paciente', cita.paciente_nombres],
      ['Teléfono', cita.paciente_telefono ?? '—'],
    ];
    if (comoAdmin) {
      filas.push(['Documento', cita.paciente_documento ?? '—'],
        ['Profesional', cita.profesional], ['Especialidad', cita.especialidad]);
    }
    filas.push(['Motivo', cita.motivo || '—'], ['Estado', etiquetaEstado(cita.estado)]);
    if (cita.estado === 'cancelada' && cita.cancelado_por) {
      filas.push(['Cancelada por', cita.cancelado_por === 'paciente' ? 'El paciente' : 'La institución']);
    }

    datos.replaceChildren();
    for (const [nombre, valor] of filas) {
      const grupo = crear('div');
      const dd = crear('dd');
      if (valor instanceof Node) dd.append(valor);
      else dd.textContent = valor;
      grupo.append(crear('dt', null, nombre), dd);
      datos.append(grupo);
    }
  }

  // Texto de cada botón según el estado de destino.
  const ACCION_HACIA = {
    confirmada: 'Confirmar cita',
    atendida: 'Marcar atendida',
    no_asistio: 'Marcar no asistió',
  };

  /** Destinos válidos desde el estado actual (para volver a pintar los botones tras un error). */
  let destinosActuales = [];

  function pintarTransiciones(destinos) {
    destinosActuales = destinos;
    botones.replaceChildren();
    if (destinos.length === 0) {
      textoTransiciones.textContent =
        `La cita está en un estado final (${nombreEstado(cita.estado)}): ya no admite cambios de estado.`;
      return;
    }

    // Atendida y no asistió solo se pueden marcar desde la hora de inicio (ANTES_DE_HORA).
    // Se avisa y se deshabilitan para prevenir el error; la base lo valida de todos modos.
    const inicio = instanteDeFranja(cita.fecha, cita.hora_inicio);
    const antesDeHora = Date.now() < inicio.getTime();
    textoTransiciones.textContent = antesDeHora && destinos.some((d) => d === 'atendida' || d === 'no_asistio')
      ? `Podrás marcarla como atendida o no asistió desde las ${formatearHora(cita.hora_inicio)} del ${formatearFecha(cita.fecha)}.`
      : '';

    for (const destino of destinos) {
      if (destino === 'cancelada') continue; // va al final, como acción de peligro
      const boton = crearBoton(ACCION_HACIA[destino] ?? `Pasar a ${nombreEstado(destino)}`,
        () => cambiarEstado(destino), destino === 'confirmada' ? 'primario' : 'secundario');
      boton.disabled = antesDeHora && (destino === 'atendida' || destino === 'no_asistio');
      botones.append(boton);
    }
    if (destinos.includes('cancelada')) {
      botones.append(crearBoton('Cancelar cita', cancelar, 'peligro'));
    }
  }

  function pintarHistorial(cambios) {
    if (cambios.length === 0) {
      mostrarVacio(zonaHistorial, 'Esta cita aún no tiene cambios registrados.');
      return;
    }
    const lista = crear('ol', 'lista-tarjetas');
    for (const cambio of cambios) {
      const item = crear('li', 'tarjeta');
      const texto = cambio.estado_anterior
        ? `${nombreEstado(cambio.estado_anterior)} → ${nombreEstado(cambio.estado_nuevo)}`
        : `Cita creada (${nombreEstado(cambio.estado_nuevo)})`;
      item.append(crear('p', 'tarjeta__titulo', texto));
      const quien = cambio.changed_by === acceso.sesion.user.id ? ' · por ti' : '';
      item.append(crear('p', 'tarjeta__meta', `${formatearInstante(cambio.changed_at)}${quien}`));
      lista.append(item);
    }
    limpiar(zonaHistorial);
    zonaHistorial.append(lista);
  }

  /**
   * Observaciones del formulario: el texto nuevo, null para conservar las guardadas, o
   * undefined si no son válidas. Un texto vacío también es null porque la RPC conserva las
   * anteriores cuando recibe vacío (contrato 3.7): no se pueden borrar desde aquí.
   */
  function leerObservaciones() {
    limpiarErrores(formulario);
    const texto = observaciones.value.trim();
    if (texto.length > 500) {
      mostrarErrorCampo(observaciones, 'Las observaciones tienen máximo 500 caracteres.');
      return undefined;
    }
    return texto === '' || texto === (cita.observaciones ?? '') ? null : texto;
  }

  async function cambiarEstado(destino) {
    const notas = leerObservaciones();
    if (notas === undefined) return;
    const ok = await confirmar({
      titulo: `¿${ACCION_HACIA[destino] ?? `Pasar a ${nombreEstado(destino)}`}?`,
      detalles: [fechaYHora(cita.fecha, cita.hora_inicio, cita.hora_fin), cita.paciente_nombres],
      mensaje: `La cita pasará de ${nombreEstado(cita.estado)} a ${nombreEstado(destino)}.`,
      textoAceptar: 'Sí, cambiar',
      textoCancelar: 'No, volver',
    });
    if (!ok) return;
    await ejecutarCambio(() => cambiarEstadoCita(cita.cita_id, destino, notas),
      `Estado actualizado: ${nombreEstado(destino)}.`);
  }

  async function cancelar() {
    const ok = await confirmar({
      titulo: '¿Cancelar esta cita?',
      detalles: [fechaYHora(cita.fecha, cita.hora_inicio, cita.hora_fin), cita.paciente_nombres],
      mensaje: 'La franja quedará libre para otro paciente. El paciente verá la cita como cancelada por la institución.',
      textoAceptar: 'Sí, cancelar',
      textoCancelar: 'No, volver',
      peligro: true,
    });
    if (!ok) return;
    await ejecutarCambio(() => cancelarCita(cita.cita_id), 'Cita cancelada.');
  }

  /** Ejecuta un cambio, muestra el resultado y recarga la cita y su historial. */
  async function ejecutarCambio(accion, textoExito) {
    limpiar(resultado);
    for (const boton of botones.querySelectorAll('button')) boton.disabled = true;
    const { error } = await accion();
    if (error) {
      if (manejarSesionExpirada(error)) return;
      mostrarError(resultado, error);
      // Si el estado cambió en otra pestaña (TRANSICION_INVALIDA), se recarga para mostrar el real.
      if (error.codigo === 'TRANSICION_INVALIDA') await cargar();
      else pintarTransiciones(destinosActuales);
      return;
    }
    avisar(textoExito);
    await cargar();
  }

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const notas = leerObservaciones();
    if (notas === undefined) return;
    if (notas === null) {
      avisar('No hay cambios en las observaciones.', 'info');
      return;
    }
    await conBotonOcupado(formulario, 'Guardando…', async () => {
      // Mismo estado = solo se guardan las observaciones (contrato 3.7).
      await ejecutarCambio(() => cambiarEstadoCita(cita.cita_id, cita.estado, notas), 'Observaciones guardadas.');
    });
  });

  cargar();
}
