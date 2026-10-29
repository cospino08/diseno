-- =============================================================================
-- esquema.sql  —  Paso 1 de 3. Tablas, restricciones, índices y triggers.
-- =============================================================================
-- Sistema web de reserva de citas médicas (proyecto integrador).
-- Dueño: P2. Se ejecuta en el SQL Editor de Supabase sobre un proyecto vacío, en
-- este orden:  esquema.sql  →  politicas_rls.sql  →  datos_prueba.sql
--
-- Las decisiones que se citan como "P1".."P15" y "C2".."C8" están explicadas en
-- docs/plan_trabajo.md (secciones 3 y 4). El contrato con el frontend está en
-- docs/contrato_api.md y el diccionario de datos en docs/modelo_datos/.
--
-- Este archivo NO da permisos ni activa RLS: eso lo hace politicas_rls.sql.
-- Por eso hay que ejecutar los dos seguidos antes de publicar la aplicación.
-- =============================================================================

-- Todo el archivo va en una transacción: si algo falla, no queda nada a medias
-- y se puede corregir y volver a ejecutar.
begin;

-- btree_gist permite combinar "=" sobre bigint con "&&" (cruce de rangos) en una
-- misma restricción de exclusión (P3). En Supabase las extensiones van en el
-- esquema "extensions".
create extension if not exists btree_gist with schema extensions;


-- -----------------------------------------------------------------------------
-- 1. Tipos cerrados (P1, sección 9.1 del enunciado)
-- -----------------------------------------------------------------------------
-- Un enum impide valores libres como 'Admin', 'administrador' o 'cancelado'.

create type public.rol_usuario as enum ('paciente', 'profesional', 'admin');

create type public.estado_cita as enum
  ('programada', 'confirmada', 'atendida', 'cancelada', 'no_asistio');


-- -----------------------------------------------------------------------------
-- 2. Utilidades de fecha (C8: todo se compara en hora de Bogotá)
-- -----------------------------------------------------------------------------
-- Las franjas guardan fecha y hora locales de la clínica, sin zona horaria. El
-- servidor de Supabase trabaja en UTC, así que "ahora" se convierte a Bogotá
-- antes de comparar. Se centraliza aquí para no repetir la zona en cada función.

create function public.ahora_local()
returns timestamp
language sql stable
set search_path = public, pg_temp
as $$
  select (now() at time zone 'America/Bogota')::timestamp
$$;

create function public.hoy_local()
returns date
language sql stable
set search_path = public, pg_temp
as $$
  select (now() at time zone 'America/Bogota')::date
$$;


-- -----------------------------------------------------------------------------
-- 3. Tablas
-- -----------------------------------------------------------------------------

-- 3.1 profiles: datos públicos del usuario. auth.users (credenciales) queda
-- separado y se enlaza por el mismo UUID (sección 9.1).
-- documento, telefono y fecha_nacimiento son NULLABLES a propósito: el perfil se
-- crea con un trigger en el momento del registro, cuando aún no los conocemos
-- (P4). La regla "perfil completo para reservar" la valida reservar_cita.
create table public.profiles (
  -- on delete cascade: si se borra la cuenta en Supabase Auth se borra su perfil,
  -- PERO solo si nadie lo referencia. Las FK de appointments, status_history y
  -- schedules hacia profiles son "restrict", así que un usuario con citas o
  -- historial no se puede borrar: se desactiva o se anonimiza (P13).
  id               uuid primary key
                   references auth.users (id) on delete cascade,
  email            text,
  nombres          text not null default '',
  documento        text,
  telefono         text,
  fecha_nacimiento date,
  rol              public.rol_usuario not null default 'paciente',
  activo           boolean not null default true,
  created_at       timestamptz not null default now(),

  constraint uq_profiles_documento unique (documento),
  constraint ck_profiles_nombres   check (char_length(nombres) <= 120),
  constraint ck_profiles_documento check (documento ~ '^[A-Za-z0-9-]{4,20}$'),
  constraint ck_profiles_telefono  check (telefono  ~ '^[0-9 +()-]{7,20}$'),
  -- current_date en un CHECK solo se evalúa al escribir la fila, que es lo que
  -- queremos: impedir fechas de nacimiento futuras al registrar o editar.
  constraint ck_profiles_fecha_nacimiento
    check (fecha_nacimiento between date '1900-01-01' and current_date)
);

comment on table public.profiles is
  'Perfil público de cada usuario de auth.users. El rol solo lo cambia un admin (asignar_rol).';

