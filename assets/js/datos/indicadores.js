// Indicadores de citas para el panel administrativo (responsable: P4).
//
// Con RLS, el navegador no puede leer todas las citas para contarlas. Por eso la RPC
// indicadores_citas (P2) verifica en la base que quien llama es admin y devuelve SOLO
// conteos agregados, sin datos de pacientes (plan, sección 4, P11).
//
// Devuelve { data, error } (ver respuesta.js).
import { supabase } from './cliente.js';
import { ejecutar } from './respuesta.js';

/**
 * Conteos de citas cuya franja cae entre dos fechas 'AAAA-MM-DD' (incluidas):
 * por estado, por especialidad y por periodo. La forma exacta de `data` la fija
 * docs/contrato_api.md.
 * Errores: NO_AUTORIZADO.
 */
export function indicadoresCitas(desde, hasta) {
  return ejecutar(() => supabase.rpc('indicadores_citas', { p_desde: desde, p_hasta: hasta }));
}
