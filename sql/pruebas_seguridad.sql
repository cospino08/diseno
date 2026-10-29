-- =============================================================================
-- pruebas_seguridad.sql  —  Pruebas de seguridad y reglas de negocio en SQL.
-- =============================================================================
-- Dueño: P2. Requiere esquema.sql, politicas_rls.sql y datos_prueba.sql.
-- Se ejecuta COMPLETO en el SQL Editor de Supabase (o con psql en local). Al
-- final muestra una tabla con cada comprobación: PASA o FALLA.
--
-- NO deja cambios en la base: cada prueba se ejecuta dentro de un bloque que al
-- final se deshace a propósito (raise 'DESHACER'), así que se puede repetir.
--
-- Cómo se simula un usuario (igual que hace Supabase con cada petición):
--   * set local role authenticated   → la consulta corre con los permisos del
--                                       rol "con sesión" (o "anon" sin sesión),
--                                       así que SÍ se aplican GRANT y RLS.
--                                       (El SQL Editor normalmente corre como
--                                       postgres, que se salta la RLS.)
--   * request.jwt.claims = {"sub": "<uuid>", "role": "authenticated"}
--                                     → es lo que lee auth.uid(). Supabase la
--                                       llena a partir del JWT del navegador.
-- Dentro de las pruebas se cambia de usuario con pg_temp.como('paciente1'), que
-- solo cambia request.jwt.claims.
--
-- Casos (docs/plan_trabajo.md §8):
--   CP-02  Dos sesiones reservan la misma franja.
--   CP-03  Un paciente intenta ver o tocar una cita ajena cambiando el ID.
--   CP-04  Un profesional intenta cambiar una cita de otro profesional.
--   CP-06  Un paciente intenta volverse admin.
--   CP-09  Cancelar y volver a reservar la misma franja.
--   CP-13  Usuario sin sesión (anon) llama RPC y lee tablas.
--   CP-19  Registro enviando rol 'admin' en los metadatos (incluye CP-21 en la base).
--   CP-23  Historial automático e intento de escribirlo directamente.
-- Complementarias (reglas de negocio en la base; sus dueños las prueban además
-- desde la interfaz): CP-07, CP-10, CP-11, CP-12.
--
-- La concurrencia REAL de CP-02 (dos peticiones a la vez) no se puede simular
-- en un único script; ver docs/modelo_datos/pruebas_seguridad.md.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 0. Preparación (como postgres)
-- -----------------------------------------------------------------------------
create temporary table resultados (
  orden    serial,
  caso     text,
  prueba   text,
  esperado text,
  obtenido text
) on commit preserve rows;

-- Los usuarios simulados escriben aquí sus resultados.
grant select, insert on resultados to authenticated, anon;
grant usage on sequence resultados_orden_seq to authenticated, anon;

-- Datos que las pruebas necesitan y que un usuario normal no puede consultar
-- (los UUID de otros usuarios, el id de una cita ajena...). Se guardan como
-- variables de sesión "pruebas.*".
select set_config('pruebas.uid_' || split_part(email, '@', 1), id::text, false)
from auth.users
where email in ('admin@demo.test', 'profesional1@demo.test', 'profesional2@demo.test',
                'paciente1@demo.test', 'paciente2@demo.test');

-- Una cita activa de paciente2 con la Dra. Gómez (profesional1).
select set_config('pruebas.cita_paciente2', min(a.id)::text, false)
from public.appointments a
join auth.users u on u.id = a.patient_id
where u.email = 'paciente2@demo.test' and a.estado in ('programada', 'confirmada');

-- Su franja.
select set_config('pruebas.franja_cita_paciente2', a.schedule_id::text, false)
from public.appointments a
where a.id = current_setting('pruebas.cita_paciente2')::bigint;

-- Una franja LIBRE de la Dra. Gómez, al menos 2 días en el futuro.
select set_config('pruebas.franja_libre', min(s.id)::text, false)
from public.schedules s
join public.professionals p on p.id = s.professional_id
where p.registro_profesional = 'RM-DEMO-001'
  and s.activo
  and s.fecha >= public.hoy_local() + 2
  and not exists (select 1 from public.appointments a
                  where a.schedule_id = s.id and a.estado <> 'cancelada');

select set_config('pruebas.fecha_franja_libre', s.fecha::text, false)
from public.schedules s where s.id = current_setting('pruebas.franja_libre')::bigint;

