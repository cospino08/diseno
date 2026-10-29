# Diccionario de datos

Dueño: P2. Fuente: `sql/esquema.sql`. Diagrama en [diagrama_er.md](diagrama_er.md).

Convenciones de nombres de restricciones: `pk_` clave primaria (implícita), `fk_` foránea,
`uq_` única, `ck_` CHECK, `ex_` exclusión, `idx_` índice. Los nombres aparecen en los
mensajes de error, así que el frontend puede reconocerlos (contrato §4.3).

## Tipos enumerados

| Tipo | Valores | Uso |
| --- | --- | --- |
| `rol_usuario` | `paciente`, `profesional`, `admin` | `profiles.rol`, `appointments.cancelado_por` |
| `estado_cita` | `programada`, `confirmada`, `atendida`, `cancelada`, `no_asistio` | `appointments.estado`, `status_history`, `transiciones_validas` |

Se usan enum (y no texto libre) para cumplir la sección 9.1: es imposible guardar
`'Admin'` o `'cancelado'`.

---

## `profiles`

Perfil público de cada cuenta de Supabase Auth. Lo crea el trigger `trg_nuevo_usuario`.

| Columna | Tipo | Nulo | Default | Restricciones | Descripción |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | no | — | PK; FK → `auth.users(id)` on delete cascade | Mismo id que la cuenta de Auth. |
| `email` | text | sí | — | — | Copia del correo al registrarse (para que el admin identifique usuarios). |
| `nombres` | text | no | `''` | `ck_profiles_nombres`: máximo 120 | Nombre completo. Vacío hasta que el usuario lo complete. |
| `documento` | text | sí | — | `uq_profiles_documento`; `ck_profiles_documento`: `^[A-Za-z0-9-]{4,20}$` | Documento de identidad (ficticio en pruebas: `TEST-0001`). |
| `telefono` | text | sí | — | `ck_profiles_telefono`: `^[0-9 +()-]{7,20}$` | Teléfono de contacto. |
| `fecha_nacimiento` | date | sí | — | `ck_profiles_fecha_nacimiento`: entre 1900-01-01 y hoy | |
| `rol` | rol_usuario | no | `'paciente'` | — | Rol de negocio. Solo lo cambia `asignar_rol`. |
| `activo` | boolean | no | `true` | — | `false` = cuenta desactivada; `rol_actual()` devuelve `null`. |
| `created_at` | timestamptz | no | `now()` | — | |

**Por qué `documento`, `telefono` y `fecha_nacimiento` aceptan null:** el perfil se crea en el
mismo instante del registro, cuando esos datos aún no existen. Si fueran `NOT NULL`, el
registro fallaría. La regla "perfil completo" se valida en `reservar_cita` (P4).

**Datos que NO se guardan (pregunta 6.2):** diagnósticos, historia clínica, EPS, tipo de
sangre, dirección. Solo los de la sección 5.2 del enunciado.

## `specialties`

| Columna | Tipo | Nulo | Default | Restricciones | Descripción |
| --- | --- | --- | --- | --- | --- |
| `id` | bigint | no | identity | PK | |
| `nombre` | text | no | — | `uq_specialties_nombre` (índice único sobre `lower(btrim(nombre))`); `ck_specialties_nombre`: 2 a 80 | |
| `descripcion` | text | sí | — | `ck_specialties_descripcion`: máximo 300 | |
| `activo` | boolean | no | `true` | — | Borrado lógico. |
| `created_at` | timestamptz | no | `now()` | — | |

## `professionals`

| Columna | Tipo | Nulo | Default | Restricciones | Descripción |
| --- | --- | --- | --- | --- | --- |
| `id` | bigint | no | identity | PK | Identificador usado en franjas y citas. |
| `profile_id` | uuid | no | — | FK → `profiles(id)` restrict; `uq_professionals_profile` | Cuenta del profesional. |
| `specialty_id` | bigint | no | — | FK → `specialties(id)` restrict; `idx_professionals_specialty` | |
| `nombre_publico` | text | no | — | `ck_professionals_nombre`: 2 a 120 | Nombre visible para pacientes (P9). |
| `registro_profesional` | text | sí | — | `uq_professionals_registro`; `ck_professionals_registro`: 3 a 30 | Registro médico (opcional). |
| `activo` | boolean | no | `true` | — | Borrado lógico. Si es `false`, sus franjas no se ofrecen. |
| `created_at` | timestamptz | no | `now()` | — | |

## `schedules`

Cada fila es **una franja concreta** (C2).

| Columna | Tipo | Nulo | Default | Restricciones | Descripción |
| --- | --- | --- | --- | --- | --- |
| `id` | bigint | no | identity | PK; `uq_schedules_id_profesional (id, professional_id)` | La única compuesta existe para la FK compuesta de citas. |
| `professional_id` | bigint | no | — | FK → `professionals(id)` restrict | No cambia después de creada (trigger). |
| `fecha` | date | no | — | — | Hora local de Bogotá (C8). |
| `hora_inicio` | time | no | — | — | |
| `hora_fin` | time | no | — | `ck_schedules_horas`: `hora_fin > hora_inicio` | La franja no cruza medianoche. |
| `activo` | boolean | no | `true` | — | Publicada o retirada. |
| `created_by` | uuid | sí | `auth.uid()` | FK → `profiles(id)` restrict | Admin que la creó; el trigger impide falsificarlo. `null` si se creó desde el SQL Editor. |
| `created_at` | timestamptz | no | `now()` | — | |

Restricción de exclusión `ex_schedules_sin_cruce` (requiere `btree_gist`):