-- 3.2 specialties: catálogo de especialidades.
create table public.specialties (
  id          bigint generated always as identity primary key,
  nombre      text not null,
  descripcion text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),

  constraint ck_specialties_nombre      check (char_length(btrim(nombre)) between 2 and 80),
  constraint ck_specialties_descripcion check (char_length(descripcion) <= 300)
);

-- Único sin distinguir mayúsculas: "Pediatría" y "pediatría" son la misma.
create unique index uq_specialties_nombre on public.specialties (lower(btrim(nombre)));

-- 3.3 professionals: un perfil con rol profesional y su especialidad.
-- nombre_publico existe porque el paciente no puede leer profiles ajenos (P9).
create table public.professionals (
  id                   bigint generated always as identity primary key,
  profile_id           uuid   not null references public.profiles (id)    on delete restrict,
  specialty_id         bigint not null references public.specialties (id) on delete restrict,
  nombre_publico       text   not null,
  registro_profesional text,
  activo               boolean not null default true,
  created_at           timestamptz not null default now(),

  constraint uq_professionals_profile  unique (profile_id),
  constraint uq_professionals_registro unique (registro_profesional),
  constraint ck_professionals_nombre   check (char_length(btrim(nombre_publico)) between 2 and 120),
  constraint ck_professionals_registro check (char_length(registro_profesional) between 3 and 30)
);

create index idx_professionals_specialty on public.professionals (specialty_id);

-- 3.4 schedules: cada fila es UNA franja concreta (C2): profesional + fecha +
-- hora de inicio + hora de fin. El admin las crea en bloque con generar_franjas.
create table public.schedules (
  id              bigint generated always as identity primary key,
  professional_id bigint not null references public.professionals (id) on delete restrict,
  fecha           date   not null,
  hora_inicio     time   not null,
  hora_fin        time   not null,
  activo          boolean not null default true,
  created_by      uuid references public.profiles (id) on delete restrict
                  default auth.uid(),
  created_at      timestamptz not null default now(),

  -- La franja no cruza la medianoche y dura algo.
  constraint ck_schedules_horas check (hora_fin > hora_inicio),

  -- Necesaria para la FK compuesta desde appointments (C7).
  constraint uq_schedules_id_profesional unique (id, professional_id),

  -- P3: dos franjas ACTIVAS del mismo profesional no pueden cruzarse. Es la
  -- garantía final incluso con dos inserciones simultáneas. El trigger
  -- tg_proteger_franja da antes un error con nombre claro (HORARIO_SUPERPUESTO).
  -- Rango [inicio, fin): una franja 08:00-08:20 y otra 08:20-08:40 NO se cruzan.
  constraint ex_schedules_sin_cruce exclude using gist (
    professional_id with =,
    tsrange(fecha + hora_inicio, fecha + hora_fin) with &&
  ) where (activo)
);

create index idx_schedules_profesional_fecha on public.schedules (professional_id, fecha, hora_inicio);
create index idx_schedules_fecha             on public.schedules (fecha, hora_inicio);

-- 3.5 appointments: la cita. Ocupa una franja.
create table public.appointments (
  id              bigint generated always as identity primary key,
  patient_id      uuid   not null references public.profiles (id)      on delete restrict,
  professional_id bigint not null references public.professionals (id) on delete restrict,
  schedule_id     bigint not null,
  motivo          text,
  estado          public.estado_cita not null default 'programada',
  observaciones   text,
  cancelado_por   public.rol_usuario,
  created_at      timestamptz not null default now(),
  cancelled_at    timestamptz,

  -- C7: professional_id es redundante (está en la franja), pero se conserva para
  -- filtrar rápido. Esta FK compuesta garantiza que coincida con el de la franja:
  -- una cita nunca puede apuntar a la franja de otro profesional.
  constraint fk_appointments_schedule
    foreign key (schedule_id, professional_id)
    references public.schedules (id, professional_id) on delete restrict,

  -- P15: el motivo es breve y no clínico.
  constraint ck_appointments_motivo        check (char_length(motivo) <= 200),
  constraint ck_appointments_observaciones check (char_length(observaciones) <= 500),

  -- Coherencia: una cita está cancelada si y solo si tiene fecha de cancelación.
  constraint ck_appointments_cancelacion
    check ((estado = 'cancelada') = (cancelled_at is not null))
);

