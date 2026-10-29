-- =============================================================================
-- crear_cuentas_demo.sql  —  SOLO PARA PRUEBAS LOCALES. NO EJECUTAR EN SUPABASE.
-- =============================================================================
-- Simula el paso manual de datos_prueba.sql ("Add user" en el panel de Supabase):
-- crea las 5 cuentas de demostración en la tabla auth.users simulada, sin
-- contraseña. En Supabase estas cuentas se crean desde el panel.
-- =============================================================================
insert into auth.users (id, aud, role, email, raw_user_meta_data)
select gen_random_uuid(), 'authenticated', 'authenticated', c.email,
       c.metadatos
from (values
  ('admin@demo.test',        '{"nombres": "Administración Demo"}'::jsonb),
  ('profesional1@demo.test', '{"nombres": "Laura Gómez Demo"}'),
  ('profesional2@demo.test', '{"nombres": "Andrés Ruiz Demo"}'),
  ('paciente1@demo.test',    '{"nombres": "Ana Pérez Demo"}'),
  -- paciente2 intenta registrarse como admin enviando "rol" en los metadatos
  -- (lo que haría un atacante con signUp). El trigger lo ignora: queda paciente.
  ('paciente2@demo.test',    '{"nombres": "Carlos Díaz Demo", "rol": "admin"}')
) as c(email, metadatos);