```sql
exclude using gist (professional_id with =,
                    tsrange(fecha + hora_inicio, fecha + hora_fin) with &&) where (activo)
```

Dos franjas activas del mismo profesional no pueden tener rangos que se crucen. El rango es
semiabierto `[inicio, fin)`: 08:00-08:20 y 08:20-08:40 no se cruzan.

Índices: `idx_schedules_profesional_fecha (professional_id, fecha, hora_inicio)` para la
agenda y la disponibilidad por profesional; `idx_schedules_fecha (fecha, hora_inicio)` para
la búsqueda por fecha e indicadores.

## `appointments`

| Columna | Tipo | Nulo | Default | Restricciones | Descripción |
| --- | --- | --- | --- | --- | --- |
| `id` | bigint | no | identity | PK | |
| `patient_id` | uuid | no | — | FK → `profiles(id)` restrict; `idx_appointments_patient` | Siempre `auth.uid()` de quien reserva. Inmutable. |
| `professional_id` | bigint | no | — | FK → `professionals(id)` restrict; `idx_appointments_professional (professional_id, estado)` | Redundancia controlada (C7). Inmutable. |
| `schedule_id` | bigint | no | — | `fk_appointments_schedule (schedule_id, professional_id)` → `schedules(id, professional_id)`; `idx_appointments_schedule` | Inmutable. |
| `motivo` | text | sí | — | `ck_appointments_motivo`: máximo 200 | Motivo administrativo breve, nunca clínico (P15). |
| `estado` | estado_cita | no | `'programada'` | — | Solo cambia por transiciones válidas. |
| `observaciones` | text | sí | — | `ck_appointments_observaciones`: máximo 500 | Nota administrativa. |
| `cancelado_por` | rol_usuario | sí | — | — | Rol de quien canceló (lo pone el trigger). |
| `created_at` | timestamptz | no | `now()` | — | |
| `cancelled_at` | timestamptz | sí | — | `ck_appointments_cancelacion`: `(estado = 'cancelada') = (cancelled_at is not null)` | Lo pone el trigger. |

Índice único parcial `uq_franja_con_cita_activa`:

```sql
create unique index uq_franja_con_cita_activa on appointments (schedule_id)
  where estado <> 'cancelada';
```

Es la garantía contra la doble reserva (P2): una franja puede tener muchas citas canceladas,
pero solo una activa. Funciona aunque lleguen dos peticiones al mismo tiempo.

## `status_history`

| Columna | Tipo | Nulo | Default | Restricciones | Descripción |
| --- | --- | --- | --- | --- | --- |
| `id` | bigint | no | identity | PK | |
| `appointment_id` | bigint | no | — | FK → `appointments(id)` restrict; `idx_status_history_cita (appointment_id, changed_at)` | |
| `estado_anterior` | estado_cita | sí | — | `ck_status_history_cambio`: distinto de `estado_nuevo` | `null` en la fila de creación. |
| `estado_nuevo` | estado_cita | no | — | — | |
| `changed_by` | uuid | sí | — | FK → `profiles(id)` restrict | `auth.uid()` de quien hizo el cambio; `null` desde el SQL Editor. |
| `changed_at` | timestamptz | no | `now()` | — | |

## `transiciones_validas`

| Columna | Tipo | Nulo | Restricciones |
| --- | --- | --- | --- |
| `desde` | estado_cita | no | PK (`desde`, `hacia`); `ck_transiciones_distintas` |
| `hacia` | estado_cita | no | |

Contenido: `programada→confirmada`, `programada→cancelada`, `confirmada→atendida`,
`confirmada→no_asistio`, `confirmada→cancelada`.

---

## Triggers

| Trigger | Tabla y momento | Función | Qué hace |
| --- | --- | --- | --- |
| `trg_nuevo_usuario` | `auth.users` AFTER INSERT | `tg_crear_perfil` | Crea el perfil con rol `paciente`; ignora cualquier rol enviado en los metadatos (P4). |
| `trg_validar_cita` | `appointments` BEFORE UPDATE | `tg_validar_cita` | Impide cambiar paciente, profesional o franja; valida la transición contra `transiciones_validas`; llena `cancelled_at` y `cancelado_por` (P6). |
| `trg_historial_cita` | `appointments` AFTER INSERT o UPDATE OF estado | `tg_historial_cita` | Escribe `status_history` con `changed_by = auth.uid()`. |
| `trg_proteger_franja` | `schedules` BEFORE INSERT o UPDATE | `tg_proteger_franja` | `HORARIO_SUPERPUESTO` si se cruza; `FRANJA_CON_CITA` si se mueve o desactiva con cita activa (P12); fija `created_by`. |
| `trg_no_borrar_citas`, `trg_no_borrar_historial` | `appointments`, `status_history` BEFORE DELETE | `tg_impedir_borrado` | Impide borrar, incluso desde el SQL Editor (P13). |

## Tratamiento del borrado (sección 9.1)

| Entidad | Tratamiento | Cómo se garantiza |
| --- | --- | --- |
| `specialties`, `professionals`, `schedules` | Borrado lógico (`activo = false`) | Sin permiso DELETE; FK `on delete restrict`. |
| `appointments`, `status_history` | Nunca se borran | Sin permiso DELETE y trigger `tg_impedir_borrado`. |
| `profiles` | Desactivar o anonimizar | RPC `cambiar_activo_perfil` y `anonimizar_paciente`. Si la cuenta de Auth se borra y el perfil no tiene citas ni historial, el perfil se borra en cascada; si tiene, la FK `restrict` lo impide. |
| Cita cancelada | La franja **se conserva** y queda libre | Índice único parcial (P2). |
