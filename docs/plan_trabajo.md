# Plan de trabajo: Sistema web de reserva de citas médicas

Proyecto integrador de Análisis y Diseño de Software. Este plan reparte el enunciado
(`docs/enunciado.md`) entre **4 integrantes**. También corrige
las ambigüedades del enunciado y deja resueltos de antemano los problemas técnicos que
probablemente aparezcan.

---

## 0. Aclaraciones previas

### 0.1 Tamaño del equipo

> **Importante:** el enunciado (sección 3) dice **"Equipos máximo 2 estudiantes"**. Para
> trabajar con 4 integrantes hay que pedir **autorización al docente**. Si no la da, este
> mismo plan sirve para 2 personas juntando roles: P1 + P2 (análisis y base de datos) y
> P3 + P4 (frontend y pruebas).

### 0.2 Herramientas: solo las que exige el enunciado

El proyecto usa **únicamente** las tecnologías obligatorias de la sección 3 del enunciado:

| Herramienta | Uso en el proyecto |
| --- | --- |
| **HTML5** | Estructura semántica de todas las páginas y formularios accesibles. |
| **CSS3** | Estilos responsive (Flexbox/Grid, media queries, mínimo 360 px), sin frameworks CSS. |
| **JavaScript** (vanilla, módulos ES) | Lógica de interfaz, validación en cliente y llamadas a Supabase con `supabase-js` cargado por CDN. Sin React, Vue, Node ni empaquetadores. |
| **GitHub Pages** | Publicación del frontend estático. GitHub también aloja el repositorio, los commits, los issues y el tablero del proyecto. |
| **Supabase** | Auth (registro e inicio de sesión), PostgreSQL (tablas, restricciones, triggers, funciones RPC), API automática y Row Level Security. |

No se usa servidor propio ni otro backend. Todas las reglas críticas viven en PostgreSQL:
restricciones, triggers, funciones y políticas RLS. Así lo pide la sección 5.3 del enunciado.

Los diagramas (BPMN, ER, casos de uso, arquitectura, wireframes) son documentación, no parte
del sistema. Se pueden hacer con cualquier herramienta gratuita de diagramas y se exportan
como imagen a `docs/`.

Supabase se carga así, con la versión fijada:

```html
<script type="module">
  import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
</script>
```

---

## 1. Roles del equipo

| Integrante | Rol | Responsable principal de |
| --- | --- | --- |
| **P1** | Analista funcional y líder de documentación | Fase 1 (investigación y análisis), Fase 2 (requisitos y casos de uso), riesgos, trazabilidad, plan de pruebas consolidado, bitácora de IA y documento final. Coordina hitos. |
| **P2** | Ingeniero de base de datos y seguridad | Modelo ER, diccionario de datos, scripts SQL (`esquema.sql`, `politicas_rls.sql`, `datos_prueba.sql`), RLS, triggers, funciones RPC, matriz rol-recurso-operación y pruebas de seguridad. |
| **P3** | Frontend: acceso, paciente y diseño de interfaz | Mapa de navegación, wireframes, sistema de estilos (CSS), accesibilidad, módulo de autenticación y todas las vistas del paciente. |
| **P4** | Frontend: profesional, administración y despliegue | Panel del profesional, panel administrativo, indicadores, despliegue en GitHub Pages, README, estructura del repositorio y diagrama de arquitectura. |

**Reglas comunes a los 4:**

- Cada integrante hace **commits significativos y frecuentes**, en ramas propias con Pull
  Request revisado por otro integrante. Nada de un único commit final (sección 11.2).
- Cada integrante escribe los casos de prueba de su módulo. P1 los consolida.
- Cada integrante registra en la bitácora de IA lo que usó (sección 13).
- **Revisión cruzada obligatoria:** cada persona debe poder explicar las partes de las demás
  (secciones 14.1 y 15). Antes de la sustentación se hace una ronda en la que cada integrante
  explica el módulo de otro.

---

## 2. Cobertura del enunciado, sección por sección