select set_config('pruebas.id_profesional1', p.id::text, false)
from public.professionals p where p.registro_profesional = 'RM-DEMO-001';

-- Una franja LIBRE en el pasado.
select set_config('pruebas.franja_pasada', min(s.id)::text, false)
from public.schedules s
where s.activo
  and s.fecha < public.hoy_local()
  and not exists (select 1 from public.appointments a
                  where a.schedule_id = s.id and a.estado <> 'cancelada');

-- Una cita atendida de la Dra. Gómez.
select set_config('pruebas.cita_atendida', min(a.id)::text, false)
from public.appointments a
join public.professionals p on p.id = a.professional_id
where p.registro_profesional = 'RM-DEMO-001' and a.estado = 'atendida';

select set_config('pruebas.total_citas', count(*)::text, false) from public.appointments;

-- Funciones de ayuda (solo existen en esta sesión: esquema pg_temp).

-- Lee un dato preparado.
create function pg_temp.dato(p_clave text) returns text
language sql stable as $$ select current_setting('pruebas.' || p_clave) $$;

-- Cambia el usuario simulado. Con null, queda sin usuario (como anon).
create function pg_temp.como(p_usuario text) returns void
language sql as $$
  select set_config('request.jwt.claims',
    case when p_usuario is null then ''
         else json_build_object('sub', current_setting('pruebas.uid_' || p_usuario),
                                'role', 'authenticated')::text end,
    true)
$$;

-- Ejecuta una sentencia y devuelve 'OK', el código propio ('FRANJA_OCUPADA'...)
-- o el SQLSTATE de PostgreSQL ('42501' = permiso denegado).
create function pg_temp.intentar(p_sql text) returns text
language plpgsql as $$
begin
  execute p_sql;
  return 'OK';
exception when others then
  return case when sqlstate = 'P0001' then sqlerrm else sqlstate end;
end
$$;

-- Ejecuta una consulta que devuelve un número.
create function pg_temp.contar(p_sql text) returns text
language plpgsql as $$
declare v bigint;
begin
  execute p_sql into v;
  return v::text;
exception when others then
  return case when sqlstate = 'P0001' then sqlerrm else sqlstate end;
end
$$;

-- Acumula un resultado en un arreglo JSON (sobrevive al "DESHACER").
create function pg_temp.r(p_acum jsonb, p_caso text, p_prueba text, p_esperado text, p_obtenido text)
returns jsonb language sql immutable as $$
  select p_acum || jsonb_build_array(jsonb_build_object(
    'caso', p_caso, 'prueba', p_prueba, 'esperado', p_esperado, 'obtenido', coalesce(p_obtenido, 'null')))
$$;

create function pg_temp.guardar(p_acum jsonb) returns void
language sql as $$
  insert into resultados (caso, prueba, esperado, obtenido)
  select e ->> 'caso', e ->> 'prueba', e ->> 'esperado', e ->> 'obtenido'
  from jsonb_array_elements(p_acum) as e
$$;

grant execute on all functions in schema pg_temp to authenticated, anon;


-- CP-19. Registro enviando rol: 'admin' en los metadatos (RF-01) ----------------
-- Supabase Auth, al hacer signUp(), inserta en auth.users los metadatos que
-- manda el navegador. Aquí se simula ese INSERT (como postgres, igual que Auth)
-- con un usuario nuevo que intenta registrarse como admin. Se deshace al final.
do $$
declare
  v jsonb := '[]';
  v_id uuid := gen_random_uuid();
begin
  begin
    insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
                            created_at, updated_at, confirmation_token, recovery_token,
                            email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
            'nuevo.cp19@demo.test', '{"provider":"email","providers":["email"]}',
            '{"nombres": "Nuevo CP-19", "rol": "admin"}', now(), now(), '', '', '', '');

    v := pg_temp.r(v, 'CP-19', 'registro con {"rol": "admin"} en metadatos: el perfil queda paciente', 'paciente',
           (select rol::text from public.profiles where id = v_id));

    v := pg_temp.r(v, 'CP-19', 'el nombre sí se toma de los metadatos', 'Nuevo CP-19',
           (select nombres from public.profiles where id = v_id));

    -- Ahora como ese usuario recién registrado, con sesión (CP-21 a nivel de base).
    perform set_config('pruebas.uid_nuevo', v_id::text, true);
    execute 'set local role authenticated';
    perform pg_temp.como('nuevo');

    v := pg_temp.r(v, 'CP-19', 'el usuario nuevo tiene rol_actual() = paciente', 'paciente',
           (select public.rol_actual()::text));

    v := pg_temp.r(v, 'CP-19', 'con perfil incompleto no puede reservar (CP-21)', 'PERFIL_INCOMPLETO',
           pg_temp.intentar(format('select public.reservar_cita(%s)', pg_temp.dato('franja_libre'))));

    raise exception 'DESHACER' using errcode = 'P0099';   -- deshace el usuario y el "set role"
  exception when sqlstate 'P0099' then null;
  end;
  perform pg_temp.guardar(v);
