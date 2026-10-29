-- =============================================================================
-- datos_prueba.sql  —  Paso 3 de 3. Datos FICTICIOS para la demostración.
-- =============================================================================
-- Requiere esquema.sql y politicas_rls.sql. Dueño: P2.
-- Todos los datos son inventados (P15): documentos TEST-xxxx, teléfonos
-- 300 000 xxxx y correos @demo.test (dominio reservado que no recibe correo).
-- No hay diagnósticos ni información clínica: los motivos son administrativos.
--
-- -----------------------------------------------------------------------------
-- PASO MANUAL PREVIO (una sola vez): crear las 5 cuentas de demostración
-- -----------------------------------------------------------------------------
-- Este script NO crea contraseñas (nunca se escriben en el repositorio). Las
-- cuentas con las que se inicia sesión se crean a mano en el panel de Supabase:
--
--   Authentication → Users → Add user → Create new user
--     * Email:    uno de los 5 de abajo
--     * Password: la que el equipo elija (se entrega al docente por un canal
--                 privado, NO en el repositorio)
--     * Marcar "Auto Confirm User" (los correos @demo.test no reciben mensajes)
--
--   admin@demo.test         → será administrador (primer admin, ver sección 2)
--   profesional1@demo.test  → Medicina general
--   profesional2@demo.test  → Pediatría
--   paciente1@demo.test     → paciente con perfil completo
--   paciente2@demo.test     → segundo paciente (pruebas de acceso a citas ajenas)
--
-- Al crearlas, el trigger trg_nuevo_usuario les crea el perfil como "paciente".
-- Después se ejecuta este archivo completo en el SQL Editor.
--
-- Además, el script crea pacientes y profesionales ficticios SIN contraseña
-- (no pueden iniciar sesión): solo sirven para llenar la agenda y probar el
-- rendimiento con más de 500 citas (RNF-02, CP-17).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. Verificar que existen las cuentas de demostración
-- -----------------------------------------------------------------------------
-- Todo el archivo va en una transacción: si algo falla, no queda nada a medias.
begin;

do $$
declare
  v_faltan text;
begin
  select string_agg(correo, ', ') into v_faltan
  from unnest(array['admin@demo.test', 'profesional1@demo.test', 'profesional2@demo.test',
                    'paciente1@demo.test', 'paciente2@demo.test']) as correo
  where not exists (select 1 from auth.users u where u.email = correo);

  if v_faltan is not null then
    raise exception 'Faltan cuentas de demostración: %', v_faltan
      using hint = 'Créelas en Authentication > Users > Add user (Auto Confirm User) y vuelva a ejecutar.';
  end if;
end
$$;


-- -----------------------------------------------------------------------------
-- 1. Especialidades
-- -----------------------------------------------------------------------------
insert into public.specialties (nombre, descripcion, activo) values
  ('Medicina general', 'Consulta de atención primaria para adultos.',          true),
  ('Pediatría',        'Atención de niños y adolescentes.',                     true),
  ('Dermatología',     'Consulta de piel, cabello y uñas.',                     true),
  ('Ginecología',      'Consulta de salud femenina.',                           true),
  ('Nutrición',        'Especialidad inactiva para probar el borrado lógico.',  false);


-- -----------------------------------------------------------------------------
-- 2. PASO MANUAL: nombrar el primer administrador (P10)
-- -----------------------------------------------------------------------------
-- Nadie puede volverse admin desde la aplicación: asignar_rol exige que quien
-- llama YA sea admin. Por eso el primero se nombra aquí, en el SQL Editor (que
-- se ejecuta como postgres y no pasa por RLS). Para nombrar a otra persona como
-- primer admin, cambie el correo y ejecute solo esta sentencia.
update public.profiles
   set rol = 'admin'
 where id = (select id from auth.users where email = 'admin@demo.test');