| Sección del enunciado | Responsable | Apoyo | Producto |
| --- | --- | --- | --- |
| 1-2 Presentación y resultado de aprendizaje | P1 | Todos | Introducción del documento final. |
| 3 Organización | P1 | — | Acta de equipo, roles (este plan) y autorización del docente para 4 integrantes. |
| 4 Situación problema | P1 | — | Ficha del problema: causas, consecuencias y afectados. Clínica ficticia "Clínica Ambulatoria San Rafael" (ejemplo). |
| 5.1 Actores | P1 | P2 | Matriz de actores: necesidad, responsabilidad, permiso y dato usado. |
| 5.2 Funcionalidades | P3 (paciente y acceso), P4 (profesional y admin) | P2 | Pantallas y lógica implementadas. |
| 5.3 Reglas de negocio | P2 | P1 | Restricciones, triggers y RPC que las hacen cumplir (ver sección 4). |
| 6.1 Actividades de análisis | P1 | P3 (comparación de plataformas) | Objetivos, alcance, exclusiones, supuestos y criterios de éxito. |
| 6.1 AS IS / TO BE | P1 | — | Diagramas BPMN simplificados con explicación. |
| 6.1 Comparación de 2 plataformas | P3 | P1 | Tabla comparativa con enlaces y fecha de consulta. |
| 6.1 Riesgos (mínimo 3) | P1 | Todos | Matriz de riesgos (sección 9 de este plan). |
| 6.2 Preguntas orientadoras | P1 | P2 | Respuestas documentadas (sección 5 de este plan). |
| 7.1 Requisitos funcionales (≥ 15) | P1 | P3, P4 | RF-01..RF-18 con actor, prioridad, fuente y criterio de aceptación. |
| 7.2 Requisitos no funcionales (≥ 8) | P1 | P2 (seguridad), P3 (usabilidad, accesibilidad) | RNF-01..RNF-10 medibles. |
| 7.3 Casos de uso (≥ 8) | P1 | P3, P4 | Diagrama general y 8 casos detallados. |
| 8.1 Arquitectura | P4 | P2 | Diagrama cliente-nube y responsabilidad de cada componente. |
| 8.2-8.3 Interfaz y pantallas | P3 | P4 | Mapa de navegación por rol, wireframes y estados de interfaz. |
| 9 Modelo relacional | P2 | P1 | ER, diccionario y `esquema.sql`. |
| 9.1 Decisiones de integridad | P2 | — | Documentadas en la sección 4 de este plan. |
| 10 Seguridad Supabase | P2 | P3, P4 | `politicas_rls.sql`, matriz de permisos y pruebas negativas. |
| 11 Construcción del MVP | P3, P4 | P2 | Código en `assets/`. |
| 12 Plan de pruebas (≥ 15) | P1 (consolida) | Todos | Casos de prueba con evidencias (sección 8 de este plan). |
| 12.1 Trazabilidad | P1 | Todos | Matriz necesidad → RF → CU → pantalla → tabla/política → CP. |
| 13 Uso de IA | P1 (consolida) | Todos | `docs/bitacora_ia.md`. |
| 14 Entregables | P4 (repo y publicación), P1 (documento) | Todos | Los 7 entregables. |
| 15 Rúbrica | P1 | Todos | Autoevaluación antes de entregar (sección 10 de este plan). |
| 16 Hitos | P1 | Todos | Sección 6 de este plan. |
| 17 Lista de verificación | P1 | Todos | Sección 11 de este plan. |
| 18 Sustentación | Todos | — | Respuestas preparadas (sección 12 de este plan). |
| 19 Referencias | P1 | Todos | Bibliografía en formato APA. |

---

## 3. Correcciones y aclaraciones al enunciado

| # | Punto del enunciado | Problema | Corrección o decisión del equipo |
| --- | --- | --- | --- |
| C1 | Sección 3: "Maximo 2 estudiantes" | Falta la tilde ("Máximo"). Además, el equipo es de 4. | Corregir la tilde en la documentación y pedir autorización al docente (ver 0.1). |
| C2 | Tabla `schedules` (sección 9) | No queda claro si un horario es una franja concreta o un patrón semanal que se repite. | **Decisión:** cada fila de `schedules` es **una franja concreta** (fecha + hora de inicio + hora de fin). El administrador genera franjas en bloque con la función `generar_franjas(...)`. El patrón semanal queda fuera del MVP. |
| C3 | Sección 10.1: "archivo de entorno .env" | En un sitio estático de GitHub Pages sin compilación no existe un `.env`: todo lo que llega al navegador es público. | `assets/js/config.js` contiene solo la URL del proyecto y la clave `anon`, que **es pública por diseño**. La seguridad la dan las RLS, no ocultar la clave. Se incluye `config.example.js` y, si algún integrante usa scripts locales, `.env` en `.gitignore` con `.env.example`. **Nunca** se usa la `service_role`. |
| C4 | Sección 5.2: "Cancelación con regla de anticipación definida por el equipo" | No hay valor definido. | **Decisión:** el paciente puede cancelar hasta **2 horas antes** del inicio de la cita. Se valida en la función `cancelar_cita`, no solo en JavaScript. |
| C5 | Sección 5.3: "transiciones válidas" | Solo da un ejemplo. | Tabla de transiciones completa en la sección 4, problema P6. |
| C6 | Sección 15: Sustentación e IA vale 3 % | Pesa poco frente a lo que el texto exige (dominio individual). | No se cambia la rúbrica, pero el equipo la trata como crítica: el docente puede bajar la nota de forma individual (nota final de la sección 15). |
| C7 | Sección 9: `appointments` tiene `professional_id` **y** `schedule_id` | Es un dato redundante: la cita podría apuntar a una franja de otro profesional. | Se conserva `professional_id` para consultas rápidas, pero con **FK compuesta** `(schedule_id, professional_id)` hacia `schedules(id, professional_id)`. Así no pueden quedar inconsistentes. |
| C8 | Zona horaria | No se menciona. | Todo se compara en hora de **America/Bogota**. Las fechas y horas de las franjas se guardan como hora local de la clínica. |

