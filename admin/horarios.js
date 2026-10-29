// D-04 Horarios: generar franjas y moverlas o desactivarlas (RF-16, RF-17). Responsable: P4.
//
// Reglas que valida la BASE, no esta página (contrato 2.4 y 3.10):
//   - Franjas que se cruzan con otra activa del mismo profesional → HORARIO_SUPERPUESTO (CP-11).
//   - Mover o desactivar una franja con cita activa → FRANJA_CON_CITA (CP-12).
// La página deshabilita esas acciones cuando ya sabe que la franja tiene cita, para evitar
// el error, pero si alguien las llama desde la consola la base las rechaza igual.
import { protegerPagina, manejarSesionExpirada } from '../assets/js/auth.js';
import {
  listarProfesionales, listarFranjas, citaActivaDe, generarFranjas, actualizarFranja, cambiarActivoFranja,
} from '../assets/js/datos/catalogos.js';
import {
  mostrarCargando, mostrarError, mostrarVacio, mostrarExito, limpiar, avisar,
} from '../assets/js/ui/estados.js';
import { confirmar } from '../assets/js/ui/dialogo.js';
import { mensajeDeError, nombreEstado } from '../assets/js/ui/mensajes.js';
import { formatearFecha, formatearFechaLarga, formatearHora, hoyEnBogota } from '../assets/js/ui/formato.js';
import { conBotonOcupado } from '../assets/js/ui/formularios.js';
import { validarFormulario, limpiarErrores, requerido } from '../assets/js/validacion.js';
import {
  crear, crearTabla, crearBoton, grupoAcciones, prepararDialogo, llenarSelect, rangoHoras,
  parametroEntero, parametroFecha,
} from './componentes.js';

const acceso = await protegerPagina({ roles: ['admin'] });

