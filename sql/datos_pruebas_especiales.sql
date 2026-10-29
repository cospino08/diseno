-- =============================================================================
-- datos_pruebas_especiales.sql  —  Paso 3b (opcional). Datos para CP-17 y CP-18.
-- =============================================================================
-- Dueño: P2. Requiere datos_prueba.sql. Se puede ejecutar sobre una base que ya
-- tiene los datos de demostración: no borra ni cambia nada de lo anterior, y si
-- se ejecuta dos veces no duplica nada (cada parte comprueba si ya existe).
--
-- Va en un archivo aparte, y no dentro de datos_prueba.sql, porque son datos
-- ARTIFICIALES para dos pruebas concretas y no deben confundirse con la agenda
-- de demostración "realista".
--
-- 1. CP-18 (XSS): un paciente ficticio cuyo nombre es
--      <img src=x onerror=alert(1)>
--    con una cita futura con la Dra. Gómez (profesional1). Aparece en la agenda
--    del profesional (mi_agenda) y en las vistas del admin (citas_admin,
--    profiles). La interfaz debe mostrarlo como TEXTO (textContent), sin
--    ejecutar nada.
--
-- 2. CP-17 (rendimiento, RNF-02): "la agenda de un día carga en máximo 3 s con
--    500 citas". Un profesional real no tiene 500 citas en un día, así que se
--    crea un DÍA DE CARGA artificial para la Dra. Gómez, 90 días en el futuro:
--    500 franjas de 2 minutos (00:00 a 16:40), todas reservadas por los pacientes
--    ficticios. La prueba es abrir la agenda de ese día como profesional1.
--    La fecha exacta aparece en el resumen final (fila "día de carga CP-17").
--
-- Efectos secundarios (documentados para CP-15): estas 501 citas también
-- cuentan en indicadores_citas. Solo se quitan reconstruyendo la base
-- (reiniciar.sql), porque las citas nunca se borran (P13).
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. CP-18: paciente con un nombre que intenta inyectar HTML
-- -----------------------------------------------------------------------------
-- El correo termina en .ficticio...@demo.test para que reiniciar.sql lo borre.
-- Sin contraseña: no puede iniciar sesión, solo existe como dato.
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
                        created_at, updated_at, confirmation_token, recovery_token,
                        email_change_token_new, email_change)
select '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       'paciente.xss.ficticio@demo.test', '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('nombres', '<img src=x onerror=alert(1)>'), now(), now(), '', '', '', ''
where not exists (select 1 from auth.users where email = 'paciente.xss.ficticio@demo.test');

-- Perfil completo (si no, no podría tener cita por reservar_cita). El trigger ya
-- creó la fila con el nombre tal cual: la base guarda el texto sin "limpiarlo";
-- proteger la vista es trabajo del frontend (sección 8.2 del enunciado).
update public.profiles p
   set documento = 'TEST-0900', telefono = '300 000 0900', fecha_nacimiento = date '1999-09-09'
  from auth.users u
 where u.id = p.id and u.email = 'paciente.xss.ficticio@demo.test' and p.documento is null;

-- Una cita en la primera franja libre de la Dra. Gómez a partir de mañana.
insert into public.appointments (patient_id, professional_id, schedule_id, motivo, estado)
select u.id, s.professional_id, s.id, '<script>alert("motivo")</script>', 'programada'
from auth.users u
cross join lateral (
  select s.id, s.professional_id
  from public.schedules s
  join public.professionals pr on pr.id = s.professional_id
  where pr.registro_profesional = 'RM-DEMO-001'
    and s.activo
    and s.fecha > public.hoy_local()
    and not exists (select 1 from public.appointments a
                    where a.schedule_id = s.id and a.estado <> 'cancelada')
  order by s.fecha, s.hora_inicio
  limit 1
) s
where u.email = 'paciente.xss.ficticio@demo.test'
  and not exists (select 1 from public.appointments a where a.patient_id = u.id);


-- -----------------------------------------------------------------------------
-- 2. CP-17: día de carga con 500 citas para la Dra. Gómez
-- -----------------------------------------------------------------------------
-- Se marca con el motivo 'Carga CP-17' para reconocerlo y no repetirlo.
do $$
declare
  v_prof  bigint;
  v_fecha date := public.hoy_local() + 90;
begin
  if exists (select 1 from public.appointments where motivo = 'Carga CP-17') then
    raise notice 'El día de carga de CP-17 ya existe; no se crea otro.';
    return;
  end if;

  select id into v_prof from public.professionals where registro_profesional = 'RM-DEMO-001';

  -- 500 franjas de 2 minutos. Se insertan directo (no con generar_franjas, que
  -- exige mínimo 10 minutos) porque es un dato de carga, no una agenda real.
  -- La restricción de exclusión sigue aplicando: no se cruzan entre sí.
  insert into public.schedules (professional_id, fecha, hora_inicio, hora_fin)
  select v_prof, v_fecha,
         time '00:00' + make_interval(mins => 2 * n),
         time '00:00' + make_interval(mins => 2 * n + 2)
  from generate_series(0, 499) as n;

  -- Todas reservadas, repartidas entre los 20 pacientes ficticios.
  insert into public.appointments (patient_id, professional_id, schedule_id, motivo, estado)
  select pa.id, s.professional_id, s.id, 'Carga CP-17', 'programada'
  from (select s.*, row_number() over (order by s.hora_inicio) - 1 as n
        from public.schedules s
        where s.professional_id = v_prof and s.fecha = v_fecha) as s
  join (select p.id, row_number() over (order by p.documento) - 1 as idx
        from public.profiles p
        join auth.users u on u.id = p.id
        where u.email like 'paciente.ficticio%@demo.test') as pa
    on pa.idx = s.n % 20;
end
$$;

commit;

-- Resumen.
select 'paciente CP-18 (nombre)' as dato, p.nombres as valor
from public.profiles p join auth.users u on u.id = p.id
where u.email = 'paciente.xss.ficticio@demo.test'
union all
select 'cita CP-18 con la Dra. Gómez', s.fecha::text || ' ' || s.hora_inicio::text
from public.appointments a
join public.schedules s on s.id = a.schedule_id
join auth.users u on u.id = a.patient_id
where u.email = 'paciente.xss.ficticio@demo.test'
union all
select 'día de carga CP-17 (profesional1)', min(s.fecha)::text || ' — ' || count(*)::text || ' citas'
from public.appointments a
join public.schedules s on s.id = a.schedule_id
where a.motivo = 'Carga CP-17';