---

## 4. Problemas técnicos previstos y su solución

Todos son responsabilidad de **P2**, salvo que se indique otra cosa. El SQL es una
referencia para `sql/esquema.sql` y `sql/politicas_rls.sql`.

### P1. Tipos cerrados para roles y estados (sección 9.1)

```sql
create type rol_usuario as enum ('paciente', 'profesional', 'admin');
create type estado_cita as enum ('programada', 'confirmada', 'atendida', 'cancelada', 'no_asistio');
```

### P2. Una cita cancelada no debe bloquear la franja para siempre

**Problema:** un `UNIQUE(schedule_id)` simple impide volver a reservar la franja después de
cancelar.

**Solución:** índice único **parcial**, que solo cuenta las citas no canceladas. Además, la
inserción es atómica: si dos personas reservan a la vez, una recibe `unique_violation`
(responde a CP-02 y a la pregunta 6.2 sobre solicitudes simultáneas).

```sql
create unique index uq_franja_con_cita_activa
  on appointments (schedule_id)
  where estado <> 'cancelada';
```

**Decisión de modelado (sección 9.1):** al cancelar, la franja **se conserva** y la cita
queda en estado `cancelada`. La franja vuelve a estar disponible automáticamente porque ya
no tiene cita activa.

### P3. Un profesional no puede tener franjas (ni citas) superpuestas

**Solución:** restricción de exclusión por rangos de tiempo. Como cada cita ocupa una franja
y una franja tiene a lo sumo una cita activa (P2), tampoco puede haber dos citas superpuestas.

```sql
create extension if not exists btree_gist;

create table schedules (
  id              bigint generated always as identity primary key,
  professional_id bigint not null references professionals(id) on delete restrict,
  fecha           date   not null,
  hora_inicio     time   not null,
  hora_fin        time   not null,
  activo          boolean not null default true,
  check (hora_fin > hora_inicio),
  unique (id, professional_id),                 -- requerido por la FK compuesta (C7)
  exclude using gist (
    professional_id with =,
    tsrange(fecha + hora_inicio, fecha + hora_fin) with &&
  ) where (activo)
);
```

### P4. Escalamiento de privilegios: un paciente se cambia el rol a admin

**Problema:** si el paciente puede editar su fila de `profiles` y el rol está en esa tabla,
puede hacer `update profiles set rol = 'admin'`. RLS controla **filas**, no **columnas**.

**Solución:**

1. Permisos por columna: el usuario solo puede actualizar sus datos personales.
2. El perfil se crea con un trigger que **siempre** asigna `paciente`. Nunca se lee el rol de
   los metadatos del registro, porque esos los envía el cliente y se pueden falsificar.
3. Solo un admin cambia roles, mediante la RPC `asignar_rol`.

```sql
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (nombres, documento, telefono, fecha_nacimiento) on public.profiles to authenticated;

create or replace function public.tg_crear_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nombres, rol)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombres', ''), 'paciente');
  return new;
end $$;

create trigger trg_nuevo_usuario
  after insert on auth.users
  for each row execute function public.tg_crear_perfil();
```

> **Ojo:** `documento`, `telefono` y `fecha_nacimiento` deben ser **nullables**. Si no, el
> trigger falla al registrarse y Supabase devuelve un error genérico. Después del primer
> inicio de sesión, el frontend (P3) obliga a completar el perfil antes de reservar, y la RPC
> `reservar_cita` verifica que el perfil esté completo.

### P5. Recursión infinita en las políticas RLS al consultar el rol

**Problema:** una política de `profiles` que consulta `profiles` para saber si el usuario es
admin entra en recursión.

**Solución:** una función `security definer` que lee el rol sin pasar por RLS. Se usa como
`(select public.rol_actual())` para que se evalúe una sola vez por consulta.

```sql
create or replace function public.rol_actual()
returns rol_usuario language sql stable security definer set search_path = public as $$
  select rol from public.profiles where id = auth.uid() and activo
$$;
```

### P6. Transiciones de estado válidas e historial automático