end
$$;


-- -----------------------------------------------------------------------------
-- Desde aquí, todo corre como un usuario de la API (no como postgres).
-- -----------------------------------------------------------------------------
set local role authenticated;


-- CP-02. Dos sesiones intentan reservar la misma franja --------------------------
do $$
declare
  v jsonb := '[]';
  v_franja text := pg_temp.dato('franja_libre');
begin
  begin
    perform pg_temp.como('paciente1');
    v := pg_temp.r(v, 'CP-02', 'paciente1 reserva una franja libre', 'OK',
           pg_temp.intentar(format('select public.reservar_cita(%s, %L)', v_franja, 'Prueba CP-02')));

    perform pg_temp.como('paciente2');
    v := pg_temp.r(v, 'CP-02', 'paciente2 intenta reservar la MISMA franja', 'FRANJA_OCUPADA',
           pg_temp.intentar(format('select public.reservar_cita(%s, %L)', v_franja, 'Prueba CP-02')));

    perform pg_temp.como('admin');
    v := pg_temp.r(v, 'CP-02', 'la franja tiene exactamente 1 cita activa', '1',
           pg_temp.contar(format(
             'select count(*) from public.appointments where schedule_id = %s and estado <> ''cancelada''',
             v_franja)));

    v := pg_temp.r(v, 'CP-02', 'la franja ya no aparece en franjas_disponibles', '0',
           pg_temp.contar(format(
             'select count(*) from public.franjas_disponibles(null, null, %L) where schedule_id = %s',
             pg_temp.dato('fecha_franja_libre'), v_franja)));

    raise exception 'DESHACER' using errcode = 'P0099';
  exception when sqlstate 'P0099' then null;
  end;
  perform pg_temp.guardar(v);
end
$$;


-- CP-03. Paciente altera el ID para ver una cita ajena ---------------------------
do $$
declare
  v jsonb := '[]';
  v_cita text := pg_temp.dato('cita_paciente2');
begin
  begin
    perform pg_temp.como('paciente1');

    v := pg_temp.r(v, 'CP-03', 'paciente1 lee la cita de paciente2 por su id (RLS la oculta)', '0',
           pg_temp.contar(format('select count(*) from public.appointments where id = %s', v_cita)));

    v := pg_temp.r(v, 'CP-03', 'paciente1 lee el historial de esa cita', '0',
           pg_temp.contar(format('select count(*) from public.status_history where appointment_id = %s', v_cita)));

    v := pg_temp.r(v, 'CP-03', 'paciente1 solo ve citas propias (ninguna ajena)', '0',
           pg_temp.contar('select count(*) from public.appointments where patient_id <> auth.uid()'));

    v := pg_temp.r(v, 'CP-03', 'paciente1 solo ve su propio perfil', '1',
           pg_temp.contar('select count(*) from public.profiles'));

    v := pg_temp.r(v, 'CP-03', 'paciente1 cancela la cita ajena por RPC', 'NO_AUTORIZADO',
           pg_temp.intentar(format('select public.cancelar_cita(%s)', v_cita)));

    v := pg_temp.r(v, 'CP-03', 'paciente1 hace UPDATE directo de la cita ajena', '42501',
           pg_temp.intentar(format('update public.appointments set estado = ''cancelada'' where id = %s', v_cita)));

    v := pg_temp.r(v, 'CP-03', 'paciente1 hace DELETE directo de la cita ajena', '42501',
           pg_temp.intentar(format('delete from public.appointments where id = %s', v_cita)));

    v := pg_temp.r(v, 'CP-03', 'paciente1 inserta una cita a nombre de paciente2', '42501',
           pg_temp.intentar(format(
             'insert into public.appointments (patient_id, professional_id, schedule_id) values (%L, %s, %s)',
             pg_temp.dato('uid_paciente2'), pg_temp.dato('id_profesional1'), pg_temp.dato('franja_libre'))));

    v := pg_temp.r(v, 'CP-03', 'control positivo: paciente1 sí ve sus propias citas', 'mayor que 0',
           case when pg_temp.contar('select count(*) from public.appointments')::int > 0
                then 'mayor que 0' else '0' end);

    perform pg_temp.como('paciente2');
    v := pg_temp.r(v, 'CP-03', 'control positivo: paciente2 sí ve su cita', '1',
           pg_temp.contar(format('select count(*) from public.appointments where id = %s', v_cita)));

    raise exception 'DESHACER' using errcode = 'P0099';
  exception when sqlstate 'P0099' then null;
  end;
  perform pg_temp.guardar(v);
