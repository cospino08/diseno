// D-05 Citas de todos los profesionales (RF-18). Responsable: P4.
//
// Lee con citas_admin, que verifica en la base que quien llama es admin. Para cambiar el
// estado o cancelar (cancelación institucional) se abre el detalle de la cita, la misma
// página que usa el profesional (profesional/cita.html), que con un admin usa citas_admin.
import { protegerPagina, manejarSesionExpirada } from '../assets/js/auth.js';
import { citasAdmin } from '../assets/js/datos/citas.js';
import { listarProfesionales, listarEspecialidades } from '../assets/js/datos/catalogos.js';
import { mostrarCargando, mostrarError, mostrarVacio, limpiar, avisar } from '../assets/js/ui/estados.js';
import { mensajeDeError } from '../assets/js/ui/mensajes.js';
import { formatearFecha, hoyEnBogota, sumarDias } from '../assets/js/ui/formato.js';
import { conBotonOcupado } from '../assets/js/ui/formularios.js';
import { validarFormulario, requerido } from '../assets/js/validacion.js';
import {
  crearTabla, crearEnlace, etiquetaEstado, rangoHoras, llenarSelect,
} from './componentes.js';

const DIAS_MAXIMOS = 366; // límite de citas_admin (contrato 3.9)

const acceso = await protegerPagina({ roles: ['admin'] });

if (acceso) {
  const formulario = document.getElementById('form-filtros');
  const resumen = document.getElementById('resumen-citas');
  const zona = document.getElementById('zona-citas');
  const { desde, hasta, profesional, especialidad, estado } = formulario.elements;

  const hoy = hoyEnBogota();
  desde.value = hoy;
  hasta.value = sumarDias(hoy, 7);

  /** Días entre dos fechas 'AAAA-MM-DD'. */
  const diasEntre = (a, b) => (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000;

  async function cargarFiltros() {
    const [profesionales, especialidades] = await Promise.all([
      listarProfesionales({ incluirInactivos: true }),
      listarEspecialidades({ incluirInactivas: true }),
    ]);
    const error = profesionales.error ?? especialidades.error;
    if (error) return error;
    llenarSelect(profesional, profesionales.data.map((p) => ({ valor: p.id, texto: p.nombre_publico })), 'Todos');
    // citas_admin devuelve el NOMBRE de la especialidad, así que se filtra por nombre.
    llenarSelect(especialidad, especialidades.data.map((e) => ({ valor: e.nombre, texto: e.nombre })), 'Todas');
    return null;
  }

  async function consultar() {
    mostrarCargando(zona, 'Buscando citas…');
    resumen.textContent = '';
    const { data, error } = await citasAdmin({
      desde: desde.value,
      hasta: hasta.value,
      profesional: profesional.value ? Number(profesional.value) : null,
      estado: estado.value || null,
    });
    if (error) {
      if (manejarSesionExpirada(error)) return;
      mostrarError(zona, error, { reintentar: consultar });
      return;
    }
    const citas = especialidad.value ? data.filter((c) => c.especialidad === especialidad.value) : data;
    if (citas.length === 0) {
      mostrarVacio(zona, 'No hay citas con esos filtros.');
      return;
    }

    resumen.textContent = `${citas.length} ${citas.length === 1 ? 'cita' : 'citas'} del ${formatearFecha(desde.value)} al ${formatearFecha(hasta.value)}.`;
    limpiar(zona);
    zona.append(crearTabla({
      titulo: 'Citas encontradas',
      columnas: [
        { titulo: 'Fecha', valor: (c) => formatearFecha(c.fecha) },
        { titulo: 'Hora', valor: (c) => rangoHoras(c.hora_inicio, c.hora_fin) },
        { titulo: 'Paciente', valor: (c) => c.paciente_nombres },
        { titulo: 'Documento', valor: (c) => c.paciente_documento ?? '—' },
        { titulo: 'Profesional', valor: (c) => c.profesional },
        { titulo: 'Especialidad', valor: (c) => c.especialidad },
        { titulo: 'Estado', valor: (c) => etiquetaEstado(c.estado) },
        {
          titulo: 'Acción',
          valor: (c) => {
            const enlace = crearEnlace('Ver detalle', `../profesional/cita.html?id=${c.cita_id}`);
            enlace.setAttribute('aria-label',
              `Ver detalle de la cita del ${formatearFecha(c.fecha)} a las ${rangoHoras(c.hora_inicio, c.hora_fin)}`);
            return enlace;
          },
        },
      ],
      filas: citas,
    }));
  }

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const valido = validarFormulario(formulario, {
      desde: requerido('Elige la fecha inicial.'),
      hasta: (valor) => {
        const vacio = requerido('Elige la fecha final.')(valor);
        if (vacio) return vacio;
        const dias = diasEntre(desde.value, valor);
        if (dias < 0) return 'La fecha final no puede ser anterior a la inicial.';
        if (dias > DIAS_MAXIMOS) return 'El rango puede ser de máximo un año.';
        return '';
      },
    });
    if (!valido) return;
    await conBotonOcupado(formulario, 'Filtrando…', consultar);
  });

  const errorFiltros = await cargarFiltros();
  const redirigido = errorFiltros !== null && manejarSesionExpirada(errorFiltros);
  if (!redirigido) {
    if (errorFiltros) avisar(mensajeDeError(errorFiltros), 'error');
    consultar();
  }
}