if (acceso) {
  const formGenerar = document.getElementById('form-generar');
  const resultadoGenerar = document.getElementById('resultado-generar');
  const zonaFranjas = document.getElementById('zona-franjas');
  const tituloFranjas = document.getElementById('titulo-franjas');
  const { profesional, fecha, inicio, fin, minutos } = formGenerar.elements;

  const dialogoFranja = prepararDialogo(document.getElementById('dialogo-franja'));
  const formFranja = document.getElementById('form-franja');
  const resultadoFranja = document.getElementById('resultado-franja');
  let franjaEnEdicion = null;

  // La fecha sirve para generar y también para consultar días pasados, por eso no lleva
  // `min`: la validación del formulario impide generar en el pasado (y la base, FRANJA_PASADA).
  const hoy = hoyEnBogota();
  fecha.value = parametroFecha('fecha') ?? hoy;

  /** Hora 'HH:MM' de un <input type=time> en minutos desde medianoche. */
  const enMinutos = (hora) => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };

  // ---------- Profesionales activos ----------

  async function cargarProfesionales() {
    const { data, error } = await listarProfesionales();
    if (error) return error;
    llenarSelect(profesional, data.map((p) => ({
      valor: p.id, texto: `${p.nombre_publico} · ${p.especialidad?.nombre ?? ''}`,
    })), 'Elige un profesional');
    const preseleccion = parametroEntero('profesional');
    if (preseleccion) profesional.value = String(preseleccion);
    return null;
  }

  // ---------- Franjas del profesional en la fecha elegida ----------

  async function cargarFranjas() {
    if (!profesional.value || !fecha.value) {
      tituloFranjas.textContent = 'Franjas del día';
      mostrarVacio(zonaFranjas, 'Elige un profesional y una fecha para ver sus franjas.');
      return;
    }
    history.replaceState(null, '', `?profesional=${profesional.value}&fecha=${fecha.value}`);
    const nombre = profesional.selectedOptions[0]?.textContent.split(' · ')[0] ?? '';
    tituloFranjas.textContent = `Franjas de ${nombre} · ${formatearFechaLarga(fecha.value)}`;
    mostrarCargando(zonaFranjas, 'Cargando franjas…');

    const { data, error } = await listarFranjas({ profesional: Number(profesional.value), desde: fecha.value });
    if (error) {
      if (manejarSesionExpirada(error)) return;
      mostrarError(zonaFranjas, error, { reintentar: cargarFranjas });
      return;
    }
    if (data.length === 0) {
      mostrarVacio(zonaFranjas, 'Este profesional no tiene franjas ese día. Puedes generarlas con el formulario de arriba.');
      return;
    }

    limpiar(zonaFranjas);
    zonaFranjas.append(crearTabla({
      titulo: tituloFranjas.textContent,
      columnas: [
        { titulo: 'Hora', valor: (f) => rangoHoras(f.hora_inicio, f.hora_fin) },
        { titulo: 'Estado', valor: (f) => textoEstadoFranja(f) },
        { titulo: 'Acciones', valor: (f) => accionesFranja(f) },
      ],
      filas: data,
    }));
  }

  /** "Libre", "Con cita (Programada)", "Ocupada (Atendida)" o "Inactiva". */
  function textoEstadoFranja(franja) {
    if (!franja.activo) return crear('span', 'etiqueta etiqueta--inactivo', 'Inactiva');
    const activa = citaActivaDe(franja);
    if (activa) return crear('span', `etiqueta etiqueta--${activa.estado}`, `Con cita (${nombreEstado(activa.estado)})`);
    // Una cita atendida o no_asistio también ocupa la franja (índice único parcial de P2).
    const cerrada = (franja.citas ?? []).find((cita) => cita.estado !== 'cancelada');
    if (cerrada) return crear('span', `etiqueta etiqueta--${cerrada.estado}`, `Ocupada (${nombreEstado(cerrada.estado)})`);
    return crear('span', 'etiqueta etiqueta--activo', 'Libre');
  }

  function accionesFranja(franja) {
    const hora = formatearHora(franja.hora_inicio);
    if (citaActivaDe(franja)) {
      return crear('span', 'texto-suave', 'Bloqueada (cita activa)');
    }
    // Con una cita ya atendida o no asistida, la franja es historia: no se ofrece modificarla.
    if ((franja.citas ?? []).some((cita) => cita.estado !== 'cancelada')) {
      return crear('span', 'texto-suave', 'Cita terminada');
    }
    const mover = crearBoton('Cambiar hora', () => abrirFranja(franja));
    mover.setAttribute('aria-label', `Cambiar hora de la franja de las ${hora}`);
    const alternar = crearBoton(franja.activo ? 'Desactivar' : 'Activar', () => alternarFranja(franja),
      franja.activo ? 'peligro' : 'secundario');
    alternar.setAttribute('aria-label', `${franja.activo ? 'Desactivar' : 'Activar'} la franja de las ${hora}`);
    return grupoAcciones(mover, alternar);
  }

  async function alternarFranja(franja) {
    const hora = rangoHoras(franja.hora_inicio, franja.hora_fin);
    if (franja.activo) {
      const ok = await confirmar({
        titulo: '¿Desactivar esta franja?',
        detalles: [`${formatearFecha(franja.fecha)} · ${hora}`],
        mensaje: 'Dejará de estar disponible para reservar. Puedes volver a activarla.',
        textoAceptar: 'Sí, desactivar',
        textoCancelar: 'No, volver',
        peligro: true,
      });
      if (!ok) return;
    }
    const { error } = await cambiarActivoFranja(franja.id, !franja.activo);
    if (error) {
      if (manejarSesionExpirada(error)) return;
      avisar(mensajeDeError(error), 'error');
      cargarFranjas(); // si alguien reservó mientras tanto, la tabla muestra ahora la cita
      return;
    }
    avisar(`Franja de las ${formatearHora(franja.hora_inicio)} ${franja.activo ? 'desactivada' : 'activada'}.`);
    cargarFranjas();
  }

  function abrirFranja(franja) {
    franjaEnEdicion = franja;
    limpiar(resultadoFranja);
    limpiarErrores(formFranja);
    formFranja.elements.fecha.min = hoy;
    formFranja.elements.fecha.value = franja.fecha;
    formFranja.elements.inicio.value = formatearHora(franja.hora_inicio);
    formFranja.elements.fin.value = formatearHora(franja.hora_fin);
    dialogoFranja.abrir();
  }

  formFranja.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limpiar(resultadoFranja);
    const valido = validarFormulario(formFranja, {
      fecha: (valor) => requerido('Elige la fecha.')(valor) || (valor < hoy ? 'La fecha no puede ser pasada.' : ''),
      inicio: requerido('Escribe la hora de inicio.'),
      fin: (valor, form) => requerido('Escribe la hora de fin.')(valor)
        || (enMinutos(valor) <= enMinutos(form.elements.inicio.value) ? 'La hora de fin debe ser posterior a la de inicio.' : ''),
    });
    if (!valido) return;
    await conBotonOcupado(formFranja, 'Guardando…', async () => {
      const { error } = await actualizarFranja(franjaEnEdicion.id, {
        fecha: formFranja.elements.fecha.value,
        horaInicio: formFranja.elements.inicio.value,
        horaFin: formFranja.elements.fin.value,
      });
      if (error) {
        if (manejarSesionExpirada(error)) return;
        mostrarError(resultadoFranja, error);
        return;
      }
      dialogoFranja.cerrar();
      avisar('Franja actualizada.');
      cargarFranjas();
    });
  });

  // ---------- Generar franjas ----------

  formGenerar.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limpiar(resultadoGenerar);
    const valido = validarFormulario(formGenerar, {
      profesional: requerido('Elige un profesional.'),
      fecha: (valor) => requerido('Elige la fecha.')(valor) || (valor < hoy ? 'No se pueden crear franjas en fechas pasadas.' : ''),
      inicio: requerido('Escribe la hora de inicio.'),
      fin: (valor) => requerido('Escribe la hora de fin.')(valor)
        || (enMinutos(valor) - enMinutos(inicio.value) < Number(minutos.value)
          ? 'El rango debe alcanzar al menos para una franja completa.' : ''),
    });
    if (!valido) return;

    await conBotonOcupado(formGenerar, 'Generando…', async () => {
      const { data: creadas, error } = await generarFranjas({
        profesional: Number(profesional.value),
        fecha: fecha.value,
        inicio: inicio.value,
        fin: fin.value,
        minutos: Number(minutos.value),
      });
      if (error) {
        if (manejarSesionExpirada(error)) return;
        mostrarError(resultadoGenerar, error);
        // HORARIO_SUPERPUESTO: se muestran las franjas existentes para ver con cuáles se cruza.
        cargarFranjas();
        return;
      }
      mostrarExito(resultadoGenerar,
        `Se crearon ${creadas} ${creadas === 1 ? 'franja' : 'franjas'} de ${minutos.value} minutos el ${formatearFechaLarga(fecha.value)}.`,
        { titulo: 'Franjas generadas', enfocar: true });
      cargarFranjas();
    });
  });

  profesional.addEventListener('change', cargarFranjas);
  fecha.addEventListener('change', cargarFranjas);

  const errorProfesionales = await cargarProfesionales();
  if (errorProfesionales) {
    if (!manejarSesionExpirada(errorProfesionales)) {
      mostrarError(zonaFranjas, errorProfesionales, { reintentar: () => location.reload() });
    }
  } else {
    cargarFranjas();
  }
}