| Desde | Hacia permitido | Quién |
| --- | --- | --- |
| programada | confirmada | profesional, admin |
| programada | cancelada | paciente (hasta 2 h antes), profesional, admin |
| confirmada | atendida, no_asistio | profesional, admin (solo después de la hora de inicio) |
| confirmada | cancelada | paciente (hasta 2 h antes), profesional, admin |
| atendida, cancelada, no_asistio | — (estados finales) | nadie |

Un **trigger** valida todo cambio de estado y escribe `status_history` con
`changed_by = auth.uid()`. Así queda registrado quién hizo cada acción (sección 5.3).

```sql
create table transiciones_validas (
  desde estado_cita not null,
  hacia estado_cita not null,
  primary key (desde, hacia)
);
insert into transiciones_validas values
  ('programada','confirmada'), ('programada','cancelada'),
  ('confirmada','atendida'), ('confirmada','no_asistio'), ('confirmada','cancelada');

create or replace function public.tg_validar_estado()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.estado is distinct from old.estado then
    if not exists (select 1 from transiciones_validas
                   where desde = old.estado and hacia = new.estado) then
      raise exception 'TRANSICION_INVALIDA: % -> %', old.estado, new.estado;
    end if;
    if new.estado = 'cancelada' then
      new.cancelled_at := now();
    end if;
    insert into status_history (appointment_id, estado_anterior, estado_nuevo, changed_by)
    values (old.id, old.estado, new.estado, auth.uid());
  end if;
  return new;
end $$;

create trigger trg_estado_cita
  before update on appointments
  for each row execute function public.tg_validar_estado();
```

### P7. El profesional solo debe poder cambiar el estado

**Problema:** con un `UPDATE` directo, un profesional podría modificar `patient_id`,
`schedule_id` u otros campos de sus citas.

**Solución:** **nadie** tiene `INSERT`, `UPDATE` ni `DELETE` directo sobre `appointments` ni
`status_history`. Todas las escrituras pasan por funciones RPC que validan quién llama:

```sql
revoke insert, update, delete on public.appointments   from anon, authenticated;
revoke insert, update, delete on public.status_history from anon, authenticated;
```

| RPC | Quién la llama | Qué valida |
| --- | --- | --- |
| `reservar_cita(p_schedule_id, p_motivo)` | paciente | Sesión iniciada, perfil completo, franja activa, futura y libre. Fuerza `patient_id = auth.uid()`. |
| `cancelar_cita(p_cita_id)` | paciente, profesional, admin | Dueño de la cita (o profesional asignado, o admin) y regla de 2 h para el paciente. |
| `cambiar_estado_cita(p_cita_id, p_estado)` | profesional, admin | La cita es del profesional que llama y respeta la hora de inicio para `atendida` o `no_asistio`. |
| `franjas_disponibles(p_especialidad, p_profesional, p_fecha)` | cualquier usuario con sesión | Devuelve franjas futuras sin cita activa (ver P8). |
| `mi_agenda(p_desde, p_hasta)` | profesional | Sus citas con el nombre del paciente (ver P9). |
| `generar_franjas(p_profesional, p_fecha, p_inicio, p_fin, p_minutos)` | admin | Crea franjas en bloque; la restricción de P3 rechaza los cruces. |
| `asignar_rol(p_usuario, p_rol, p_especialidad)` | admin | Promueve un usuario a profesional o admin (ver P10). |
| `indicadores_citas(p_desde, p_hasta)` | admin | Totales por estado, especialidad y periodo (ver P11). |

Ejemplo de RPC con manejo de concurrencia:

```sql
create or replace function public.reservar_cita(p_schedule_id bigint, p_motivo text)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_franja schedules;
  v_id     bigint;
begin
  if (select public.rol_actual()) is distinct from 'paciente' then
    raise exception 'SOLO_PACIENTES';
  end if;
  if exists (select 1 from profiles where id = auth.uid() and documento is null) then
    raise exception 'PERFIL_INCOMPLETO';
  end if;

  select * into v_franja from schedules where id = p_schedule_id and activo for update;
  if not found then
    raise exception 'FRANJA_NO_EXISTE';
  end if;
  if v_franja.fecha + v_franja.hora_inicio <= (now() at time zone 'America/Bogota') then
    raise exception 'FRANJA_PASADA';
  end if;

  insert into appointments (patient_id, professional_id, schedule_id, motivo, estado)
  values (auth.uid(), v_franja.professional_id, p_schedule_id, left(p_motivo, 200), 'programada')
  returning id into v_id;
  return v_id;
exception
  when unique_violation then
    raise exception 'FRANJA_OCUPADA';
end $$;

revoke execute on function public.reservar_cita(bigint, text) from public, anon;
grant  execute on function public.reservar_cita(bigint, text) to authenticated;
```

