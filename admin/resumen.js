// D-01 Resumen del administrador. Responsable: P4.
// Las cifras salen de indicadores_citas (solo conteos agregados, plan P11).
import { protegerPagina, manejarSesionExpirada } from '../assets/js/auth.js';
import { indicadoresCitas } from '../assets/js/datos/indicadores.js';
import { ESTADOS } from '../assets/js/datos/citas.js';
import { mostrarCargando, mostrarError, limpiar } from '../assets/js/ui/estados.js';
import { nombreEstado } from '../assets/js/ui/mensajes.js';
import { formatearFechaLarga, hoyEnBogota, sumarDias } from '../assets/js/ui/formato.js';
import { crear, tarjetaCifra } from './componentes.js';

const acceso = await protegerPagina({ roles: ['admin'] });

if (acceso) {
  const hoy = hoyEnBogota();
  document.getElementById('fecha-hoy').textContent = `Hoy es ${formatearFechaLarga(hoy)}.`;

  /** Pinta el total y una tarjeta por estado en `zona`. */
  async function pintarPeriodo(zona, desde, hasta, textoCarga) {
    mostrarCargando(zona, textoCarga);
    const { data, error } = await indicadoresCitas(desde, hasta, 'dia');
    if (error) {
      if (manejarSesionExpirada(error)) return;
      mostrarError(zona, error, { reintentar: () => pintarPeriodo(zona, desde, hasta, textoCarga) });
      return;
    }
    const porEstado = Object.fromEntries(data.por_estado.map((fila) => [fila.estado, fila.total]));
    const lista = crear('ul', 'lista-tarjetas lista-tarjetas--doble');
    lista.append(tarjetaCifra(data.total, data.total === 1 ? 'cita en total' : 'citas en total'));
    for (const estado of ESTADOS) lista.append(tarjetaCifra(porEstado[estado] ?? 0, nombreEstado(estado)));
    limpiar(zona);
    zona.append(lista);
  }

  pintarPeriodo(document.getElementById('zona-hoy'), hoy, hoy, 'Contando las citas de hoy…');
  pintarPeriodo(document.getElementById('zona-semana'), hoy, sumarDias(hoy, 6), 'Contando las citas de la semana…');
}
