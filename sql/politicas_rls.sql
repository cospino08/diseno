-- =============================================================================
-- politicas_rls.sql  —  Paso 2 de 3. Permisos, RLS y funciones RPC.
-- =============================================================================
-- Requiere haber ejecutado esquema.sql. Dueño: P2.
--
-- Modelo de seguridad en tres capas (sección 10 del enunciado):
--   1. PERMISOS (GRANT/REVOKE): qué operaciones y qué COLUMNAS puede tocar cada
--      rol de PostgreSQL. RLS controla filas, no columnas (P4).
--   2. RLS (políticas): qué FILAS ve o modifica cada usuario.
--   3. RPC security definer: las escrituras delicadas (citas, roles) solo pasan
--      por funciones que validan quién llama y las reglas de negocio.
--
-- Roles de PostgreSQL en Supabase:
--   anon          = petición sin sesión (solo la clave pública).  → No ve nada.
--   authenticated = petición con sesión iniciada.                 → Depende de profiles.rol.
-- El rol de NEGOCIO (paciente / profesional / admin) está en profiles.rol y se
-- consulta con rol_actual().
--
-- Sobre "security definer": la función se ejecuta con los permisos de su dueño
-- (postgres), que no está sujeto a RLS. Por eso CADA una:
--   * fija "set search_path = public, pg_temp": así nadie puede colar una tabla o
--     función con el mismo nombre en otro esquema. pg_temp va al final a propósito:
--     si no se nombra, PostgreSQL lo busca PRIMERO.
--   * valida explícitamente el rol y la propiedad de los datos con auth.uid().
--   * tiene "revoke execute ... from public, anon": en Supabase toda función nueva
--     queda ejecutable por anon por defecto (P7).
-- =============================================================================


-- Todo el archivo va en una transacción: si algo falla, no queda nada a medias
-- y se puede corregir y volver a ejecutar.
begin;

-- -----------------------------------------------------------------------------
-- 1. Funciones auxiliares para las políticas (P5)
-- -----------------------------------------------------------------------------

-- Rol del usuario de la sesión, o null si no hay sesión o su perfil está inactivo.
-- Es security definer para leer profiles SIN pasar por RLS: si una política de
-- profiles consultara profiles directamente, entraría en recursión infinita.
-- En las políticas se usa como (select public.rol_actual()) para que PostgreSQL la
-- evalúe una sola vez por consulta y no una vez por fila.
create function public.rol_actual()
returns public.rol_usuario
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select rol from public.profiles where id = auth.uid() and activo
$$;

-- id en professionals del usuario de la sesión, o null si no es un profesional activo.
create function public.mi_profesional_id()
returns bigint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id
  from public.professionals p
  join public.profiles pr on pr.id = p.profile_id
  where p.profile_id = auth.uid()
    and p.activo
    and pr.activo
    and pr.rol = 'profesional'
$$;


-- -----------------------------------------------------------------------------
-- 2. Activar RLS en TODAS las tablas (RNF-01)
-- -----------------------------------------------------------------------------
-- Con RLS activo y sin políticas, nadie (salvo el dueño) ve ninguna fila. Las
-- políticas de la sección 4 abren solo lo necesario.

alter table public.profiles             enable row level security;
alter table public.specialties          enable row level security;
alter table public.professionals        enable row level security;
alter table public.schedules            enable row level security;
alter table public.appointments         enable row level security;
alter table public.status_history       enable row level security;
alter table public.transiciones_validas enable row level security;


-- -----------------------------------------------------------------------------
-- 3. Permisos de tabla y de columna (mínimo privilegio)
-- -----------------------------------------------------------------------------
-- Supabase da por defecto TODOS los permisos a anon y authenticated sobre las
-- tablas nuevas. Primero se quita todo y luego se concede lo justo.

revoke all on table
  public.profiles, public.specialties, public.professionals, public.schedules,
  public.appointments, public.status_history, public.transiciones_validas
from anon, authenticated;

-- Lectura: solo con sesión. Qué filas ve cada uno lo deciden las políticas.
grant select on table
  public.profiles, public.specialties, public.professionals, public.schedules,
  public.appointments, public.status_history, public.transiciones_validas
to authenticated;

-- profiles (P4): el usuario SOLO puede editar sus datos personales. Las columnas
-- rol, activo, email e id no aparecen aquí, así que un
--   update profiles set rol = 'admin'
-- falla con "permission denied" (42501) ANTES de llegar a RLS (CP-06).
grant update (nombres, documento, telefono, fecha_nacimiento)
  on public.profiles to authenticated;