> En Supabase, las funciones nuevas quedan ejecutables por `anon` por defecto. Hay que hacer
> `revoke execute ... from public, anon` en **cada** RPC.

### P8. El paciente no puede calcular la disponibilidad

**Problema:** con RLS, el paciente solo ve **sus** citas. Por eso no puede saber qué franjas
ocupan otros pacientes, y la búsqueda de disponibilidad mostraría franjas ya reservadas.

**Solución:** la RPC `franjas_disponibles(...)` (`security definer`) devuelve solo id, fecha,
horas, profesional y especialidad de las franjas **sin cita activa**. No expone nada de las
citas ajenas.

### P9. El paciente no puede ver el nombre del médico (ni el médico el del paciente)

**Problema:** los nombres están en `profiles`, que con RLS solo muestra la fila propia.

**Solución:**

- `professionals` tiene el campo `nombre_publico` (legible para cualquier usuario con sesión),
  o se usa la vista `v_profesionales_publicos` con solo nombre y especialidad.
- El profesional obtiene los datos de sus pacientes por `mi_agenda(...)`, que devuelve solo
  los campos necesarios (nombre y teléfono), nunca el perfil completo.

### P10. El administrador no puede crear usuarios desde la página

**Problema:** crear cuentas de otras personas desde el navegador requiere la `service_role`,
que está prohibida en el frontend (sección 10).

**Solución dentro de las herramientas permitidas:**

1. El profesional o el administrador se **registra como cualquier usuario**, y queda como
   `paciente`.
2. Un admin lo **promueve** con la RPC `asignar_rol`, que también crea la fila en
   `professionals`.
3. El **primer admin** se asigna a mano desde el SQL Editor de Supabase. Queda documentado
   en `datos_prueba.sql` y en el README.

### P11. Indicadores con RLS

Las tablas de citas no son legibles en bloque. Los indicadores se sirven con la RPC
`indicadores_citas(...)`, que verifica `rol_actual() = 'admin'` y devuelve solo conteos
agregados. Responsable del frontend: **P4**.

### P12. El médico cambia o desactiva un horario que ya tiene reservas (pregunta 6.2)

**Solución:** un trigger en `schedules` **rechaza** cambiar la fecha o las horas, o
desactivar una franja, si tiene una cita activa. Para hacerlo, el admin debe primero cancelar
la cita (queda en el historial y el paciente la ve como "Cancelada por la institución" en
*Mis citas*). Avisar al paciente por correo o SMS queda **fuera del MVP**.

### P13. Borrado (sección 9.1)

| Entidad | Tratamiento |
| --- | --- |
| specialties, professionals, schedules | **Borrado lógico** (`activo = false`). FK con `on delete restrict`. |
| appointments, status_history | **Nunca** se borran: son la trazabilidad de la agenda. |
| profiles | Desactivación (`activo = false`). Si un paciente pide la baja, se **anonimiza** (nombres, documento y teléfono se reemplazan por valores genéricos) y se conservan sus citas. |

### P14. Seguridad en el frontend (P3 y P4)

- **Prohibido `innerHTML`** con datos de la base. Se usan `textContent` y `createElement`
  (sección 8.2). Se revisa en cada Pull Request.
- Ocultar un botón **no** es autorización (sección 11.2). La interfaz oculta lo que no
  corresponde al rol por usabilidad, pero quien bloquea es la base de datos.
- **Sesión expirada:** `supabase.auth.onAuthStateChange` redirige al inicio de sesión y
  muestra un mensaje.
- **Errores de red:** todas las llamadas usan `try/catch` y muestran el estado de error. Los
  códigos de las RPC (`FRANJA_OCUPADA`, `FRANJA_PASADA`, `PERFIL_INCOMPLETO`,
  `TRANSICION_INVALIDA`...) se traducen a mensajes claros en `assets/js/ui/mensajes.js`.
- **Conflicto de reserva:** si llega `FRANJA_OCUPADA`, se muestra el conflicto y se recarga
  la disponibilidad (excepción del caso de uso del ejemplo 7.3).

### P15. Datos ficticios

`datos_prueba.sql` usa solo datos inventados: documentos como `TEST-0001`, teléfonos
`300 000 0001` y correos `paciente1@demo.test`. No se guarda ningún diagnóstico ni historia
clínica: el campo `motivo` se limita a 200 caracteres y la interfaz advierte que no se
escriba información clínica.

---

## 5. Respuestas a las preguntas orientadoras (sección 6.2)