end
$$;


-- CP-04. Profesional intenta actualizar una cita de otro profesional -------------
-- La cita de paciente2 está asignada a profesional1 (Dra. Gómez).
do $$
declare
  v jsonb := '[]';
  v_cita text := pg_temp.dato('cita_paciente2');
begin
  begin
    perform pg_temp.como('profesional2');

    v := pg_temp.r(v, 'CP-04', 'profesional2 confirma una cita de profesional1', 'NO_AUTORIZADO',
           pg_temp.intentar(format('select public.cambiar_estado_cita(%s, ''confirmada'')', v_cita)));

    v := pg_temp.r(v, 'CP-04', 'profesional2 cancela una cita de profesional1', 'NO_AUTORIZADO',
           pg_temp.intentar(format('select public.cancelar_cita(%s)', v_cita)));

    v := pg_temp.r(v, 'CP-04', 'profesional2 hace UPDATE directo de esa cita', '42501',
           pg_temp.intentar(format('update public.appointments set estado = ''confirmada'' where id = %s', v_cita)));

    v := pg_temp.r(v, 'CP-04', 'profesional2 no ve la cita de profesional1', '0',
           pg_temp.contar(format('select count(*) from public.appointments where id = %s', v_cita)));

    v := pg_temp.r(v, 'CP-04', 'profesional2 no ve citas de otros profesionales', '0',
           pg_temp.contar('select count(*) from public.appointments where professional_id <> public.mi_profesional_id()'));

    v := pg_temp.r(v, 'CP-04', 'profesional2 no puede leer perfiles de pacientes', '1',
           pg_temp.contar('select count(*) from public.profiles'));

    perform pg_temp.como('profesional1');
    v := pg_temp.r(v, 'CP-04', 'control positivo: profesional1 sí confirma su cita', 'OK',
           pg_temp.intentar(format('select public.cambiar_estado_cita(%s, ''confirmada'')', v_cita)));

    v := pg_temp.r(v, 'CP-04', 'el historial registra a profesional1 como autor', '1',
           pg_temp.contar(format(
             'select count(*) from public.status_history where appointment_id = %s and estado_nuevo = ''confirmada'' and changed_by = auth.uid()',
             v_cita)));

    raise exception 'DESHACER' using errcode = 'P0099';
  exception when sqlstate 'P0099' then null;
  end;
  perform pg_temp.guardar(v);
end
$$;


-- CP-06. Paciente intenta escalar privilegios ------------------------------------
do $$
declare
  v jsonb := '[]';