-- Catálogos que gestiona el admin. Las políticas exigen rol admin; estos permisos
-- limitan además las columnas (nadie escribe id ni created_at).
grant insert (nombre, descripcion, activo),
      update (nombre, descripcion, activo)
  on public.specialties to authenticated;

-- professionals: sin INSERT. Un profesional solo nace con asignar_rol, que además
-- cambia profiles.rol; así nunca hay un "profesional" que siga siendo paciente.
grant update (specialty_id, nombre_publico, registro_profesional, activo)
  on public.professionals to authenticated;

-- schedules: professional_id solo al crear; created_by lo pone el trigger.
grant insert (professional_id, fecha, hora_inicio, hora_fin, activo),
      update (fecha, hora_inicio, hora_fin, activo)
  on public.schedules to authenticated;

-- appointments y status_history: SIN insert/update/delete para nadie (P7).
-- Todo pasa por reservar_cita, cancelar_cita y cambiar_estado_cita.
-- Ninguna tabla tiene DELETE: borrado lógico con activo = false (P13).


-- -----------------------------------------------------------------------------
-- 4. Políticas RLS
-- -----------------------------------------------------------------------------
-- Nomenclatura: <tabla>_<operación>_<quién>.
-- "to authenticated": las políticas ni siquiera se evalúan para anon.

-- 4.1 profiles
create policy profiles_select_propio_o_admin on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.rol_actual()) = 'admin');

create policy profiles_update_propio_o_admin on public.profiles
  for update to authenticated
  using      (id = (select auth.uid()) or (select public.rol_actual()) = 'admin')
  with check (id = (select auth.uid()) or (select public.rol_actual()) = 'admin');

-- 4.2 specialties: todos ven las activas; el admin ve y gestiona todas.
create policy specialties_select_activas_o_admin on public.specialties
  for select to authenticated
  using (activo or (select public.rol_actual()) = 'admin');

create policy specialties_insert_admin on public.specialties
  for insert to authenticated
  with check ((select public.rol_actual()) = 'admin');

create policy specialties_update_admin on public.specialties
  for update to authenticated
  using      ((select public.rol_actual()) = 'admin')
  with check ((select public.rol_actual()) = 'admin');

-- 4.3 professionals: todos ven los activos; el profesional se ve a sí mismo
-- aunque esté inactivo; el admin ve y edita todos.
create policy professionals_select_activos_propio_o_admin on public.professionals
  for select to authenticated
  using (activo
         or profile_id = (select auth.uid())
         or (select public.rol_actual()) = 'admin');

create policy professionals_update_admin on public.professionals
  for update to authenticated
  using      ((select public.rol_actual()) = 'admin')
  with check ((select public.rol_actual()) = 'admin');

-- 4.4 schedules: las franjas activas no tienen datos personales y cualquiera con
-- sesión puede verlas. Además: el profesional ve todas las suyas, el paciente las
-- de sus citas (aunque luego se desactiven) y el admin todas.
-- No hay recursión: la política de appointments no consulta schedules.
create policy schedules_select on public.schedules
  for select to authenticated
  using (
    activo
    or (select public.rol_actual()) = 'admin'
    or professional_id = (select public.mi_profesional_id())
    or exists (select 1 from public.appointments a
               where a.schedule_id = schedules.id
                 and a.patient_id = (select auth.uid()))
  );

create policy schedules_insert_admin on public.schedules
  for insert to authenticated
  with check ((select public.rol_actual()) = 'admin');

create policy schedules_update_admin on public.schedules
  for update to authenticated
  using      ((select public.rol_actual()) = 'admin')
  with check ((select public.rol_actual()) = 'admin');

-- 4.5 appointments: la política que protege las citas del paciente (sección 18).
--   paciente    → solo patient_id = su uid       (CP-03)
--   profesional → solo las asignadas a él        (CP-04, RF-10)
--   admin       → todas
-- Solo SELECT: no hay políticas de escritura porque no hay permisos de escritura.
create policy appointments_select_paciente_profesional_admin on public.appointments
  for select to authenticated
  using (
    patient_id = (select auth.uid())
    or professional_id = (select public.mi_profesional_id())
    or (select public.rol_actual()) = 'admin'
  );

-- 4.6 status_history: se ve el historial de las citas que uno puede ver. La
-- subconsulta sobre appointments pasa a su vez por la RLS de appointments.
create policy status_history_select_si_ve_la_cita on public.status_history
  for select to authenticated
  using (exists (select 1 from public.appointments a where a.id = status_history.appointment_id));

-- 4.7 transiciones_validas: catálogo sin datos personales.
create policy transiciones_select_todos on public.transiciones_validas
  for select to authenticated
  using (true);


