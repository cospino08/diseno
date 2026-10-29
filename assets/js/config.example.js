// Plantilla de assets/js/config.js (responsable: P4).
//
// Para usar otro proyecto de Supabase: copia este archivo como config.js y reemplaza los
// dos valores con los de Supabase > Project Settings > API.
//
// La clave anon (o publishable) es PÚBLICA POR DISEÑO: cualquier visitante de la página la
// puede ver en el navegador. Lo que protege los datos son las políticas RLS y las funciones
// RPC de la base de datos, no esconder esta clave.
//
// NUNCA pongas aquí la service_role ni la secret key: saltan todas las RLS.
export const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxxxxxx';