-- P2: una franja tiene como máximo UNA cita activa. El índice es PARCIAL: las citas
-- canceladas no cuentan, así que al cancelar la franja se puede volver a reservar
-- (CP-09). Si dos reservas llegan a la vez, PostgreSQL deja pasar solo una y la
-- otra recibe unique_violation, que reservar_cita traduce a FRANJA_OCUPADA (CP-02).
create unique index uq_franja_con_cita_activa
  on public.appointments (schedule_id)
  where estado <> 'cancelada';

create index idx_appointments_patient      on public.appointments (patient_id);
create index idx_appointments_professional on public.appointments (professional_id, estado);
create index idx_appointments_schedule     on public.appointments (schedule_id);

-- 3.6 status_history: quién cambió qué estado y cuándo (sección 5.3).
-- La escribe SOLO el trigger tg_historial_cita; nadie tiene permiso de escritura.
create table public.status_history (
  id              bigint generated always as identity primary key,
  appointment_id  bigint not null references public.appointments (id) on delete restrict,
  estado_anterior public.estado_cita,            -- null = creación de la cita
  estado_nuevo    public.estado_cita not null,
  changed_by      uuid references public.profiles (id) on delete restrict,
  changed_at      timestamptz not null default now(),

  constraint ck_status_history_cambio check (estado_anterior is distinct from estado_nuevo)
);

create index idx_status_history_cita on public.status_history (appointment_id, changed_at);

-- 3.7 transiciones_validas: tabla catálogo de la máquina de estados (P6).
-- Al ser una tabla (y no un IF en el código), las reglas se pueden consultar
-- desde el frontend y mostrar en la documentación.
create table public.transiciones_validas (
  desde public.estado_cita not null,
  hacia public.estado_cita not null,
  primary key (desde, hacia),
  constraint ck_transiciones_distintas check (desde <> hacia)
);

insert into public.transiciones_validas (desde, hacia) values
  ('programada', 'confirmada'),
  ('programada', 'cancelada'),
  ('confirmada', 'atendida'),
  ('confirmada', 'no_asistio'),
  ('confirmada', 'cancelada');
-- atendida, cancelada y no_asistio no tienen salida: son estados finales.


-- -----------------------------------------------------------------------------
-- 4. Triggers
-- -----------------------------------------------------------------------------
-- Convención de errores: raise exception '<CODIGO>' using detail = '<explicación>'.
-- El frontend compara error.message con el código (docs/contrato_api.md §4).

-- 4.1 Crear el perfil al registrarse (P4).
-- El rol SIEMPRE es 'paciente'. Nunca se lee de raw_user_meta_data, porque esos
-- metadatos los envía el navegador en signUp() y cualquiera podría poner
-- {"rol": "admin"}. Solo se toma "nombres", limpio y recortado.
-- security definer: se ejecuta con los permisos del dueño (postgres), porque el
-- usuario que se registra todavía no tiene permiso para insertar en profiles.
create function public.tg_crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, nombres, rol)
  values (
    new.id,
    new.email,
    left(btrim(coalesce(new.raw_user_meta_data ->> 'nombres', '')), 120),
    'paciente'
  );
  return new;
end
$$;

create trigger trg_nuevo_usuario
  after insert on auth.users
  for each row execute function public.tg_crear_perfil();

-- Cuentas que ya existían en Supabase Auth antes de ejecutar este script (por
-- ejemplo, si se reconstruye la base con sql/reiniciar.sql): se les crea el
-- perfil con la misma regla del trigger, siempre como paciente.
insert into public.profiles (id, email, nombres, rol)
select u.id, u.email,
       left(btrim(coalesce(u.raw_user_meta_data ->> 'nombres', '')), 120),
       'paciente'
from auth.users u
on conflict (id) do nothing;

-- 4.2 Validar los cambios de una cita (P6, P7).
-- Defensa en profundidad: aunque solo las RPC escriben en appointments, el trigger
-- valida también, así que ni un error en una RPC ni un UPDATE desde el SQL Editor
-- pueden romper la máquina de estados.
create function public.tg_validar_cita()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Quién, para quién y en qué franja no cambian nunca. Para "mover" una cita se
  -- cancela y se reserva otra.
  if new.patient_id      is distinct from old.patient_id
  or new.professional_id is distinct from old.professional_id
  or new.schedule_id     is distinct from old.schedule_id
  or new.created_at      is distinct from old.created_at then
    raise exception 'DATOS_INVALIDOS'
      using detail = 'patient_id, professional_id, schedule_id y created_at no se pueden modificar.';
  end if;

  if new.estado is distinct from old.estado then
    if not exists (select 1 from public.transiciones_validas
                   where desde = old.estado and hacia = new.estado) then
      raise exception 'TRANSICION_INVALIDA'
        using detail = format('No se permite pasar de %s a %s.', old.estado, new.estado);
    end if;

    if new.estado = 'cancelada' then
      new.cancelled_at  := now();
      -- Rol de quien cancela; null si se hace desde el SQL Editor (sin sesión).
      new.cancelado_por := (select rol from public.profiles where id = auth.uid());
    end if;
  else
    -- Sin cambio de estado no se tocan los datos de cancelación.
    new.cancelled_at  := old.cancelled_at;
    new.cancelado_por := old.cancelado_por;
  end if;

  return new;