| Pregunta | Respuesta del equipo | Fuente |
| --- | --- | --- |
| ¿Qué problema concreto se resuelve? | Cruces de horario, registros duplicados, falta de confirmación y poca visibilidad de la agenda. Se mide con indicadores por estado y por especialidad. | P1 |
| ¿Qué información necesita cada actor? | Matriz de actores (sección 6.3 del enunciado). | P1 |
| ¿Qué pasa si el médico cambia su horario con reservas? | Se bloquea mientras haya citas activas (P12). | P2 |
| ¿Cómo se evita la doble reserva simultánea? | Índice único parcial y bloqueo `for update` en una RPC atómica (P2, P7). | P2 |
| ¿Qué datos no se deben recopilar? | Diagnósticos, historia clínica, EPS, tipo de sangre, dirección. Solo los datos de la sección 5.2. | P1, P2 |
| ¿Qué queda fuera del MVP? | Notificaciones por correo o SMS, horarios recurrentes, múltiples sedes, pagos, telemedicina, lista de espera. | P1 |

---

## 6. Plan por hitos (sección 16)

| Hito | P1 | P2 | P3 | P4 |
| --- | --- | --- | --- | --- |
| **1 Comprensión** | Ficha del problema, objetivos, alcance, actores, AS IS. | Revisión de la documentación de Supabase y RLS. Primer borrador del ER. | Comparación de 2 plataformas (enlaces y fechas). | Repo, estructura de carpetas, GitHub Pages con página inicial, tablero de tareas. |
| **2 Especificación** | TO BE, RF (≥ 15), RNF (≥ 8), 8 casos de uso, reglas. | Reglas de negocio convertidas a restricciones. Tabla de transiciones. | Mapa de navegación y wireframes de todas las pantallas. | Diagrama de arquitectura. Wireframes del profesional y del admin (con P3). |
| **3 Diseño técnico** | Matriz de riesgos y primera versión de la trazabilidad. | ER final, diccionario, `esquema.sql`, matriz rol-recurso-operación, primeras RLS. | CSS base, componentes reutilizables y módulo `auth.js`. | Módulo `datos.js` (cliente Supabase) y plantilla de páginas por rol. |
| **4 MVP** | Plan de pruebas (≥ 15 CP) y redacción del documento. | Todas las RPC, triggers, `politicas_rls.sql`, `datos_prueba.sql`. | Registro, inicio de sesión, perfil, búsqueda, reserva, mis citas, cancelación. | Agenda y cambio de estado, CRUD de admin, generar franjas, indicadores, despliegue. |
| **5 Validación** | Ejecución y consolidación de pruebas, trazabilidad final, bitácora, documento final. | Pruebas negativas de seguridad con 3 cuentas. Reconstrucción de la base desde cero. | Pruebas responsive a 360 px, accesibilidad y teclado. | README, credenciales de demo, verificación de la URL publicada, video de evidencias. |

**Dependencia crítica:** P3 y P4 no pueden terminar sus flujos sin las RPC de P2. Por eso P2
publica al **inicio del Hito 3** la firma de cada RPC y sus códigos de error (sección 7). Así
el frontend avanza en paralelo con datos de prueba.

---

## 7. Contrato entre la base de datos y el frontend

P2 lo publica en `docs/contrato_api.md`. P3 y P4 programan contra este contrato.

| Llamada desde JS | Devuelve | Errores posibles |
| --- | --- | --- |
| `supabase.rpc('franjas_disponibles', { p_especialidad, p_profesional, p_fecha })` | Lista de franjas libres | — |
| `supabase.rpc('reservar_cita', { p_schedule_id, p_motivo })` | id de la cita | `SOLO_PACIENTES`, `PERFIL_INCOMPLETO`, `FRANJA_NO_EXISTE`, `FRANJA_PASADA`, `FRANJA_OCUPADA` |
| `supabase.rpc('cancelar_cita', { p_cita_id })` | — | `NO_AUTORIZADO`, `FUERA_DE_PLAZO`, `TRANSICION_INVALIDA` |
| `supabase.rpc('cambiar_estado_cita', { p_cita_id, p_estado })` | — | `NO_AUTORIZADO`, `ANTES_DE_HORA`, `TRANSICION_INVALIDA` |
| `supabase.rpc('mi_agenda', { p_desde, p_hasta })` | Citas del profesional | `NO_AUTORIZADO` |
| `supabase.rpc('generar_franjas', {...})` | Número de franjas creadas | `NO_AUTORIZADO`, `HORARIO_SUPERPUESTO` |
| `supabase.rpc('asignar_rol', {...})` | — | `NO_AUTORIZADO` |
| `supabase.rpc('indicadores_citas', { p_desde, p_hasta })` | Conteos agregados | `NO_AUTORIZADO` |
| `supabase.from('appointments').select(...)` | Solo las citas que la RLS permite | — |
| `supabase.from('specialties').select(...)` | Catálogo activo | — |

