// R-01 Agenda propia del profesional (RF-10). Responsable: P4.
//
// Muestra las citas de UN día con mi_agenda(). La RPC solo devuelve las citas del
// profesional de la sesión: aunque alguien manipule esta página, no puede ver la agenda
// de otro (CP-22). Del paciente solo llegan nombre y teléfono (plan P9).
import { protegerPagina, manejarSesionExpirada } from '../assets/js/auth.js';
import { miAgenda } from '../assets/js/datos/citas.js';
import { mostrarCargando, mostrarError, mostrarVacio, limpiar } from '../assets/js/ui/estados.js';
import { formatearFechaLarga, hoyEnBogota, sumarDias } from '../assets/js/ui/formato.js';
import { nombreEstado } from '../assets/js/ui/mensajes.js';
import {
  crearTabla, crearEnlace, etiquetaEstado, rangoHoras, parametroFecha,
} from '../admin/componentes.js';

const acceso = await protegerPagina({ roles: ['profesional'] });

if (acceso) {
  const campoFecha = document.getElementById('fecha');
  const campoEstado = document.getElementById('estado');
  const titulo = document.getElementById('titulo-dia');
  const resumen = document.getElementById('resumen-dia');
  const zona = document.getElementById('zona-agenda');

  // Citas del día cargado. El filtro por estado se aplica en el navegador sobre esta lista,
  // sin volver a consultar la base.
  let citasDelDia = [];

  campoFecha.value = parametroFecha('fecha') ?? hoyEnBogota();

  async function cargar() {
    const fecha = campoFecha.value || hoyEnBogota();
    // La fecha queda en la URL para volver al mismo día desde el detalle de una cita.
    history.replaceState(null, '', `?fecha=${fecha}`);
    titulo.textContent = `Citas del ${formatearFechaLarga(fecha)}`;
    resumen.textContent = '';
    mostrarCargando(zona, 'Cargando tu agenda…');

    const { data, error } = await miAgenda(fecha);
    if (error) {
      if (manejarSesionExpirada(error)) return;
      mostrarError(zona, error, { reintentar: cargar });
      return;
    }
    citasDelDia = data;
    pintar();
  }

  function pintar() {
    const estado = campoEstado.value;
    const visibles = estado ? citasDelDia.filter((cita) => cita.estado === estado) : citasDelDia;

    resumen.textContent = textoResumen(citasDelDia);
    if (visibles.length === 0) {
      mostrarVacio(zona, estado
        ? `No hay citas en estado "${nombreEstado(estado)}" este día.`
        : 'No tienes citas este día.');
      return;
    }

    limpiar(zona);
    zona.append(crearTabla({
      titulo: titulo.textContent,
      columnas: [
        { titulo: 'Hora', valor: (c) => rangoHoras(c.hora_inicio, c.hora_fin) },
        { titulo: 'Paciente', valor: (c) => c.paciente_nombres },
        { titulo: 'Teléfono', valor: (c) => c.paciente_telefono ?? '—' },
        { titulo: 'Motivo', valor: (c) => c.motivo || '—' },
        { titulo: 'Estado', valor: (c) => etiquetaEstado(c.estado) },
        {
          titulo: 'Acción',
          valor: (c) => {
            const enlace = crearEnlace('Ver detalle', `cita.html?id=${c.cita_id}`);
            // Nombre accesible distinto por fila: "Ver detalle de la cita de las 08:00".
            enlace.setAttribute('aria-label', `Ver detalle de la cita de las ${rangoHoras(c.hora_inicio, c.hora_fin)}`);
            return enlace;
          },
        },
      ],
      filas: visibles,
    }));
  }

  /** "12 citas: Programada 4, Confirmada 6, Cancelada 2." */
  function textoResumen(citas) {
    if (citas.length === 0) return '';
    const conteo = {};
    for (const cita of citas) conteo[cita.estado] = (conteo[cita.estado] ?? 0) + 1;
    const partes = Object.entries(conteo).map(([estado, total]) => `${nombreEstado(estado)} ${total}`);
    return `${citas.length} ${citas.length === 1 ? 'cita' : 'citas'}: ${partes.join(', ')}.`;
  }

  function moverDia(dias) {
    campoFecha.value = sumarDias(campoFecha.value || hoyEnBogota(), dias);
    cargar();
  }

  document.getElementById('dia-anterior').addEventListener('click', () => moverDia(-1));
  document.getElementById('dia-siguiente').addEventListener('click', () => moverDia(1));
  document.getElementById('hoy').addEventListener('click', () => {
    campoFecha.value = hoyEnBogota();
    cargar();
  });
  campoFecha.addEventListener('change', () => { if (campoFecha.value) cargar(); });
  campoEstado.addEventListener('change', pintar);
  document.getElementById('form-dia').addEventListener('submit', (evento) => {
    evento.preventDefault();
    cargar();
  });

  cargar();
}