-- -----------------------------------------------------------------------------
-- 5. Funciones RPC (contrato: docs/contrato_api.md §3)
-- -----------------------------------------------------------------------------
-- Errores: raise exception '<CODIGO>' using detail = '...'. El frontend lee el
-- código en error.message (contrato §4).
-- "#variable_conflict use_column": en las funciones que devuelven "table (...)",
-- los nombres de columna de salida (fecha, estado...) son también variables; esta
-- directiva hace que en las consultas ganen las columnas de las tablas.

-- 5.1 franjas_disponibles (P8) -------------------------------------------------
-- El paciente no puede ver las citas de otros (RLS), así que no podría saber qué
-- franjas están ocupadas. Esta función sí lo sabe y devuelve SOLO las franjas
-- libres, sin ningún dato de las citas ajenas.
create function public.franjas_disponibles(
  p_especialidad bigint default null,
  p_profesional  bigint default null,
  p_fecha        date   default null
)
returns table (
  schedule_id     bigint,
  fecha           date,
  hora_inicio     time,
  hora_fin        time,
  professional_id bigint,
  profesional     text,
  specialty_id    bigint,
  especialidad    text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select s.id, s.fecha, s.hora_inicio, s.hora_fin,
         p.id, p.nombre_publico, e.id, e.nombre
  from public.schedules s
  join public.professionals p  on p.id  = s.professional_id
  join public.profiles      pr on pr.id = p.profile_id
  join public.specialties   e  on e.id  = p.specialty_id
  where public.rol_actual() is not null            -- usuario con sesión y activo
    and s.activo and p.activo and pr.activo and e.activo
    and (p_especialidad is null or e.id = p_especialidad)
    and (p_profesional  is null or p.id = p_profesional)
    and (case when p_fecha is null
              then s.fecha between public.hoy_local() and public.hoy_local() + 30
              else s.fecha = p_fecha end)
    and s.fecha + s.hora_inicio > public.ahora_local()     -- solo futuras
    and not exists (select 1 from public.appointments a    -- sin cita activa
                    where a.schedule_id = s.id and a.estado <> 'cancelada')
  order by s.fecha, s.hora_inicio, p.nombre_publico
$$;

-- 5.2 reservar_cita (P2, P7, CP-01, CP-02, CP-07) ------------------------------
-- Cómo se evita la doble reserva:
--   1. "select ... for update" bloquea la fila de la franja: si dos pacientes
--      reservan la misma franja a la vez, el segundo espera a que el primero
--      termine. También impide que el admin desactive la franja a mitad de la
--      reserva.
--   2. El índice único parcial uq_franja_con_cita_activa es la garantía final:
--      si ya hay una cita activa, el INSERT falla con unique_violation, que se
--      traduce a FRANJA_OCUPADA. No depende de ninguna consulta previa en JS.
create function public.reservar_cita(
  p_schedule_id bigint,
  p_motivo      text default null
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_franja public.schedules%rowtype;
  v_motivo text := nullif(btrim(p_motivo), '');
  v_id     bigint;
begin
  if public.rol_actual() is distinct from 'paciente' then
    raise exception 'SOLO_PACIENTES'
      using detail = 'Solo un paciente activo puede reservar citas.';
  end if;

  if not exists (select 1 from public.profiles
                 where id = auth.uid()
                   and btrim(nombres) <> ''
                   and documento is not null
                   and telefono is not null
                   and fecha_nacimiento is not null) then
    raise exception 'PERFIL_INCOMPLETO'
      using detail = 'Faltan nombres, documento, teléfono o fecha de nacimiento.';
  end if;

  if char_length(v_motivo) > 200 then
    raise exception 'DATOS_INVALIDOS'
      using detail = 'El motivo admite máximo 200 caracteres.';
  end if;

  select s.* into v_franja
  from public.schedules s
  join public.professionals p  on p.id  = s.professional_id
  join public.profiles      pr on pr.id = p.profile_id
  join public.specialties   e  on e.id  = p.specialty_id
  where s.id = p_schedule_id
    and s.activo and p.activo and pr.activo and e.activo
  for update of s;

  if not found then
    raise exception 'FRANJA_NO_EXISTE'
      using detail = format('La franja %s no existe o no está publicada.', p_schedule_id);
  end if;

  if v_franja.fecha + v_franja.hora_inicio <= public.ahora_local() then
    raise exception 'FRANJA_PASADA'
      using detail = 'La franja ya comenzó o es de una fecha pasada.';
  end if;

  begin
    -- patient_id SIEMPRE es auth.uid(): no existe un parámetro para reservar a
    -- nombre de otro, así que manipular IDs desde el navegador no sirve.
    insert into public.appointments (patient_id, professional_id, schedule_id, motivo, estado)
    values (auth.uid(), v_franja.professional_id, v_franja.id, v_motivo, 'programada')
    returning id into v_id;
  exception
    when unique_violation then
      raise exception 'FRANJA_OCUPADA'
        using detail = 'Otra persona reservó esta franja primero.';
  end;

  return v_id;
end
$$;

-- 5.3 mis_citas ------------------------------------------------------------------
create function public.mis_citas()
returns table (
  cita_id        bigint,
  fecha          date,
  hora_inicio    time,
  hora_fin       time,
  estado         public.estado_cita,
  motivo         text,
  observaciones  text,
  profesional    text,
  especialidad   text,
  cancelado_por  public.rol_usuario,
  created_at     timestamptz,
  cancelled_at   timestamptz,
  puede_cancelar boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
begin
  if public.rol_actual() is distinct from 'paciente' then
    raise exception 'SOLO_PACIENTES'
      using detail = 'Solo un paciente activo tiene "Mis citas".';
  end if;

  return query
    select a.id, s.fecha, s.hora_inicio, s.hora_fin, a.estado, a.motivo, a.observaciones,
           p.nombre_publico, e.nombre, a.cancelado_por, a.created_at, a.cancelled_at,
           -- Misma regla que cancelar_cita (C4: hasta 2 h antes).
           (a.estado in ('programada', 'confirmada')
            and public.ahora_local() <= s.fecha + s.hora_inicio - interval '2 hours')
    from public.appointments a
    join public.schedules     s on s.id = a.schedule_id
    join public.professionals p on p.id = a.professional_id
    join public.specialties   e on e.id = p.specialty_id
    where a.patient_id = auth.uid()
    order by s.fecha desc, s.hora_inicio desc;
end
$$;

-- 5.4 cancelar_cita (C4, P2, CP-08, CP-09) ---------------------------------------
-- La franja NO se borra: la cita queda 'cancelada' y, como el índice único es
-- parcial, la franja vuelve a estar disponible sola.
create function public.cancelar_cita(p_cita_id bigint)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rol    public.rol_usuario := public.rol_actual();
  v_cita   public.appointments%rowtype;
  v_inicio timestamp;
begin
  if v_rol is null then
    raise exception 'NO_AUTORIZADO' using detail = 'Se requiere un usuario activo.';
  end if;

  select * into v_cita from public.appointments where id = p_cita_id for update;

  -- "No existe" y "no es tuya" dan el MISMO error a propósito: así nadie puede
  -- averiguar qué IDs de citas existen probando números (CP-03).
  if not found
     or (v_rol = 'paciente'    and v_cita.patient_id <> auth.uid())
     or (v_rol = 'profesional' and v_cita.professional_id is distinct from public.mi_profesional_id()) then
    raise exception 'NO_AUTORIZADO'
      using detail = 'La cita no existe o no pertenece al usuario.';
  end if;

  if not exists (select 1 from public.transiciones_validas
                 where desde = v_cita.estado and hacia = 'cancelada') then
    raise exception 'TRANSICION_INVALIDA'
      using detail = format('Una cita %s no se puede cancelar.', v_cita.estado);
  end if;

  if v_rol = 'paciente' then
    select fecha + hora_inicio into v_inicio from public.schedules where id = v_cita.schedule_id;
    if public.ahora_local() > v_inicio - interval '2 hours' then
      raise exception 'FUERA_DE_PLAZO'
        using detail = 'El paciente solo puede cancelar hasta 2 horas antes del inicio.';
    end if;
  end if;

  -- El trigger tg_validar_cita llena cancelled_at y cancelado_por, y
  -- tg_historial_cita escribe status_history.
  update public.appointments set estado = 'cancelada' where id = p_cita_id;
end
$$;

-- 5.5 cambiar_estado_cita (P6, P7, CP-04, CP-10) ---------------------------------
create function public.cambiar_estado_cita(
  p_cita_id       bigint,
  p_estado        public.estado_cita,
  p_observaciones text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rol    public.rol_usuario := public.rol_actual();
  v_cita   public.appointments%rowtype;
  v_obs    text := nullif(btrim(p_observaciones), '');
  v_inicio timestamp;
begin
  if v_rol is null or v_rol not in ('profesional', 'admin') then
    raise exception 'NO_AUTORIZADO'
      using detail = 'Solo el profesional asignado o un admin cambian el estado.';
  end if;

  if p_estado is null or char_length(v_obs) > 500 then
    raise exception 'DATOS_INVALIDOS'
      using detail = 'Estado obligatorio; observaciones de máximo 500 caracteres.';
  end if;

  select * into v_cita from public.appointments where id = p_cita_id for update;

  if not found
     or (v_rol = 'profesional' and v_cita.professional_id is distinct from public.mi_profesional_id()) then
    raise exception 'NO_AUTORIZADO'
      using detail = 'La cita no existe o no está asignada a este profesional.';
  end if;

  -- Mismo estado: solo se actualizan las observaciones (no es una transición).
  if p_estado = v_cita.estado then
    update public.appointments
       set observaciones = coalesce(v_obs, observaciones)
     where id = p_cita_id;
    return;
  end if;

  if not exists (select 1 from public.transiciones_validas
                 where desde = v_cita.estado and hacia = p_estado) then
    raise exception 'TRANSICION_INVALIDA'
      using detail = format('No se permite pasar de %s a %s.', v_cita.estado, p_estado);
  end if;

  if p_estado in ('atendida', 'no_asistio') then
    select fecha + hora_inicio into v_inicio from public.schedules where id = v_cita.schedule_id;
    if public.ahora_local() < v_inicio then
      raise exception 'ANTES_DE_HORA'
        using detail = 'Atendida o no asistió solo se marcan desde la hora de inicio.';
    end if;
  end if;

  update public.appointments
     set estado = p_estado,
         observaciones = coalesce(v_obs, observaciones)
   where id = p_cita_id;
end
$$;

-- 5.6 mi_agenda (P9, CP-17) --------------------------------------------------------
-- El profesional no puede leer profiles de sus pacientes (RLS). Esta función le
-- entrega solo lo necesario para atenderlos: nombre y teléfono.
create function public.mi_agenda(
  p_desde date default null,
  p_hasta date default null
)
returns table (
  cita_id           bigint,
  schedule_id       bigint,
  fecha             date,
  hora_inicio       time,
  hora_fin          time,
  estado            public.estado_cita,
  motivo            text,
  observaciones     text,
  paciente_nombres  text,
  paciente_telefono text,
  cancelado_por     public.rol_usuario
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_prof  bigint := public.mi_profesional_id();
  v_desde date   := coalesce(p_desde, public.hoy_local());
  v_hasta date   := coalesce(p_hasta, p_desde, public.hoy_local());
begin
  if v_prof is null then
    raise exception 'NO_AUTORIZADO'
      using detail = 'Solo un profesional activo tiene agenda.';
  end if;

  if v_hasta < v_desde or v_hasta - v_desde > 30 then
    raise exception 'DATOS_INVALIDOS'
      using detail = 'El rango debe ir de p_desde a p_hasta y durar máximo 31 días.';
  end if;

  return query
    select a.id, s.id, s.fecha, s.hora_inicio, s.hora_fin, a.estado, a.motivo,
           a.observaciones, pa.nombres, pa.telefono, a.cancelado_por
    from public.appointments a
    join public.schedules s  on s.id  = a.schedule_id
    join public.profiles  pa on pa.id = a.patient_id
    where a.professional_id = v_prof
      and s.fecha between v_desde and v_hasta
    order by s.fecha, s.hora_inicio, a.created_at;
end
$$;

-- 5.7 citas_admin ---------------------------------------------------------------------
create function public.citas_admin(
  p_desde       date               default null,
  p_hasta       date               default null,
  p_profesional bigint             default null,
  p_estado      public.estado_cita default null
)
returns table (
  cita_id            bigint,
  schedule_id        bigint,
  fecha              date,
  hora_inicio        time,
  hora_fin           time,
  estado             public.estado_cita,
  motivo             text,
  observaciones      text,
  paciente_nombres   text,
  paciente_telefono  text,
  cancelado_por      public.rol_usuario,
  professional_id    bigint,
  profesional        text,
  especialidad       text,
  patient_id         uuid,
  paciente_documento text
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_desde date := coalesce(p_desde, public.hoy_local());
  v_hasta date := coalesce(p_hasta, coalesce(p_desde, public.hoy_local()) + 30);
begin
  if public.rol_actual() is distinct from 'admin' then
    raise exception 'NO_AUTORIZADO' using detail = 'Solo para administradores.';
  end if;

  if v_hasta < v_desde or v_hasta - v_desde > 365 then
    raise exception 'DATOS_INVALIDOS'
      using detail = 'El rango debe ir de p_desde a p_hasta y durar máximo 366 días.';
  end if;

  return query
    select a.id, s.id, s.fecha, s.hora_inicio, s.hora_fin, a.estado, a.motivo,
           a.observaciones, pa.nombres, pa.telefono, a.cancelado_por,
           p.id, p.nombre_publico, e.nombre, pa.id, pa.documento
    from public.appointments a
    join public.schedules     s  on s.id  = a.schedule_id
    join public.profiles      pa on pa.id = a.patient_id
    join public.professionals p  on p.id  = a.professional_id
    join public.specialties   e  on e.id  = p.specialty_id
    where s.fecha between v_desde and v_hasta
      and (p_profesional is null or a.professional_id = p_profesional)
      and (p_estado      is null or a.estado = p_estado)
    order by s.fecha, s.hora_inicio, p.nombre_publico;
end
$$;

-- 5.8 generar_franjas (C2, P3, CP-11) ----------------------------------------------
-- Todo o nada: la función corre en una sola transacción; si una franja se cruza,
-- el error deshace también las que ya se habían insertado.
create function public.generar_franjas(
  p_profesional bigint,
  p_fecha       date,
  p_inicio      time,
  p_fin         time,
  p_minutos     integer
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_paso   interval;
  v_actual timestamp;
  v_limite timestamp;
  v_total  integer := 0;
begin
  if public.rol_actual() is distinct from 'admin' then
    raise exception 'NO_AUTORIZADO' using detail = 'Solo para administradores.';
  end if;

  if p_profesional is null or p_fecha is null or p_inicio is null or p_fin is null
     or p_minutos is null or p_minutos not between 10 and 240 or p_fin <= p_inicio then
    raise exception 'DATOS_INVALIDOS'
      using detail = 'Todos los parámetros son obligatorios; p_fin > p_inicio; p_minutos entre 10 y 240.';
  end if;

  if not exists (select 1 from public.professionals where id = p_profesional and activo) then
    raise exception 'DATOS_INVALIDOS'
      using detail = format('El profesional %s no existe o está inactivo.', p_profesional);
  end if;

  if p_fecha + p_inicio < public.ahora_local() then
    raise exception 'FRANJA_PASADA'
      using detail = 'No se crean franjas en el pasado.';
  end if;

  -- Se itera con timestamp y no con time, porque time da la vuelta a medianoche
  -- (23:50 + 20 min = 00:10) y el ciclo nunca terminaría.
  v_paso   := make_interval(mins => p_minutos);
  v_actual := p_fecha + p_inicio;
  v_limite := p_fecha + p_fin;

  begin
    while v_actual + v_paso <= v_limite loop
      insert into public.schedules (professional_id, fecha, hora_inicio, hora_fin)
      values (p_profesional, p_fecha, v_actual::time, (v_actual + v_paso)::time);
      v_total  := v_total + 1;
      v_actual := v_actual + v_paso;
    end loop;
  exception
    -- El trigger ya da HORARIO_SUPERPUESTO; esto cubre el caso raro de dos admins
    -- creando a la vez franjas que se cruzan (lo detecta la restricción EXCLUDE).
    when exclusion_violation then
      raise exception 'HORARIO_SUPERPUESTO'
        using detail = 'Las franjas se cruzan con otras creadas al mismo tiempo.';
  end;

  return v_total;
end
$$;

-- 5.9 asignar_rol (P10) ----------------------------------------------------------------
-- Desde el navegador no se pueden crear cuentas ajenas sin la service_role (que
-- está prohibida). Flujo: la persona se registra (queda paciente) y el admin la
-- promueve aquí. El primer admin se nombra a mano (ver datos_prueba.sql).
create function public.asignar_rol(
  p_usuario        uuid,
  p_rol            public.rol_usuario,
  p_especialidad   bigint default null,
  p_nombre_publico text   default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_perfil public.profiles%rowtype;
  v_nombre text;
begin
  if public.rol_actual() is distinct from 'admin' then
    raise exception 'NO_AUTORIZADO' using detail = 'Solo para administradores.';
  end if;

  if p_usuario = auth.uid() then
    raise exception 'NO_AUTORIZADO'
      using detail = 'Un admin no puede cambiar su propio rol (evita quedarse sin administradores).';
  end if;

  if p_usuario is null or p_rol is null then
    raise exception 'DATOS_INVALIDOS' using detail = 'p_usuario y p_rol son obligatorios.';
  end if;

  select * into v_perfil from public.profiles where id = p_usuario for update;
  if not found then
    raise exception 'DATOS_INVALIDOS' using detail = 'El usuario no existe.';
  end if;

  if p_rol = 'profesional' then
    if p_especialidad is null
       or not exists (select 1 from public.specialties where id = p_especialidad and activo) then
      raise exception 'DATOS_INVALIDOS'
        using detail = 'Un profesional necesita una especialidad activa.';
    end if;

    v_nombre := coalesce(nullif(btrim(p_nombre_publico), ''), nullif(btrim(v_perfil.nombres), ''));
    if v_nombre is null or char_length(v_nombre) not between 2 and 120 then
      raise exception 'DATOS_INVALIDOS'
        using detail = 'Falta el nombre público del profesional (2 a 120 caracteres).';
    end if;

    insert into public.professionals (profile_id, specialty_id, nombre_publico)
    values (p_usuario, p_especialidad, v_nombre)
    on conflict (profile_id) do update
      set specialty_id   = excluded.specialty_id,
          nombre_publico = excluded.nombre_publico,
          activo         = true;
  else
    -- Deja de ser profesional: se desactiva su ficha, no se borra (sus franjas y
    -- citas pasadas siguen apuntando a ella).
    update public.professionals set activo = false where profile_id = p_usuario;
  end if;

  update public.profiles set rol = p_rol where id = p_usuario;
end
$$;

-- 5.10 cambiar_activo_perfil (P13) -----------------------------------------------------
create function public.cambiar_activo_perfil(p_usuario uuid, p_activo boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.rol_actual() is distinct from 'admin' then
    raise exception 'NO_AUTORIZADO' using detail = 'Solo para administradores.';
  end if;

  if p_usuario = auth.uid() then
    raise exception 'NO_AUTORIZADO' using detail = 'Un admin no puede desactivarse a sí mismo.';
  end if;

  if p_usuario is null or p_activo is null then
    raise exception 'DATOS_INVALIDOS' using detail = 'p_usuario y p_activo son obligatorios.';
  end if;

  update public.profiles set activo = p_activo where id = p_usuario;
  if not found then
    raise exception 'DATOS_INVALIDOS' using detail = 'El usuario no existe.';
  end if;

  -- Un profesional desactivado deja de publicar disponibilidad. Al reactivar la
  -- cuenta, el admin decide aparte si reactiva también su ficha de profesional.
  if not p_activo then
    update public.professionals set activo = false where profile_id = p_usuario;
  end if;
end
$$;

-- 5.11 anonimizar_paciente (P13) -------------------------------------------------------
-- Atiende una solicitud de baja sin perder la trazabilidad: se borran los datos
-- personales del perfil, pero las citas y su historial se conservan.
create function public.anonimizar_paciente(p_usuario uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.rol_actual() is distinct from 'admin' then
    raise exception 'NO_AUTORIZADO' using detail = 'Solo para administradores.';
  end if;

  if not exists (select 1 from public.profiles where id = p_usuario and rol = 'paciente') then
    raise exception 'DATOS_INVALIDOS' using detail = 'Solo se anonimizan perfiles de pacientes.';
  end if;

  -- Libera sus franjas futuras (quedan como canceladas por el admin).
  update public.appointments a
     set estado = 'cancelada'
    from public.schedules s
   where s.id = a.schedule_id
     and a.patient_id = p_usuario
     and a.estado in ('programada', 'confirmada')
     and s.fecha + s.hora_inicio > public.ahora_local();

  update public.profiles
     set nombres = 'Paciente anonimizado', email = null, documento = null,
         telefono = null, fecha_nacimiento = null, activo = false
   where id = p_usuario;
end
$$;

-- 5.12 indicadores_citas (P11, CP-15) ----------------------------------------------------
-- Solo conteos agregados: el admin no necesita leer fila por fila para ver totales.
create function public.indicadores_citas(
  p_desde      date,
  p_hasta      date,
  p_agrupacion text default 'mes'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_unidad text;
  v_resultado jsonb;
begin
  if public.rol_actual() is distinct from 'admin' then
    raise exception 'NO_AUTORIZADO' using detail = 'Solo para administradores.';
  end if;

  v_unidad := case p_agrupacion when 'dia' then 'day' when 'semana' then 'week' when 'mes' then 'month' end;

  if p_desde is null or p_hasta is null or p_hasta < p_desde or v_unidad is null then
    raise exception 'DATOS_INVALIDOS'
      using detail = 'p_desde <= p_hasta y p_agrupacion en (dia, semana, mes).';
  end if;

  with base as (
    select a.estado, e.nombre as especialidad,
           date_trunc(v_unidad, s.fecha)::date as periodo
    from public.appointments a
    join public.schedules     s on s.id = a.schedule_id
    join public.professionals p on p.id = a.professional_id
    join public.specialties   e on e.id = p.specialty_id
    where s.fecha between p_desde and p_hasta
  )
  select jsonb_build_object(
    'total', (select count(*) from base),
    'por_estado', coalesce((
        select jsonb_agg(jsonb_build_object('estado', estado, 'total', total) order by estado)
        from (select estado, count(*) as total from base group by estado) x), '[]'::jsonb),
    'por_especialidad', coalesce((
        select jsonb_agg(jsonb_build_object('especialidad', especialidad, 'total', total)
                         order by total desc, especialidad)
        from (select especialidad, count(*) as total from base group by especialidad) x), '[]'::jsonb),
    'por_periodo', coalesce((
        select jsonb_agg(jsonb_build_object('periodo', periodo, 'total', total) order by periodo)
        from (select periodo, count(*) as total from base group by periodo) x), '[]'::jsonb)
  ) into v_resultado;

  return v_resultado;
end
$$;


-- -----------------------------------------------------------------------------
-- 6. Permisos de ejecución de funciones
-- -----------------------------------------------------------------------------
-- Regla: revoke ... from public, anon en TODAS; grant a authenticated solo en las
-- que el frontend o las políticas necesitan. Sin esto, cualquiera con la clave
-- pública podría llamar las RPC sin iniciar sesión (CP-13).

-- RPC del contrato.
revoke execute on function public.rol_actual()                                                   from public, anon;
revoke execute on function public.franjas_disponibles(bigint, bigint, date)                      from public, anon;
revoke execute on function public.reservar_cita(bigint, text)                                    from public, anon;
revoke execute on function public.mis_citas()                                                    from public, anon;
revoke execute on function public.cancelar_cita(bigint)                                          from public, anon;
revoke execute on function public.cambiar_estado_cita(bigint, public.estado_cita, text)          from public, anon;
revoke execute on function public.mi_agenda(date, date)                                          from public, anon;
revoke execute on function public.citas_admin(date, date, bigint, public.estado_cita)            from public, anon;
revoke execute on function public.generar_franjas(bigint, date, time, time, integer)             from public, anon;
revoke execute on function public.asignar_rol(uuid, public.rol_usuario, bigint, text)            from public, anon;
revoke execute on function public.cambiar_activo_perfil(uuid, boolean)                           from public, anon;
revoke execute on function public.anonimizar_paciente(uuid)                                      from public, anon;
revoke execute on function public.indicadores_citas(date, date, text)                            from public, anon;

grant execute on function public.rol_actual()                                                    to authenticated;
grant execute on function public.franjas_disponibles(bigint, bigint, date)                       to authenticated;
grant execute on function public.reservar_cita(bigint, text)                                     to authenticated;
grant execute on function public.mis_citas()                                                     to authenticated;
grant execute on function public.cancelar_cita(bigint)                                           to authenticated;
grant execute on function public.cambiar_estado_cita(bigint, public.estado_cita, text)           to authenticated;
grant execute on function public.mi_agenda(date, date)                                           to authenticated;
grant execute on function public.citas_admin(date, date, bigint, public.estado_cita)             to authenticated;
grant execute on function public.generar_franjas(bigint, date, time, time, integer)              to authenticated;
grant execute on function public.asignar_rol(uuid, public.rol_usuario, bigint, text)             to authenticated;
grant execute on function public.cambiar_activo_perfil(uuid, boolean)                            to authenticated;
grant execute on function public.anonimizar_paciente(uuid)                                       to authenticated;
grant execute on function public.indicadores_citas(date, date, text)                             to authenticated;

-- Auxiliares que usan las políticas: las evalúa el usuario que consulta, así que
-- authenticated necesita poder ejecutarlas. Son de solo lectura y solo devuelven
-- datos del propio usuario o la hora actual.
revoke execute on function public.mi_profesional_id() from public, anon;
revoke execute on function public.ahora_local()       from public, anon;
revoke execute on function public.hoy_local()         from public, anon;
grant  execute on function public.mi_profesional_id() to authenticated;
grant  execute on function public.ahora_local()       to authenticated;
grant  execute on function public.hoy_local()         to authenticated;

-- Funciones de trigger: nadie las llama directamente.
revoke execute on function public.tg_crear_perfil()    from public, anon, authenticated;
revoke execute on function public.tg_validar_cita()    from public, anon, authenticated;
revoke execute on function public.tg_historial_cita()  from public, anon, authenticated;
revoke execute on function public.tg_proteger_franja() from public, anon, authenticated;
revoke execute on function public.tg_impedir_borrado() from public, anon, authenticated;

commit;