---

## 8. Plan de pruebas (sección 12): 18 casos

| ID | Escenario | Requisito | Responsable |
| --- | --- | --- | --- |
| CP-01 | Paciente reserva una franja libre: se crea una sola cita y la franja desaparece. | RF-06 | P3 |
| CP-02 | Dos sesiones reservan la misma franja a la vez (dos navegadores o `Promise.all`): solo una se confirma y la otra recibe `FRANJA_OCUPADA`. | RF-06 | P2 |
| CP-03 | Paciente cambia el ID para ver una cita ajena: la consulta no devuelve filas. | RNF-01 | P2 |
| CP-04 | Profesional intenta cambiar el estado de una cita de otro: `NO_AUTORIZADO`. | RF-10 | P2 |
| CP-05 | Pantalla de 360 px: sin desplazamiento horizontal y controles usables. | RNF-04 | P3 |
| CP-06 | Paciente intenta `update profiles set rol='admin'` desde la consola: rechazado (P4). | RNF-01 | P2 |
| CP-07 | Paciente reserva una franja pasada: `FRANJA_PASADA`. | Regla 5.3 | P3 |
| CP-08 | Paciente cancela a menos de 2 h: `FUERA_DE_PLAZO`. | RF cancelación | P3 |
| CP-09 | Cancelar y volver a reservar la misma franja: permitido (P2). | Regla 5.3 | P2 |
| CP-10 | Pasar de `atendida` a `programada`: `TRANSICION_INVALIDA`. | Regla 5.3 | P4 |
| CP-11 | Admin crea franjas que se cruzan para el mismo profesional: rechazado (P3). | Regla 5.3 | P4 |
| CP-12 | Admin intenta mover una franja con cita activa: rechazado (P12). | 6.2 | P4 |
| CP-13 | Usuario sin sesión llama a una RPC: rechazado. | RNF-01 | P2 |
| CP-14 | La sesión expira en mitad de una reserva: redirige al inicio de sesión con un mensaje. | 11.2 | P3 |
| CP-15 | Indicadores coinciden con conteos SQL de los datos de prueba. | RF indicadores | P4 |
| CP-16 | Reserva completa en ≤ 5 pasos después de iniciar sesión. | RNF-03 | P3 |
| CP-17 | Agenda de un día con 500 citas de prueba carga en ≤ 3 s. | RNF-02 | P4 |
| CP-18 | Nombre de paciente con `<img src=x onerror=alert(1)>` se muestra como texto, sin ejecutarse. | 8.2 | P3 |

Cada evidencia incluye: requisito, datos usados, resultado esperado, resultado obtenido,
estado y captura. Se guardan en `docs/pruebas/`.

---

## 9. Matriz de riesgos (sección 6.1)

| Riesgo | Prob. | Impacto | Prevención | Respuesta | Dueño |
| --- | --- | --- | --- | --- | --- |
| Las RPC se retrasan y bloquean el frontend | Alta | Alto | Contrato de API publicado en el Hito 3 | El frontend sigue con datos de prueba | P2 |
| Política RLS mal escrita expone datos | Media | Alto | Pruebas negativas con 3 cuentas (CP-03, 04, 06, 13) | Corregir y repetir todas las pruebas de seguridad | P2 |
| Integrante sin dominio del código ajeno en la sustentación | Media | Alto | Revisión cruzada de PR y ensayo de explicaciones | Sesión extra de explicación | P1 |
| El docente no autoriza 4 integrantes | Media | Alto | Pedir autorización en el Hito 1 | Dividir en 2 equipos según 0.1 | P1 |
| Se publica una clave secreta en el repo | Baja | Alto | Solo la `anon` en `config.js`; revisión en PR | Rotar la clave en Supabase de inmediato | P4 |
| El plan gratuito de Supabase pausa el proyecto por inactividad | Media | Medio | Entrar al proyecto cada semana; reactivar antes de la sustentación | Reconstruir desde los scripts | P4 |

---

## 10. Rúbrica (sección 15): quién responde por cada criterio

| Criterio | % | Responsable | Revisa |
| --- | --- | --- | --- |
| Análisis del problema y proceso | 12 | P1 | P3 |
| Requisitos y trazabilidad | 15 | P1 | P2 |
| Diseño de solución e interfaz | 12 | P3 (interfaz), P4 (arquitectura) | P1 |
| Modelo de datos | 15 | P2 | P4 |
| Seguridad y roles | 14 | P2 | P3 |
| Implementación funcional | 17 | P3, P4 | P2 |
| Pruebas y calidad | 8 | P1 | Todos |
| Repositorio y documentación | 4 | P4 | P1 |
| Sustentación y uso responsable de IA | 3 | Todos | — |