-- -----------------------------------------------------------------------------
-- 3. Perfiles completos de las cuentas de demostración
-- -----------------------------------------------------------------------------
update public.profiles p
   set nombres = d.nombres, documento = d.documento,
       telefono = d.telefono, fecha_nacimiento = d.nacimiento
  from (values
    ('admin@demo.test',        'Administración Demo',  'TEST-0001', '300 000 0001', date '1985-03-10'),
    ('profesional1@demo.test', 'Laura Gómez Demo',     'TEST-0002', '300 000 0002', date '1980-07-22'),
    ('profesional2@demo.test', 'Andrés Ruiz Demo',     'TEST-0003', '300 000 0003', date '1978-11-05'),
    ('paciente1@demo.test',    'Ana Pérez Demo',       'TEST-0004', '300 000 0004', date '1995-01-15'),
    ('paciente2@demo.test',    'Carlos Díaz Demo',     'TEST-0005', '300 000 0005', date '1990-09-30')
  ) as d(email, nombres, documento, telefono, nacimiento)
  join auth.users u on u.email = d.email
 where p.id = u.id;


-- -----------------------------------------------------------------------------
-- 4. Usuarios ficticios sin acceso (no tienen contraseña)
-- -----------------------------------------------------------------------------
-- Se insertan directamente en auth.users para que existan sus perfiles. Los
-- campos *_token van en '' (no null) porque Supabase Auth falla al listar
-- usuarios cuando esos campos son null.
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
                        created_at, updated_at, confirmation_token, recovery_token,
                        email_change_token_new, email_change)
select '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       f.email, '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('nombres', f.nombres), now(), now(), '', '', '', ''
from (
  select format('paciente.ficticio%s@demo.test', lpad(n::text, 2, '0')) as email,
         format('Paciente Ficticio %s', lpad(n::text, 2, '0'))          as nombres
  from generate_series(1, 20) as n
  union all
  select 'profesional.ficticio1@demo.test', 'Marta Ríos Ficticia'
  union all
  select 'profesional.ficticio2@demo.test', 'Jorge León Ficticio'
) as f;

-- Perfiles completos para los ficticios (el trigger ya creó la fila).
update public.profiles p
   set documento        = format('TEST-%s', lpad((100 + n.num)::text, 4, '0')),
       telefono         = format('300 000 %s', lpad((100 + n.num)::text, 4, '0')),
       fecha_nacimiento = date '1960-01-01' + (n.num * 397)::int
  from (select u.id, row_number() over (order by u.email) as num
        from auth.users u where u.email like '%.ficticio%@demo.test') as n
 where p.id = n.id;


-- -----------------------------------------------------------------------------
-- 5. Profesionales
-- -----------------------------------------------------------------------------
-- En la aplicación esto se hace con asignar_rol; aquí se hace directo porque el
-- SQL Editor no tiene sesión de admin (auth.uid() es null).
update public.profiles
   set rol = 'profesional'
 where id in (select id from auth.users
              where email in ('profesional1@demo.test', 'profesional2@demo.test',
                              'profesional.ficticio1@demo.test', 'profesional.ficticio2@demo.test'));

insert into public.professionals (profile_id, specialty_id, nombre_publico, registro_profesional)
select u.id, e.id, d.nombre_publico, d.registro
from (values
  ('profesional1@demo.test',          'Medicina general', 'Dra. Laura Gómez',  'RM-DEMO-001'),
  ('profesional2@demo.test',          'Pediatría',        'Dr. Andrés Ruiz',   'RM-DEMO-002'),
  ('profesional.ficticio1@demo.test', 'Dermatología',     'Dra. Marta Ríos',   'RM-DEMO-003'),
  ('profesional.ficticio2@demo.test', 'Ginecología',      'Dr. Jorge León',    'RM-DEMO-004')
) as d(email, especialidad, nombre_publico, registro)
join auth.users u        on u.email = d.email
join public.specialties e on e.nombre = d.especialidad;


-- -----------------------------------------------------------------------------
-- 6. Franjas: 20 días atrás y 14 días adelante, de lunes a viernes (y siempre
--    hoy, para que la agenda del día tenga datos), de 08:00 a 12:00 y de 14:00 a
--    18:00 en bloques de 30 minutos (16 franjas por día y profesional).
-- -----------------------------------------------------------------------------
insert into public.schedules (professional_id, fecha, hora_inicio, hora_fin)
select p.id, d::date, t::time, (t + interval '30 minutes')::time
from public.professionals p
cross join generate_series(public.hoy_local() - 20, public.hoy_local() + 14, interval '1 day') as d
cross join (
  select generate_series(timestamp '2000-01-01 08:00', timestamp '2000-01-01 11:30', interval '30 minutes')
  union all
  select generate_series(timestamp '2000-01-01 14:00', timestamp '2000-01-01 17:30', interval '30 minutes')
) as h(t)
where extract(isodow from d) < 6 or d::date = public.hoy_local();

