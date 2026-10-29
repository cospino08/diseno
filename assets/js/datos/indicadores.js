// Indicadores de citas para el panel administrativo (responsable: P4).
//
// Con RLS, contar citas desde el navegador obligaría a descargarlas todas. Por eso la RPC
// indicadores_citas (P2) verifica en la base que quien llama es admin y devuelve SOLO
// conteos agregados, sin datos de pacientes (plan, sección 4, P11).
//
// Devuelve { data, error } (ver respuesta.js).
import { supabase } from './cliente.js';
import { ejecutar } from './respuesta.js';

/** Agrupaciones que acepta la RPC para `por_periodo`. */
export const AGRUPACIONES = ['dia', 'semana', 'mes'];

/**
 * Conteos de las citas cuya franja cae entre dos fechas 'AAAA-MM-DD' incluidas
 * (contrato 3.14). `data` es:
 *   {
 *     total: 523,
 *     por_estado:       [{ estado, total }],
 *     por_especialidad: [{ especialidad, total }],
 *     por_periodo:      [{ periodo: 'AAAA-MM-DD', total }]   // inicio del día, semana o mes
 *   }
 * Errores: NO_AUTORIZADO, DATOS_INVALIDOS (hasta < desde o agrupación desconocida).
 * @param {'dia'|'semana'|'mes'} agrupacion
 */
export function indicadoresCitas(desde, hasta, agrupacion = 'mes') {
  return ejecutar(() => supabase.rpc('indicadores_citas', {
    p_desde: desde,
    p_hasta: hasta,
    p_agrupacion: agrupacion,
  }));
}
