// Cliente único de Supabase para toda la aplicación (responsable: P4).
//
// Todas las páginas y módulos importan `supabase` desde aquí. Así hay una sola instancia,
// una sola sesión y un solo lugar donde cambiar la configuración.
//
//   import { supabase } from '../assets/js/datos/cliente.js';
//
// La librería se carga por CDN con la versión fijada (sin Node ni empaquetadores), como
// indica la sección 0.2 del plan de trabajo.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // La sesión se guarda en localStorage y se renueva sola mientras la pestaña esté abierta.
    persistSession: true,
    autoRefreshToken: true,
    // Necesario para que funcione el enlace de recuperación de contraseña que envía Supabase.
    detectSessionInUrl: true,
  },
});