begin
  begin
    perform pg_temp.como('paciente1');

    v := pg_temp.r(v, 'CP-06', 'paciente1: update profiles set rol = admin', '42501',
           pg_temp.intentar('update public.profiles set rol = ''admin'' where id = auth.uid()'));

    v := pg_temp.r(v, 'CP-06', 'paciente1: update profiles set activo', '42501',
           pg_temp.intentar('update public.profiles set activo = true where id = auth.uid()'));

    v := pg_temp.r(v, 'CP-06', 'paciente1: insert en professionals', '42501',
           pg_temp.intentar(format(
             'insert into public.professionals (profile_id, specialty_id, nombre_publico) values (%L, 1, ''Falso'')',
             pg_temp.dato('uid_paciente1'))));

    v := pg_temp.r(v, 'CP-06', 'paciente1: rpc asignar_rol(a sí mismo, admin)', 'NO_AUTORIZADO',
           pg_temp.intentar(format('select public.asignar_rol(%L, ''admin'')', pg_temp.dato('uid_paciente1'))));

    v := pg_temp.r(v, 'CP-06', 'paciente1: rpc asignar_rol(a paciente2, admin)', 'NO_AUTORIZADO',
           pg_temp.intentar(format('select public.asignar_rol(%L, ''admin'')', pg_temp.dato('uid_paciente2'))));

    v := pg_temp.r(v, 'CP-06', 'paciente1: crear especialidad (solo admin)', '42501 o fila rechazada',
           case pg_temp.intentar('insert into public.specialties (nombre) values (''Especialidad falsa'')')
             when '42501' then '42501 o fila rechazada' else 'se insertó' end);

    v := pg_temp.r(v, 'CP-06', 'paciente1 sigue siendo paciente', 'paciente',
           (select public.rol_actual()::text));

    v := pg_temp.r(v, 'CP-06', 'control positivo: paciente1 sí edita su teléfono', 'OK',
           pg_temp.intentar('update public.profiles set telefono = ''300 000 9999'' where id = auth.uid()'));

    perform pg_temp.como('paciente2');
    v := pg_temp.r(v, 'CP-06', 'paciente2 (rol admin en metadatos del registro) quedó paciente', 'paciente',
           (select public.rol_actual()::text));

    perform pg_temp.como('admin');
    v := pg_temp.r(v, 'CP-06', 'control positivo: admin sí puede asignar_rol', 'OK',
           pg_temp.intentar(format('select public.asignar_rol(%L, ''admin'')', pg_temp.dato('uid_paciente2'))));

    v := pg_temp.r(v, 'CP-06', 'admin no puede cambiar su propio rol', 'NO_AUTORIZADO',
           pg_temp.intentar(format('select public.asignar_rol(%L, ''paciente'')', pg_temp.dato('uid_admin'))));

    raise exception 'DESHACER' using errcode = 'P0099';
  exception when sqlstate 'P0099' then null;
  end;
  perform pg_temp.guardar(v);
end
$$;


-- CP-09. Cancelar y volver a reservar la misma franja ----------------------------
do $$
declare
  v jsonb := '[]';
  v_franja text := pg_temp.dato('franja_libre');
  v_cita   bigint;
begin
  begin
    perform pg_temp.como('paciente1');
    v_cita := public.reservar_cita(v_franja::bigint, 'Prueba CP-09');
    v := pg_temp.r(v, 'CP-09', 'paciente1 reserva la franja', 'OK',
           case when v_cita is not null then 'OK' else 'sin id' end);

    v := pg_temp.r(v, 'CP-09', 'paciente1 cancela (faltan más de 2 h)', 'OK',
           pg_temp.intentar(format('select public.cancelar_cita(%s)', v_cita)));

    v := pg_temp.r(v, 'CP-09', 'la cita queda cancelada con fecha y autor', 'cancelada/paciente',
           (select estado::text || '/' || cancelado_por::text from public.appointments
             where id = v_cita and cancelled_at is not null));

    v := pg_temp.r(v, 'CP-09', 'cancelar otra vez la misma cita', 'TRANSICION_INVALIDA',
           pg_temp.intentar(format('select public.cancelar_cita(%s)', v_cita)));

    perform pg_temp.como('paciente2');
    v := pg_temp.r(v, 'CP-09', 'la franja vuelve a estar disponible', '1',
           pg_temp.contar(format(
             'select count(*) from public.franjas_disponibles(null, null, %L) where schedule_id = %s',
             pg_temp.dato('fecha_franja_libre'), v_franja)));

    v := pg_temp.r(v, 'CP-09', 'paciente2 reserva la misma franja', 'OK',
           pg_temp.intentar(format('select public.reservar_cita(%s, %L)', v_franja, 'Prueba CP-09')));

    perform pg_temp.como('admin');
    v := pg_temp.r(v, 'CP-09', 'la franja conserva 2 citas: 1 cancelada y 1 activa', '2',
           pg_temp.contar(format('select count(*) from public.appointments where schedule_id = %s', v_franja)));

    v := pg_temp.r(v, 'CP-09', 'historial de la cita cancelada: creación + cancelación', '2',
           pg_temp.contar(format('select count(*) from public.status_history where appointment_id = %s', v_cita)));

    raise exception 'DESHACER' using errcode = 'P0099';
  exception when sqlstate 'P0099' then null;
  end;
  perform pg_temp.guardar(v);
end
$$;