-- Una franja retirada (inactiva), para probar que no aparece en disponibilidad.
update public.schedules s
   set activo = false
 where s.id = (select min(s2.id) from public.schedules s2
               join public.professionals p on p.id = s2.professional_id
               where p.registro_profesional = 'RM-DEMO-001'
                 and s2.fecha = public.hoy_local() + 7);


-- -----------------------------------------------------------------------------
-- 7. Citas
-- -----------------------------------------------------------------------------
-- 7.1 Citas masivas con los pacientes ficticios (prueba de rendimiento CP-17).
--     Se reparten de forma determinista (sin random) para que el resultado sea
--     igual cada vez que se reconstruye la base:
--       * Franjas pasadas: se ocupa el 70 %.
--       * Franjas de hoy de la Dra. Laura Gómez: se ocupan todas (agenda llena).
--       * Franjas futuras: se ocupa el 25 %.
--     Se insertan como 'programada' (el trigger registra la creación en
--     status_history) y luego se avanzan por transiciones válidas.
with pacientes as (
  select p.id, row_number() over (order by p.documento) - 1 as idx
  from public.profiles p
  join auth.users u on u.id = p.id
  where u.email like 'paciente.ficticio%@demo.test'
),
franjas as (
  select s.id, s.professional_id, s.fecha, s.hora_inicio,
         row_number() over (order by s.fecha, s.hora_inicio, s.professional_id) as n,
         pr.registro_profesional
  from public.schedules s
  join public.professionals pr on pr.id = s.professional_id
  where s.activo
),
elegidas as (
  select f.*
  from franjas f
  where (f.fecha + f.hora_inicio <= public.ahora_local() and f.n % 10 < 7)
     or (f.fecha = public.hoy_local() and f.registro_profesional = 'RM-DEMO-001')
     or (f.fecha + f.hora_inicio >  public.ahora_local() and f.n % 4 = 0)
)
insert into public.appointments (patient_id, professional_id, schedule_id, motivo, estado)
select pa.id, e.professional_id, e.id,
       (array['Control general', 'Primera consulta', 'Revisión de exámenes',
              'Control anual', 'Consulta de seguimiento'])[1 + (e.n % 5)::int],
       'programada'
from elegidas e
join pacientes pa on pa.idx = e.n % 20;

-- 7.2 Avanzar estados según si la franja ya pasó.
--     Pasadas:  ~10 % canceladas, ~10 % no_asistio, ~75 % atendidas y ~5 % quedan
--               confirmadas (citas que el profesional no cerró).
--     Futuras:  ~40 % confirmadas, ~10 % canceladas, el resto programadas.
create temporary table plan_estados as
select a.id,
       case
         when s.fecha + s.hora_inicio <= public.ahora_local() then
           case when a.id % 20 in (0, 1)    then 'cancelada'
                when a.id % 20 in (2, 3)    then 'no_asistio'
                when a.id % 20 = 4          then 'confirmada'
                else 'atendida' end
         else
           case when a.id % 10 in (0, 1, 2, 3) then 'confirmada'
                when a.id % 10 = 4             then 'cancelada'
                else 'programada' end
       end::public.estado_cita as destino
from public.appointments a
join public.schedules s on s.id = a.schedule_id;

-- Paso 1: programada → confirmada (para todas las que terminan en confirmada,
-- atendida o no_asistio) o programada → cancelada.
update public.appointments a
   set estado = case when p.destino = 'cancelada' then 'cancelada'::public.estado_cita
                     else 'confirmada'::public.estado_cita end
  from plan_estados p
 where p.id = a.id and p.destino <> 'programada';

-- Paso 2: confirmada → atendida / no_asistio.
update public.appointments a
   set estado = p.destino
  from plan_estados p
 where p.id = a.id and p.destino in ('atendida', 'no_asistio');

-- 7.3 Citas de las cuentas de demostración (para las pruebas manuales).
--     Se toman franjas LIBRES y futuras de los profesionales demo.
--     paciente1: una programada con la Dra. Gómez (+3 días, se puede cancelar) y
--                una confirmada con el Dr. Ruiz (+4 días).
--     paciente2: una programada con la Dra. Gómez (+5 días). Es la cita "ajena"
--                que usan CP-03 (paciente1 intenta verla) y CP-04 (el Dr. Ruiz
--                intenta cambiarla).
-- Se recorren una a una (y no con un solo INSERT) para que cada reserva vea las
-- franjas ya tomadas por la anterior; si "hoy + N" cae en fin de semana, se toma
-- el siguiente día con franjas libres.
do $$
declare
  v_pedido record;
  v_franja record;