---

## 11. Estructura del repositorio (sección 11.1)

```
/
├── index.html                 (P3) inicio e inicio de sesión
├── registro.html              (P3)
├── paciente/                  (P3) buscar.html, reservar.html, mis-citas.html, perfil.html
├── profesional/               (P4) agenda.html, cita.html
├── admin/                     (P4) resumen.html, especialidades.html, profesionales.html,
│                                    horarios.html, citas.html, indicadores.html
├── assets/
│   ├── css/                   (P3) base.css, componentes.css, responsive.css
│   └── js/
│       ├── config.example.js  (P4) URL + clave anon (pública)
│       ├── auth.js            (P3) sesión, guardas por rol, sesión expirada
│       ├── datos/             (P2 define, P3/P4 usan) citas.js, catalogos.js, perfiles.js
│       ├── validacion.js      (P3)
│       └── ui/                (P3) mensajes.js, estados.js (cargando/vacío/error/denegado/éxito)
├── sql/                       (P2) esquema.sql, politicas_rls.sql, datos_prueba.sql
├── docs/                      (P1) diagramas, matriz de requisitos, trazabilidad, pruebas,
│                                    contrato_api.md (P2), bitacora_ia.md, manual
├── .gitignore
└── README.md                  (P4) descripción, integrantes, instalación, credenciales demo,
                                     URL publicada, decisiones técnicas, funciones pendientes
```

**Flujo de trabajo en Git:** rama `main` protegida, una rama por tarea (`p3/reserva`,
`p2/rls-citas`...) y Pull Request con revisión de otro integrante. Si algo queda incompleto,
se declara con honestidad en el README (sección 14.1).

---

## 12. Lista de verificación final (sección 17)

| ✔ | Ítem | Responsable |
| --- | --- | --- |
| ☐ | Problema y alcance coherentes con el MVP | P1 |
| ☐ | Cada requisito importante tiene criterio de aceptación y prueba | P1 |
| ☐ | Los diagramas coinciden con la aplicación construida | P1, P4 |
| ☐ | La base impide citas duplicadas y conserva la integridad referencial | P2 |
| ☐ | RLS habilitado en **todas** las tablas expuestas y probado con 3 roles | P2 |
| ☐ | Un paciente no puede leer ni modificar citas ajenas | P2 |
| ☐ | Un profesional no puede actuar sobre citas no asignadas | P2 |
| ☐ | Ningún usuario puede cambiarse el rol | P2 |
| ☐ | Todas las RPC tienen `revoke execute ... from public, anon` | P2 |
| ☐ | La interfaz maneja errores, listas vacías, carga y confirmaciones | P3, P4 |
| ☐ | Ningún `innerHTML` con datos de la base | P3, P4 |
| ☐ | Funciona desde la URL de GitHub Pages | P4 |
| ☐ | El repo no tiene `service_role`, contraseñas ni datos reales | P4 |
| ☐ | Los scripts reconstruyen la base desde cero (probado en un proyecto Supabase nuevo) | P2 |
| ☐ | Enlaces, fuentes y apoyo de IA declarados | P1 |
| ☐ | Los 4 integrantes pueden explicar análisis, modelo, seguridad y código | Todos |

---

## 13. Preparación de la sustentación (sección 18)

| Pregunta | Quién la prepara | Respuesta base |
| --- | --- | --- |
| ¿Qué evidencia demuestra que se resuelve el problema? | P1 | Trazabilidad necesidad → prueba e indicadores. |
| ¿Qué requisito fue más difícil? | Todos | Probablemente la doble reserva concurrente o las RLS sin recursión. |
| ¿Cómo se impide una doble reserva? | P2 | Índice único parcial y RPC atómica con `for update` (P2, P7). |
| ¿Qué política RLS protege las citas del paciente? | P2 | `select` en `appointments` con `using (patient_id = (select auth.uid()))`, sin escritura directa. |
| ¿Qué pasa si alguien cambia un ID en el navegador? | P2 | La RLS y la RPC verifican `auth.uid()`; demostración en vivo de CP-03. |
| ¿Por qué ese modelo de horarios? | P2 | Franjas concretas: simples de reservar y bloquear (C2). |
| ¿Qué cambiarían para varias sedes? | P4 | Tabla `sedes`, `sede_id` en `schedules` y la exclusión por profesional sigue igual. |
| ¿Qué recomendación de IA descartaron? | Todos | Sacarla de la bitácora. Ejemplo: asignar el rol desde los metadatos del registro (inseguro, P4). |
| ¿Qué limitación queda y cuál es el siguiente incremento? | P1 | Sin notificaciones ni horarios recurrentes; siguiente paso: recordatorios. |