-- CP-23. Historial automático e intento de escribirlo directamente (RF-13) -------
do $$
declare
  v jsonb := '[]';
  v_cita text := pg_temp.dato('cita_paciente2');
begin
  begin
    perform pg_temp.como('profesional1');
    perform public.cambiar_estado_cita(v_cita::bigint, 'confirmada');

    v := pg_temp.r(v, 'CP-23', 'al confirmar, el historial guarda programada→confirmada y changed_by = profesional1', '1',
           pg_temp.contar(format(
             'select count(*) from public.status_history where appointment_id = %s and estado_anterior = ''programada'' and estado_nuevo = ''confirmada'' and changed_by = %L',
             v_cita, pg_temp.dato('uid_profesional1'))));

    v := pg_temp.r(v, 'CP-23', 'profesional1 hace UPDATE del historial', '42501',
           pg_temp.intentar(format('update public.status_history set changed_by = null where appointment_id = %s', v_cita)));

    v := pg_temp.r(v, 'CP-23', 'profesional1 hace DELETE del historial', '42501',
           pg_temp.intentar(format('delete from public.status_history where appointment_id = %s', v_cita)));

    perform pg_temp.como('paciente1');
    v := pg_temp.r(v, 'CP-23', 'paciente1 inserta una fila en status_history', '42501',
           pg_temp.intentar(format(
             'insert into public.status_history (appointment_id, estado_anterior, estado_nuevo) values (%s, ''confirmada'', ''atendida'')',
             v_cita)));

    perform pg_temp.como('admin');
    v := pg_temp.r(v, 'CP-23', 'ni el admin inserta en status_history', '42501',
           pg_temp.intentar(format(
             'insert into public.status_history (appointment_id, estado_nuevo) values (%s, ''atendida'')', v_cita)));

    perform pg_temp.como('paciente2');
    v := pg_temp.r(v, 'CP-23', 'control positivo: paciente2 ve el historial de su cita', '2',
           pg_temp.contar(format('select count(*) from public.status_history where appointment_id = %s', v_cita)));

    raise exception 'DESHACER' using errcode = 'P0099';
  exception when sqlstate 'P0099' then null;
  end;
  perform pg_temp.guardar(v);
end
$$;


-- Complementarias: CP-07, CP-10, CP-11, CP-12 -------------------------------------
do $$
declare
  v jsonb := '[]';