begin
  for v_pedido in
    select * from (values
      ('paciente1@demo.test', 'RM-DEMO-001', 3, 'Control general'),
      ('paciente1@demo.test', 'RM-DEMO-002', 4, 'Control de crecimiento'),
      ('paciente2@demo.test', 'RM-DEMO-001', 5, 'Primera consulta')
    ) as t(email, registro, dias_desde_hoy, motivo)
  loop
    select s.id, s.professional_id into v_franja
    from public.schedules s
    join public.professionals pr on pr.id = s.professional_id
    where pr.registro_profesional = v_pedido.registro
      and s.activo
      and s.fecha >= public.hoy_local() + v_pedido.dias_desde_hoy
      and not exists (select 1 from public.appointments a
                      where a.schedule_id = s.id and a.estado <> 'cancelada')
    order by s.fecha, s.hora_inicio
    limit 1;

    insert into public.appointments (patient_id, professional_id, schedule_id, motivo, estado)
    select u.id, v_franja.professional_id, v_franja.id, v_pedido.motivo, 'programada'
    from auth.users u where u.email = v_pedido.email;
  end loop;
end
$$;

update public.appointments a
   set estado = 'confirmada'
  from auth.users u, public.professionals pr
 where u.id = a.patient_id and pr.id = a.professional_id
   and u.email = 'paciente1@demo.test' and pr.registro_profesional = 'RM-DEMO-002';

-- Historial pasado de paciente1 (para "Mis citas"): dos franjas pasadas LIBRES de
-- la Dra. Gómez; una termina atendida y otra cancelada.
insert into public.appointments (patient_id, professional_id, schedule_id, motivo, estado)
select (select id from auth.users where email = 'paciente1@demo.test'),
       s.professional_id, s.id, 'Control general', 'programada'
from public.schedules s
join public.professionals pr on pr.id = s.professional_id
where pr.registro_profesional = 'RM-DEMO-001'
  and s.fecha + s.hora_inicio < public.ahora_local() - interval '1 day'
  and not exists (select 1 from public.appointments a where a.schedule_id = s.id)
order by s.fecha, s.hora_inicio
limit 2;

with pasadas as (
  select a.id, row_number() over (order by a.id) as orden
  from public.appointments a
  join public.schedules s on s.id = a.schedule_id
  where a.patient_id = (select id from auth.users where email = 'paciente1@demo.test')
    and s.fecha + s.hora_inicio < public.ahora_local()
)
update public.appointments a
   set estado = case when p.orden = 1 then 'confirmada'::public.estado_cita
                     else 'cancelada'::public.estado_cita end
  from pasadas p
 where p.id = a.id;

update public.appointments a
   set estado = 'atendida'
  from public.schedules s
 where s.id = a.schedule_id
   and a.patient_id = (select id from auth.users where email = 'paciente1@demo.test')
   and a.estado = 'confirmada'
   and s.fecha + s.hora_inicio < public.ahora_local();

drop table plan_estados;


-- -----------------------------------------------------------------------------
-- 8. Comprobaciones y resumen
-- -----------------------------------------------------------------------------
do $$
declare
  v_citas integer;
begin
  select count(*) into v_citas from public.appointments;
  if v_citas < 500 then
    raise exception 'Se esperaban al menos 500 citas de prueba y hay %.', v_citas;
  end if;
end
$$;

commit;

-- Resumen (es lo que muestra el SQL Editor al terminar).
select 'especialidades' as dato, count(*)::text as total from public.specialties
union all select 'profesionales',   count(*)::text from public.professionals
union all select 'pacientes',       count(*)::text from public.profiles where rol = 'paciente'
union all select 'admins',          count(*)::text from public.profiles where rol = 'admin'
union all select 'franjas',         count(*)::text from public.schedules
union all select 'citas',           count(*)::text from public.appointments
union all select 'citas ' || estado::text, count(*)::text from public.appointments group by estado
union all select 'filas de historial', count(*)::text from public.status_history;