end
$$;

create trigger trg_validar_cita
  before update on public.appointments
  for each row execute function public.tg_validar_cita();

-- 4.3 Historial automático (sección 5.3: las acciones quedan asociadas al usuario).
-- AFTER para registrar solo lo que de verdad se guardó. Registra la creación
-- (estado_anterior = null) y cada cambio de estado, con changed_by = auth.uid().
create function public.tg_historial_cita()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.status_history (appointment_id, estado_anterior, estado_nuevo, changed_by)
    values (new.id, null, new.estado, auth.uid());
  elsif new.estado is distinct from old.estado then
    insert into public.status_history (appointment_id, estado_anterior, estado_nuevo, changed_by)
    values (new.id, old.estado, new.estado, auth.uid());
  end if;
  return null;   -- el valor de retorno de un trigger AFTER se ignora
end
$$;

create trigger trg_historial_cita
  after insert or update of estado on public.appointments
  for each row execute function public.tg_historial_cita();

-- 4.4 Proteger las franjas (P3 y P12, pregunta 6.2 del enunciado).
--  a) Una franja no cambia de profesional.
--  b) Una franja con cita activa no se mueve ni se desactiva → FRANJA_CON_CITA.
--     Primero se cancela la cita (queda en el historial y el paciente la ve como
--     "Cancelada por la institución").
--  c) Una franja activa no se cruza con otra activa del mismo profesional →
--     HORARIO_SUPERPUESTO. La restricción ex_schedules_sin_cruce hace lo mismo,
--     pero su error (23P01) es menos claro; este chequeo se adelanta.
--  d) created_by siempre es quien inserta (no se puede falsificar).
create function public.tg_proteger_franja()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
  else
    if new.professional_id is distinct from old.professional_id then
      raise exception 'DATOS_INVALIDOS'
        using detail = 'Una franja no puede cambiar de profesional. Desactívela y cree otra.';
    end if;
    new.created_by := old.created_by;
    new.created_at := old.created_at;

    if (new.fecha       is distinct from old.fecha
        or new.hora_inicio is distinct from old.hora_inicio
        or new.hora_fin    is distinct from old.hora_fin
        or (old.activo and not new.activo))
       and exists (select 1 from public.appointments a
                   where a.schedule_id = old.id
                     and a.estado in ('programada', 'confirmada')) then
      raise exception 'FRANJA_CON_CITA'
        using detail = 'La franja tiene una cita activa. Cancele la cita antes de modificarla.';
    end if;
  end if;

  if new.activo and exists (
       select 1 from public.schedules s
       where s.professional_id = new.professional_id
         and s.activo
         and s.id <> coalesce(new.id, -1)
         and tsrange(s.fecha + s.hora_inicio, s.fecha + s.hora_fin)
             && tsrange(new.fecha + new.hora_inicio, new.fecha + new.hora_fin)) then
    raise exception 'HORARIO_SUPERPUESTO'
      using detail = format('La franja %s %s-%s se cruza con otra franja activa del profesional %s.',
                            new.fecha, new.hora_inicio, new.hora_fin, new.professional_id);
  end if;

  return new;
end
$$;

create trigger trg_proteger_franja
  before insert or update on public.schedules
  for each row execute function public.tg_proteger_franja();

-- 4.5 Las citas y el historial nunca se borran (P13). Además de no dar el permiso
-- DELETE, este trigger lo impide incluso desde el SQL Editor por descuido.
create function public.tg_impedir_borrado()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'NO_AUTORIZADO'
    using detail = format('Las filas de %s no se borran: son la trazabilidad de la agenda.', tg_table_name);
end
$$;

create trigger trg_no_borrar_citas
  before delete on public.appointments
  for each row execute function public.tg_impedir_borrado();

create trigger trg_no_borrar_historial
  before delete on public.status_history
  for each row execute function public.tg_impedir_borrado();

commit;