begin
  begin
    perform pg_temp.como('paciente1');
    v := pg_temp.r(v, 'CP-07', 'paciente1 reserva una franja pasada', 'FRANJA_PASADA',
           pg_temp.intentar(format('select public.reservar_cita(%s)', pg_temp.dato('franja_pasada'))));

    v := pg_temp.r(v, 'CP-07', 'paciente1 reserva una franja inexistente', 'FRANJA_NO_EXISTE',
           pg_temp.intentar('select public.reservar_cita(999999999)'));

    perform pg_temp.como('profesional1');
    v := pg_temp.r(v, 'CP-10', 'profesional1 pasa una cita atendida a programada', 'TRANSICION_INVALIDA',
           pg_temp.intentar(format('select public.cambiar_estado_cita(%s, ''programada'')', pg_temp.dato('cita_atendida'))));

    v := pg_temp.r(v, 'CP-10', 'profesional1 marca atendida una cita futura', 'TRANSICION_INVALIDA o ANTES_DE_HORA',
           case pg_temp.intentar(format('select public.cambiar_estado_cita(%s, ''atendida'')', pg_temp.dato('cita_paciente2')))
             when 'TRANSICION_INVALIDA' then 'TRANSICION_INVALIDA o ANTES_DE_HORA'
             when 'ANTES_DE_HORA'       then 'TRANSICION_INVALIDA o ANTES_DE_HORA'
             else 'se permitió' end);

    perform public.cambiar_estado_cita(pg_temp.dato('cita_paciente2')::bigint, 'confirmada');
    v := pg_temp.r(v, 'CP-10', 'confirmada → atendida antes de la hora de inicio', 'ANTES_DE_HORA',
           pg_temp.intentar(format('select public.cambiar_estado_cita(%s, ''atendida'')', pg_temp.dato('cita_paciente2'))));

    perform pg_temp.como('admin');
    v := pg_temp.r(v, 'CP-11', 'admin genera franjas que se cruzan con las existentes', 'HORARIO_SUPERPUESTO',
           pg_temp.intentar(format('select public.generar_franjas(%s, %L, ''08:00'', ''09:00'', 30)',
                                   pg_temp.dato('id_profesional1'), pg_temp.dato('fecha_franja_libre'))));

    v := pg_temp.r(v, 'CP-11', 'admin inserta directo una franja que se cruza', 'HORARIO_SUPERPUESTO',
           pg_temp.intentar(format(
             'insert into public.schedules (professional_id, fecha, hora_inicio, hora_fin) values (%s, %L, ''08:10'', ''08:40'')',
             pg_temp.dato('id_profesional1'), pg_temp.dato('fecha_franja_libre'))));

    v := pg_temp.r(v, 'CP-11', 'control positivo: admin genera franjas en horario libre (19:00-20:00)', 'OK',
           pg_temp.intentar(format('select public.generar_franjas(%s, %L, ''19:00'', ''20:00'', 20)',
                                   pg_temp.dato('id_profesional1'), pg_temp.dato('fecha_franja_libre'))));

    v := pg_temp.r(v, 'CP-12', 'admin mueve una franja con cita activa', 'FRANJA_CON_CITA',
           pg_temp.intentar(format('update public.schedules set hora_inicio = ''07:00'' where id = %s',
                                   pg_temp.dato('franja_cita_paciente2'))));

    v := pg_temp.r(v, 'CP-12', 'admin desactiva una franja con cita activa', 'FRANJA_CON_CITA',
           pg_temp.intentar(format('update public.schedules set activo = false where id = %s',
                                   pg_temp.dato('franja_cita_paciente2'))));

    v := pg_temp.r(v, 'CP-12', 'control positivo: admin desactiva una franja libre', 'OK',
           pg_temp.intentar(format('update public.schedules set activo = false where id = %s',
                                   pg_temp.dato('franja_libre'))));

    v := pg_temp.r(v, 'Admin', 'el admin ve todas las citas', pg_temp.dato('total_citas'),
           pg_temp.contar('select count(*) from public.appointments'));

    raise exception 'DESHACER' using errcode = 'P0099';
  exception when sqlstate 'P0099' then null;
  end;
  perform pg_temp.guardar(v);
end
$$;


-- CP-13. Usuario sin sesión (rol anon) -------------------------------------------
reset role;
select pg_temp.como(null);
set local role anon;

do $$
declare
  v jsonb := '[]';
begin
  begin
    v := pg_temp.r(v, 'CP-13', 'anon: rpc reservar_cita', '42501',
           pg_temp.intentar(format('select public.reservar_cita(%s)', pg_temp.dato('franja_libre'))));
    v := pg_temp.r(v, 'CP-13', 'anon: rpc franjas_disponibles', '42501',
           pg_temp.intentar('select * from public.franjas_disponibles()'));
    v := pg_temp.r(v, 'CP-13', 'anon: rpc indicadores_citas', '42501',
           pg_temp.intentar('select public.indicadores_citas(current_date - 30, current_date)'));
    v := pg_temp.r(v, 'CP-13', 'anon: rpc asignar_rol', '42501',
           pg_temp.intentar(format('select public.asignar_rol(%L, ''admin'')', pg_temp.dato('uid_paciente1'))));
    v := pg_temp.r(v, 'CP-13', 'anon: rpc rol_actual', '42501',
           pg_temp.intentar('select public.rol_actual()'));
    v := pg_temp.r(v, 'CP-13', 'anon: select appointments', '42501',
           pg_temp.intentar('select * from public.appointments'));
    v := pg_temp.r(v, 'CP-13', 'anon: select profiles', '42501',
           pg_temp.intentar('select * from public.profiles'));
    v := pg_temp.r(v, 'CP-13', 'anon: select specialties', '42501',
           pg_temp.intentar('select * from public.specialties'));
    v := pg_temp.r(v, 'CP-13', 'anon: insert specialties', '42501',
           pg_temp.intentar('insert into public.specialties (nombre) values (''Anónima'')'));

    raise exception 'DESHACER' using errcode = 'P0099';
  exception when sqlstate 'P0099' then null;
  end;
  perform pg_temp.guardar(v);
end
$$;

reset role;
commit;


-- -----------------------------------------------------------------------------
-- Resultado
-- -----------------------------------------------------------------------------
select caso,
       prueba,
       esperado,
       obtenido,
       case when esperado = obtenido then 'PASA' else 'FALLA' end as estado
from resultados
order by orden;
