// D-06 Indicadores: citas por estado, por especialidad y por periodo (RF-19). Responsable: P4.
//
// Los conteos los hace la base con indicadores_citas (plan P11): el navegador no descarga
// citas para contarlas. CP-15 compara estas cifras con un conteo SQL directo.
//
// Cada fila muestra la cifra y el porcentaje como TEXTO, y una barra <meter> como apoyo
// visual. El color o la barra nunca son la única forma de leer el dato (WCAG 1.4.1).
import { protegerPagina, manejarSesionExpirada } from '../assets/js/auth.js';
import { indicadoresCitas } from '../assets/js/datos/indicadores.js';
import { ESTADOS } from '../assets/js/datos/citas.js';
import { mostrarCargando, mostrarError, mostrarVacio, limpiar } from '../assets/js/ui/estados.js';
import { nombreEstado } from '../assets/js/ui/mensajes.js';
import { formatearFecha, formatearFechaLarga, hoyEnBogota } from '../assets/js/ui/formato.js';
import { conBotonOcupado } from '../assets/js/ui/formularios.js';
import { validarFormulario, requerido } from '../assets/js/validacion.js';
import { crear, crearTabla, etiquetaEstado, tarjetaCifra } from './componentes.js';

const acceso = await protegerPagina({ roles: ['admin'] });

if (acceso) {
  const formulario = document.getElementById('form-periodo');
  const zona = document.getElementById('zona-indicadores');
  const { desde, hasta, agrupacion } = formulario.elements;

  // Por defecto: el mes en curso hasta hoy.
  const hoy = hoyEnBogota();
  desde.value = `${hoy.slice(0, 8)}01`;
  hasta.value = hoy;

  const formatoMes = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  /** Nombre del periodo según la agrupación: 'jue 29 oct 2026', 'Semana del lun 26 oct 2026', 'octubre de 2026'. */
  function nombrePeriodo(periodo, tipo) {
    if (tipo === 'dia') return formatearFecha(periodo);
    if (tipo === 'semana') return `Semana del ${formatearFecha(periodo)}`;
    const [anio, mes] = periodo.split('-').map(Number);
    const texto = formatoMes.format(new Date(Date.UTC(anio, mes - 1, 1)));
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  /** Celda con la barra: <meter> decorativo (el número ya está en texto en otra columna). */
  function barra(valor, maximo) {
    const medidor = crear('meter');
    medidor.min = 0;
    medidor.max = Math.max(maximo, 1);
    medidor.value = valor;
    medidor.setAttribute('aria-hidden', 'true');
    medidor.style.inlineSize = '100%';
    return medidor;
  }

  // '6,3 %' con coma decimal, como se escribe en Colombia.
  const formatoPorcentaje = new Intl.NumberFormat('es-CO', { style: 'percent', maximumFractionDigits: 1 });
  function porcentaje(valor, total) {
    return formatoPorcentaje.format(total ? valor / total : 0);
  }

  /** Sección con un h2 y una tabla Nombre | Citas | % | Barra. */
  function seccion(tituloSeccion, columnaNombre, filas, total) {
    const bloque = crear('section');
    bloque.append(crear('h2', null, tituloSeccion));
    const maximo = Math.max(0, ...filas.map((fila) => fila.total));
    bloque.append(crearTabla({
      titulo: tituloSeccion,
      columnas: [
        { titulo: columnaNombre, valor: (fila) => fila.nombre },
        { titulo: 'Citas', valor: (fila) => fila.total },
        { titulo: 'Porcentaje', valor: (fila) => porcentaje(fila.total, total) },
        { titulo: 'Proporción', valor: (fila) => barra(fila.total, maximo) },
      ],
      filas,
    }));
    return bloque;
  }

  async function consultar() {
    mostrarCargando(zona, 'Calculando indicadores…');
    const tipo = agrupacion.value;
    const { data, error } = await indicadoresCitas(desde.value, hasta.value, tipo);
    if (error) {
      if (manejarSesionExpirada(error)) return;
      mostrarError(zona, error, { reintentar: consultar });
      return;
    }
    if (data.total === 0) {
      mostrarVacio(zona, 'No hay citas en ese periodo.');
      return;
    }

    // Todos los estados aparecen, también los que tienen 0, en el orden del ciclo de vida.
    const porEstado = Object.fromEntries(data.por_estado.map((fila) => [fila.estado, fila.total]));
    const filasEstado = ESTADOS.map((estado) => ({ nombre: etiquetaEstado(estado), total: porEstado[estado] ?? 0 }));
    const filasEspecialidad = [...data.por_especialidad]
      .sort((a, b) => b.total - a.total)
      .map((fila) => ({ nombre: fila.especialidad, total: fila.total }));
    const filasPeriodo = [...data.por_periodo]
      .sort((a, b) => a.periodo.localeCompare(b.periodo))
      .map((fila) => ({ nombre: nombrePeriodo(fila.periodo, tipo), total: fila.total }));

    const cifras = crear('ul', 'lista-tarjetas lista-tarjetas--doble');
    cifras.append(
      tarjetaCifra(data.total, `citas del ${formatearFechaLarga(desde.value)} al ${formatearFechaLarga(hasta.value)}`),
      tarjetaCifra(porcentaje(porEstado.atendida ?? 0, data.total), 'atendidas'),
      tarjetaCifra(porcentaje((porEstado.cancelada ?? 0) + (porEstado.no_asistio ?? 0), data.total), 'canceladas o sin asistencia'),
    );

    limpiar(zona);
    zona.append(
      cifras,
      seccion('Citas por estado', 'Estado', filasEstado, data.total),
      seccion('Citas por especialidad', 'Especialidad', filasEspecialidad, data.total),
      seccion(`Citas por ${{ dia: 'día', semana: 'semana', mes: 'mes' }[tipo]}`, 'Periodo', filasPeriodo, data.total),
    );
  }

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const valido = validarFormulario(formulario, {
      desde: requerido('Elige la fecha inicial.'),
      hasta: (valor) => requerido('Elige la fecha final.')(valor)
        || (valor < desde.value ? 'La fecha final no puede ser anterior a la inicial.' : ''),
    });
    if (!valido) return;
    await conBotonOcupado(formulario, 'Consultando…', consultar);
  });

  consultar();
}
