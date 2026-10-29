-- =============================================================================
-- simular_supabase.sql  —  SOLO PARA PRUEBAS LOCALES. NO EJECUTAR EN SUPABASE.
-- =============================================================================
-- Recrea lo mínimo de Supabase que usan nuestros scripts, para poder probarlos en
-- un PostgreSQL local (por ejemplo, el contenedor oficial postgres:15):
--   * Los roles anon, authenticated y service_role.
--   * El esquema auth con la tabla auth.users y la función auth.uid().
--   * El esquema extensions.
--   * Los privilegios por defecto de Supabase: toda tabla o función nueva en
--     public queda accesible para anon y authenticated. Simularlo es importante,
--     porque es justo lo que nuestros scripts deben revocar.
--
-- Uso (en una base local vacía):
--   psql -f sql/local/simular_supabase.sql
--   psql -f sql/esquema.sql -f sql/politicas_rls.sql
--   psql -f sql/local/crear_cuentas_demo.sql      (reemplaza el paso manual)
--   psql -f sql/datos_prueba.sql -f sql/pruebas_seguridad.sql
-- =============================================================================

-- Los roles son de todo el servidor; se crean solo si no existen para poder
-- reconstruir la base varias veces en el mismo contenedor.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

create schema auth;
create schema extensions;
grant usage on schema auth, extensions to anon, authenticated, service_role;

-- Columnas que existen en auth.users de Supabase y que usa datos_prueba.sql.
create table auth.users (
  instance_id                uuid,
  id                         uuid primary key,
  aud                        varchar(255),
  role                       varchar(255),
  email                      varchar(255) unique,
  encrypted_password         varchar(255),
  email_confirmed_at         timestamptz,
  confirmation_token         varchar(255),
  recovery_token             varchar(255),
  email_change_token_new     varchar(255),
  email_change               varchar(255),
  raw_app_meta_data          jsonb,
  raw_user_meta_data         jsonb,
  created_at                 timestamptz default now(),
  updated_at                 timestamptz default now()
);

-- Igual que en Supabase: el id del usuario sale del JWT, que PostgREST deja en la
-- variable de sesión request.jwt.claims.
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create function auth.role() returns text language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;

-- Privilegios por defecto que Supabase aplica en el esquema public.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
