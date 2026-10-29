# Contrato entre la base de datos y el frontend

**Dueño:** P2 (base de datos y seguridad). **Lo usan:** P3 (acceso y paciente) y P4
(profesional, administración e indicadores).

Este documento es la **única fuente de verdad** sobre nombres de tablas, columnas, funciones
RPC, parámetros y códigos de error. Si el frontend necesita algo distinto, se pide a P2 en
`docs/ESTADO.md` (sección "Pedidos para P2"); P2 decide y actualiza este archivo.

Versión: **1.0** (28/10/2026). Implementación: `sql/esquema.sql` y `sql/politicas_rls.sql`.

---

## 1. Reglas generales

1. **Sin sesión no hay datos.** Todas las tablas y RPC exigen un usuario autenticado
   (rol `authenticated` de Supabase). El rol `anon` (sin sesión) no puede leer ninguna tabla
   ni ejecutar ninguna RPC: recibe el error `42501` (permiso denegado).
2. **Escrituras de citas solo por RPC.** Nadie (ni el admin) hace `insert`, `update` ni
   `delete` directo sobre `appointments` ni `status_history`. Se usan `reservar_cita`,
   `cancelar_cita` y `cambiar_estado_cita`.
3. **Nada se borra.** No hay `delete` en ninguna tabla. Se usa borrado lógico
   (`activo = false`). Ver la sección 6.
4. **Ocultar un botón no es seguridad.** El frontend oculta lo que no corresponde al rol por
   usabilidad, pero la base de datos vuelve a validar todo (RLS, permisos y RPC).
5. **Zona horaria.** Las franjas guardan `fecha` y horas como **hora local de Bogotá**
   (`America/Bogota`), sin zona horaria. Las comparaciones "pasado/futuro" se hacen en la
   base con esa zona. Las columnas `created_at`, `cancelled_at` y `changed_at` son
   `timestamptz` (llegan en UTC en formato ISO; mostrarlas con `toLocaleString('es-CO',
   { timeZone: 'America/Bogota' })`).
6. **Tipos en JavaScript.** `bigint` llega como `number`; `uuid`, `date` (`'2026-11-03'`),
   `time` (`'08:30:00'`) y los enum llegan como `string`.

### Valores cerrados (enum)

| Tipo | Valores |
| --- | --- |
| `rol_usuario` | `paciente`, `profesional`, `admin` |
| `estado_cita` | `programada`, `confirmada`, `atendida`, `cancelada`, `no_asistio` |

### Transiciones de estado permitidas

También se pueden leer de la tabla `transiciones_validas`.

| Desde | Hacia | Quién |
| --- | --- | --- |
| `programada` | `confirmada` | profesional asignado, admin |
| `programada` | `cancelada` | paciente dueño (hasta 2 h antes), profesional asignado, admin |
| `confirmada` | `atendida`, `no_asistio` | profesional asignado, admin (solo desde la hora de inicio) |
| `confirmada` | `cancelada` | paciente dueño (hasta 2 h antes), profesional asignado, admin |
| `atendida`, `cancelada`, `no_asistio` | — (estados finales) | nadie |

### Perfil completo

Un paciente solo puede reservar si su perfil está **completo**: `nombres` no vacío y
`documento`, `telefono` y `fecha_nacimiento` con valor. Tras el registro, el perfil se crea
automáticamente con rol `paciente` y solo `nombres` (si se envió en los metadatos); P3 debe
llevar al usuario a completar su perfil antes de reservar.

Registro desde el frontend (P3):

```js
await supabase.auth.signUp({
  email, password,
  options: { data: { nombres: 'Ana Pérez' } }   // solo se usa "nombres"; el rol se ignora
});
```

> Cualquier `rol` enviado en `options.data` **se ignora**: el trigger siempre crea el perfil
> como `paciente`. Solo un admin cambia roles con `asignar_rol`.

---

## 2. Tablas visibles para el frontend

Leyenda de permisos: **S** = `select`, **I** = `insert`, **U** = `update`. Ninguna tabla
permite `delete`.

### 2.1 `profiles` (datos públicos del usuario, 1 a 1 con `auth.users`)

| Columna | Tipo | Nulo | Notas |
| --- | --- | --- | --- |
| `id` | uuid | no | PK. Igual a `auth.users.id` (el `user.id` de la sesión). |
| `email` | text | sí | Copia del correo al registrarse. Solo lectura. |
| `nombres` | text | no | 1 a 120 caracteres para estar completo (default `''`). |
| `documento` | text | sí | Único. Formato `^[A-Za-z0-9-]{4,20}$`. |
| `telefono` | text | sí | Formato `^[0-9 +()-]{7,20}$`. |
| `fecha_nacimiento` | date | sí | Entre 1900-01-01 y hoy. |
| `rol` | rol_usuario | no | Solo lectura. Lo cambia `asignar_rol`. |
| `activo` | boolean | no | Solo lectura. Lo cambia `cambiar_activo_perfil`. |
| `created_at` | timestamptz | no | |

| Rol | Permisos |
| --- | --- |
| paciente / profesional | **S** su propia fila. **U** solo `nombres`, `documento`, `telefono`, `fecha_nacimiento` de su propia fila. |
| admin | **S** todas las filas. **U** las mismas 4 columnas en cualquier fila. |

Ejemplos:

```js
// Mi perfil
const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();

// Completar perfil
await supabase.from('profiles')
  .update({ nombres, documento, telefono, fecha_nacimiento })
  .eq('id', user.id);
```

Intentar `update({ rol: 'admin' })` devuelve el error `42501` (prueba CP-06).

### 2.2 `specialties` (catálogo de especialidades)

| Columna | Tipo | Nulo | Notas |
| --- | --- | --- | --- |
| `id` | bigint | no | PK autogenerada. |
| `nombre` | text | no | Único sin distinguir mayúsculas. 2 a 80 caracteres. |
| `descripcion` | text | sí | Máximo 300 caracteres. |
| `activo` | boolean | no | Default `true`. |
| `created_at` | timestamptz | no | |

| Rol | Permisos |
| --- | --- |
| paciente / profesional | **S** solo las activas. |
| admin | **S** todas. **I** y **U** `nombre`, `descripcion`, `activo`. |

### 2.3 `professionals` (profesionales de salud)

| Columna | Tipo | Nulo | Notas |
| --- | --- | --- | --- |
| `id` | bigint | no | PK. Es el `professional_id` de franjas y citas. |
| `profile_id` | uuid | no | Único. FK a `profiles.id`. |
| `specialty_id` | bigint | no | FK a `specialties.id`. |
| `nombre_publico` | text | no | Nombre que ven los pacientes (ej. "Dra. Laura Gómez"). |
| `registro_profesional` | text | sí | Único si existe. |
| `activo` | boolean | no | |
| `created_at` | timestamptz | no | |

| Rol | Permisos |
| --- | --- |
| paciente | **S** solo los activos. |
| profesional | **S** los activos y su propia fila. |
| admin | **S** todos. **U** `specialty_id`, `nombre_publico`, `registro_profesional`, `activo`. **I** solo con la RPC `asignar_rol`. |

Ejemplo con la especialidad embebida:

```js
await supabase.from('professionals')
  .select('id, nombre_publico, specialty_id, specialties(nombre)')
  .eq('specialty_id', idEspecialidad);
```

### 2.4 `schedules` (franjas concretas de atención)

Cada fila es **una franja concreta**: un profesional, una fecha, una hora de inicio y una de
fin. No hay patrones semanales.

| Columna | Tipo | Nulo | Notas |
| --- | --- | --- | --- |
| `id` | bigint | no | PK. |
| `professional_id` | bigint | no | FK a `professionals.id`. No se puede cambiar después de creada. |
| `fecha` | date | no | Hora local de Bogotá. |
| `hora_inicio` | time | no | |
| `hora_fin` | time | no | Mayor que `hora_inicio` (misma fecha). |
| `activo` | boolean | no | Franja publicada (`true`) o retirada (`false`). |
| `created_by` | uuid | sí | Admin que la creó (se llena solo). |
| `created_at` | timestamptz | no | |

| Rol | Permisos |
| --- | --- |
| paciente | **S** franjas activas y las franjas de sus propias citas. **Para buscar disponibilidad use `franjas_disponibles`**, porque el paciente no ve las citas de otros. |
| profesional | **S** franjas activas y todas las suyas. |
| admin | **S** todas. **I** `professional_id`, `fecha`, `hora_inicio`, `hora_fin`, `activo`. **U** `fecha`, `hora_inicio`, `hora_fin`, `activo`. |

Reglas que valida la base al insertar o modificar franjas:

- Dos franjas **activas** del mismo profesional no se pueden cruzar → `HORARIO_SUPERPUESTO`.
- Una franja con cita activa (programada o confirmada) no se puede mover ni desactivar →
  `FRANJA_CON_CITA`. Primero hay que cancelar la cita.

Para crear muchas franjas a la vez use la RPC `generar_franjas`.

Ejemplo (admin, franjas de un día con su ocupación):

```js
await supabase.from('schedules')
  .select('id, fecha, hora_inicio, hora_fin, activo, appointments(id, estado)')
  .eq('professional_id', idProfesional).eq('fecha', '2026-11-03')
  .order('hora_inicio');
```

### 2.5 `appointments` (citas). Solo lectura

| Columna | Tipo | Nulo | Notas |
| --- | --- | --- | --- |
| `id` | bigint | no | PK. |
| `patient_id` | uuid | no | FK a `profiles.id`. |
| `professional_id` | bigint | no | FK a `professionals.id`. Siempre coincide con el de la franja. |
| `schedule_id` | bigint | no | FK compuesta `(schedule_id, professional_id)` → `schedules`. |
| `motivo` | text | sí | Máximo 200 caracteres. **Sin información clínica.** |
| `estado` | estado_cita | no | |
| `observaciones` | text | sí | Nota administrativa, máximo 500. La ve también el paciente. |
| `cancelado_por` | rol_usuario | sí | Rol de quien canceló. Si no es `paciente`, mostrar "Cancelada por la institución". |
| `created_at` | timestamptz | no | |
| `cancelled_at` | timestamptz | sí | Se llena al cancelar. |

| Rol | Permisos |
| --- | --- |
| paciente | **S** solo sus citas (`patient_id = auth.uid()`). |
| profesional | **S** solo las citas asignadas a él. |
| admin | **S** todas. |
| todos | **Sin I, U ni D.** Se usa `reservar_cita`, `cancelar_cita`, `cambiar_estado_cita`. |

Para pantallas se recomiendan las RPC `mis_citas`, `mi_agenda` y `citas_admin`, que ya
devuelven los datos aplanados (fecha, hora, nombres) y ordenados.

### 2.6 `status_history` (historial de estados). Solo lectura

| Columna | Tipo | Nulo | Notas |
| --- | --- | --- | --- |
| `id` | bigint | no | PK. |
| `appointment_id` | bigint | no | FK a `appointments.id`. |
| `estado_anterior` | estado_cita | sí | `null` en la fila de creación de la cita. |
| `estado_nuevo` | estado_cita | no | |
| `changed_by` | uuid | sí | Usuario que hizo el cambio (`null` si se hizo desde el SQL Editor). |
| `changed_at` | timestamptz | no | |

**S**: cada usuario ve el historial de las citas que puede ver. Lo escribe un trigger.

### 2.7 `transiciones_validas`. Solo lectura

| Columna | Tipo |
| --- | --- |
| `desde` | estado_cita |
| `hacia` | estado_cita |

Útil para decidir qué botones de estado mostrar (P4).

---

## 3. Funciones RPC

Se llaman con `supabase.rpc('nombre', { parametros })`. Los nombres de los parámetros deben
ser **exactamente** los de la tabla (con el prefijo `p_`). Los parámetros con default se
pueden omitir. Todas exigen sesión (`anon` recibe `42501`).

### 3.1 Resumen

| RPC | Quién | Devuelve |
| --- | --- | --- |
| `rol_actual()` | cualquier usuario con sesión | `rol_usuario` o `null` |
| `franjas_disponibles(p_especialidad, p_profesional, p_fecha)` | cualquier usuario con sesión | filas de franjas libres |
| `reservar_cita(p_schedule_id, p_motivo)` | paciente | `bigint` (id de la cita) |
| `mis_citas()` | paciente | filas de sus citas |
| `cancelar_cita(p_cita_id)` | paciente, profesional, admin | nada |
| `cambiar_estado_cita(p_cita_id, p_estado, p_observaciones)` | profesional, admin | nada |
| `mi_agenda(p_desde, p_hasta)` | profesional | filas de su agenda |
| `citas_admin(p_desde, p_hasta, p_profesional, p_estado)` | admin | filas de citas |
| `generar_franjas(p_profesional, p_fecha, p_inicio, p_fin, p_minutos)` | admin | `integer` (franjas creadas) |
| `asignar_rol(p_usuario, p_rol, p_especialidad, p_nombre_publico)` | admin | nada |
| `cambiar_activo_perfil(p_usuario, p_activo)` | admin | nada |
| `anonimizar_paciente(p_usuario)` | admin | nada |
| `indicadores_citas(p_desde, p_hasta, p_agrupacion)` | admin | `jsonb` |

### 3.2 `rol_actual()`

Sin parámetros. Devuelve el rol del usuario de la sesión, o `null` si su perfil está
desactivado. P3 lo usa en `auth.js` para las guardas por rol.

```js
const { data: rol } = await supabase.rpc('rol_actual');   // 'paciente' | 'profesional' | 'admin' | null
```

### 3.3 `franjas_disponibles(p_especialidad, p_profesional, p_fecha)`

| Parámetro | Tipo | Default | Significado |
| --- | --- | --- | --- |
| `p_especialidad` | bigint | `null` | Filtra por especialidad (`null` = todas). |
| `p_profesional` | bigint | `null` | Filtra por profesional (`null` = todos). |
| `p_fecha` | date | `null` | Un día concreto. Si es `null`, devuelve los próximos 30 días. |

Devuelve solo franjas **activas, futuras y sin cita activa**, de profesionales y
especialidades activos, ordenadas por fecha y hora. No expone datos de otros pacientes.

| Columna | Tipo |
| --- | --- |
| `schedule_id` | bigint |
| `fecha` | date |
| `hora_inicio` | time |
| `hora_fin` | time |
| `professional_id` | bigint |
| `profesional` | text (`nombre_publico`) |
| `specialty_id` | bigint |
| `especialidad` | text |

Errores: ninguno propio (lista vacía si no hay disponibilidad).

### 3.4 `reservar_cita(p_schedule_id, p_motivo)`

| Parámetro | Tipo | Default |
| --- | --- | --- |
| `p_schedule_id` | bigint | — |
| `p_motivo` | text | `null` (máximo 200 caracteres) |

Devuelve el `id` (bigint) de la cita creada en estado `programada`. El `patient_id` es
siempre el usuario de la sesión: no se puede reservar a nombre de otro.

Errores: `SOLO_PACIENTES`, `PERFIL_INCOMPLETO`, `DATOS_INVALIDOS`, `FRANJA_NO_EXISTE`,
`FRANJA_PASADA`, `FRANJA_OCUPADA`.

```js
const { data: idCita, error } = await supabase.rpc('reservar_cita',
  { p_schedule_id: franja.schedule_id, p_motivo: motivo });
if (error?.message === 'FRANJA_OCUPADA') { /* avisar y recargar franjas_disponibles */ }
```

**Concurrencia (CP-02):** si dos personas reservan la misma franja a la vez, la base solo
deja pasar una; la otra recibe `FRANJA_OCUPADA`.

### 3.5 `mis_citas()`

Sin parámetros. Citas del paciente de la sesión, de la más reciente a la más antigua.

| Columna | Tipo | Notas |
| --- | --- | --- |
| `cita_id` | bigint | |
| `fecha` | date | |
| `hora_inicio` | time | |
| `hora_fin` | time | |
| `estado` | estado_cita | |
| `motivo` | text | |
| `observaciones` | text | |
| `profesional` | text | `nombre_publico` |
| `especialidad` | text | |
| `cancelado_por` | rol_usuario | |
| `created_at` | timestamptz | |
| `cancelled_at` | timestamptz | |
| `puede_cancelar` | boolean | `true` si está programada o confirmada y faltan más de 2 h. Solo para mostrar el botón; la base vuelve a validar. |

Errores: `SOLO_PACIENTES`.

### 3.6 `cancelar_cita(p_cita_id)`

| Parámetro | Tipo |
| --- | --- |
| `p_cita_id` | bigint |

No devuelve nada. Deja la cita en `cancelada`, registra `cancelled_at`, `cancelado_por` y
una fila en `status_history`. **La franja queda libre de nuevo** (CP-09).

- Paciente: solo sus citas y hasta **2 horas antes** del inicio.
- Profesional: solo citas asignadas a él, sin límite de tiempo.
- Admin: cualquier cita, sin límite de tiempo.

Errores: `NO_AUTORIZADO` (la cita no existe o no es suya: no se distingue a propósito, para
no revelar qué ID existen), `TRANSICION_INVALIDA` (ya está atendida, cancelada o no_asistio),
`FUERA_DE_PLAZO`.

### 3.7 `cambiar_estado_cita(p_cita_id, p_estado, p_observaciones)`

| Parámetro | Tipo | Default |
| --- | --- | --- |
| `p_cita_id` | bigint | — |
| `p_estado` | estado_cita (string) | — |
| `p_observaciones` | text | `null` (si es `null` se conservan las anteriores; máximo 500) |

No devuelve nada. El profesional solo puede cambiar citas asignadas a él.

Errores: `NO_AUTORIZADO`, `TRANSICION_INVALIDA`, `ANTES_DE_HORA` (`atendida` o `no_asistio`
antes de la hora de inicio), `DATOS_INVALIDOS`.

### 3.8 `mi_agenda(p_desde, p_hasta)`

| Parámetro | Tipo | Default |
| --- | --- | --- |
| `p_desde` | date | hoy (Bogotá) |
| `p_hasta` | date | igual a `p_desde` |

Máximo 31 días de rango. Citas del profesional de la sesión (todas las de sus franjas,
incluidas canceladas), ordenadas por fecha y hora.

| Columna | Tipo | Notas |
| --- | --- | --- |
| `cita_id` | bigint | |
| `schedule_id` | bigint | |
| `fecha` | date | |
| `hora_inicio` | time | |
| `hora_fin` | time | |
| `estado` | estado_cita | |
| `motivo` | text | |
| `observaciones` | text | |
| `paciente_nombres` | text | Solo nombre y teléfono: nunca el perfil completo. |
| `paciente_telefono` | text | |
| `cancelado_por` | rol_usuario | |

Errores: `NO_AUTORIZADO` (quien llama no es un profesional activo), `DATOS_INVALIDOS`.

### 3.9 `citas_admin(p_desde, p_hasta, p_profesional, p_estado)`

| Parámetro | Tipo | Default |
| --- | --- | --- |
| `p_desde` | date | hoy (Bogotá) |
| `p_hasta` | date | `p_desde` + 30 días |
| `p_profesional` | bigint | `null` (todos) |
| `p_estado` | estado_cita | `null` (todos) |

Máximo 366 días de rango. Devuelve las mismas columnas que `mi_agenda` más:
`professional_id` (bigint), `profesional` (text), `especialidad` (text),
`patient_id` (uuid) y `paciente_documento` (text).

Errores: `NO_AUTORIZADO`, `DATOS_INVALIDOS`.

### 3.10 `generar_franjas(p_profesional, p_fecha, p_inicio, p_fin, p_minutos)`

| Parámetro | Tipo | Ejemplo |
| --- | --- | --- |
| `p_profesional` | bigint | `3` |
| `p_fecha` | date | `'2026-11-03'` |
| `p_inicio` | time | `'08:00'` |
| `p_fin` | time | `'12:00'` |
| `p_minutos` | integer | `20` (entre 10 y 240) |

Crea franjas consecutivas de `p_minutos` desde `p_inicio` hasta `p_fin` (si la última no
cabe completa, no se crea). Es **todo o nada**: si una sola se cruza con otra franja activa,
no se crea ninguna. Devuelve cuántas creó.

Errores: `NO_AUTORIZADO`, `DATOS_INVALIDOS` (profesional inexistente o inactivo, minutos
fuera de rango, `p_fin <= p_inicio`), `FRANJA_PASADA` (fecha anterior a hoy),
`HORARIO_SUPERPUESTO`.

### 3.11 `asignar_rol(p_usuario, p_rol, p_especialidad, p_nombre_publico)`

| Parámetro | Tipo | Default |
| --- | --- | --- |
| `p_usuario` | uuid | — (`profiles.id` del usuario) |
| `p_rol` | rol_usuario | — |
| `p_especialidad` | bigint | `null` (obligatorio si `p_rol = 'profesional'`) |
| `p_nombre_publico` | text | `null` (si es `null`, se usa `profiles.nombres`) |

Flujo para dar de alta un profesional o un admin: la persona **se registra** como cualquier
usuario (queda como paciente) y el admin la busca en `profiles` y la promueve con esta RPC.

- `profesional`: crea (o reactiva y actualiza) su fila en `professionals`.
- `paciente` o `admin`: si tenía fila en `professionals`, se desactiva (no se borra).
- Un admin no puede cambiar su propio rol (evita quedarse sin administradores).

Errores: `NO_AUTORIZADO`, `DATOS_INVALIDOS` (usuario inexistente, especialidad faltante o
inactiva, nombre público vacío).

### 3.12 `cambiar_activo_perfil(p_usuario, p_activo)`

| Parámetro | Tipo |
| --- | --- |
| `p_usuario` | uuid |
| `p_activo` | boolean |

Activa o desactiva una cuenta. Un usuario desactivado conserva la sesión de Supabase Auth,
pero `rol_actual()` devuelve `null` y todas las RPC lo rechazan. Un admin no puede
desactivarse a sí mismo.

Errores: `NO_AUTORIZADO`, `DATOS_INVALIDOS`.

### 3.13 `anonimizar_paciente(p_usuario)`

| Parámetro | Tipo |
| --- | --- |
| `p_usuario` | uuid |

Atiende una solicitud de baja: reemplaza nombres por "Paciente anonimizado", borra
documento, teléfono y fecha de nacimiento, desactiva el perfil y cancela sus citas futuras
activas. Las citas se conservan para la trazabilidad. Solo pacientes.

Errores: `NO_AUTORIZADO`, `DATOS_INVALIDOS`.

### 3.14 `indicadores_citas(p_desde, p_hasta, p_agrupacion)`

| Parámetro | Tipo | Default |
| --- | --- | --- |
| `p_desde` | date | — |
| `p_hasta` | date | — |
| `p_agrupacion` | text | `'mes'` (`'dia'`, `'semana'` o `'mes'`) |

Cuenta las citas cuya franja cae entre `p_desde` y `p_hasta` (ambos incluidos). Devuelve un
objeto JSON:

```json
{
  "total": 523,
  "por_estado":       [{ "estado": "atendida", "total": 120 }, ...],
  "por_especialidad": [{ "especialidad": "Pediatría", "total": 98 }, ...],
  "por_periodo":      [{ "periodo": "2026-10-01", "total": 260 }, ...]
}
```

`periodo` es la fecha de inicio del día, semana (lunes) o mes. Los arreglos vienen vacíos
si no hay citas.

Errores: `NO_AUTORIZADO`, `DATOS_INVALIDOS` (`p_hasta < p_desde` o agrupación desconocida).

---

## 4. Códigos de error

### 4.1 Cómo llegan al frontend

Las RPC lanzan `raise exception '<CODIGO>'`. En `supabase-js` el error llega así:

```js
const { data, error } = await supabase.rpc('reservar_cita', { p_schedule_id: 10 });
// error.message === 'FRANJA_OCUPADA'   ← el código exacto, sin texto adicional
// error.code    === 'P0001'            ← SQLSTATE de raise exception
// error.details → explicación técnica en español (para la consola, no para el usuario)
```

**Regla:** comparar siempre `error.message` con el código. P3 traduce los códigos a mensajes
para el usuario en `assets/js/ui/mensajes.js`.

### 4.2 Códigos propios

| Código | Cuándo ocurre | RPC o tabla | Mensaje sugerido para el usuario |
| --- | --- | --- | --- |
| `FRANJA_OCUPADA` | Otra persona reservó esa franja antes. | `reservar_cita` | "Ese horario acaba de ser reservado por otra persona. Elige otro." (recargar disponibilidad) |
| `FRANJA_PASADA` | La franja ya empezó o la fecha es anterior a hoy. | `reservar_cita`, `generar_franjas` | "No se puede usar una fecha u hora que ya pasó." |
| `FRANJA_NO_EXISTE` | La franja no existe, está inactiva o su profesional o especialidad están inactivos. | `reservar_cita` | "El horario ya no está disponible." |
| `PERFIL_INCOMPLETO` | Falta nombre, documento, teléfono o fecha de nacimiento. | `reservar_cita` | "Completa tu perfil antes de reservar." (llevar a perfil) |
| `SOLO_PACIENTES` | Quien llama no es un paciente activo. | `reservar_cita`, `mis_citas` | "Esta acción solo está disponible para pacientes." |
| `NO_AUTORIZADO` | El rol no puede hacer la acción, o la cita no existe o no le pertenece. | todas las de profesional y admin, `cancelar_cita`, `cambiar_estado_cita` | "No tienes permiso para realizar esta acción." |
| `FUERA_DE_PLAZO` | El paciente cancela con menos de 2 h de anticipación. | `cancelar_cita` | "Solo puedes cancelar hasta 2 horas antes de la cita. Comunícate con la clínica." |
| `ANTES_DE_HORA` | Marcar `atendida` o `no_asistio` antes de la hora de inicio. | `cambiar_estado_cita` | "Solo puedes marcar la cita como atendida o no asistió desde su hora de inicio." |
| `TRANSICION_INVALIDA` | El cambio de estado no está en `transiciones_validas`. | `cancelar_cita`, `cambiar_estado_cita` | "La cita ya no admite ese cambio de estado." |
| `HORARIO_SUPERPUESTO` | La franja se cruza con otra franja activa del mismo profesional. | `generar_franjas`, insert/update en `schedules` | "Ese horario se cruza con otra franja del profesional." |
| `FRANJA_CON_CITA` | Se intenta mover o desactivar una franja con cita activa. | update en `schedules` | "Esta franja tiene una cita activa. Cancélala antes de modificarla." |
| `DATOS_INVALIDOS` | Parámetros fuera de rango o incoherentes (ver `error.details`). | varias | "Revisa los datos ingresados." |

### 4.3 Errores de PostgreSQL y de Supabase que también pueden llegar

| `error.code` | Significado | Ejemplo | Mensaje sugerido |
| --- | --- | --- | --- |
| `42501` | Permiso denegado (sin sesión, o escritura directa no permitida). | `anon` llama una RPC; un paciente hace `update` de `rol`. | "No tienes permiso para realizar esta acción." |
| `23505` | Valor duplicado. `error.message` incluye el nombre de la restricción: `uq_profiles_documento`, `uq_specialties_nombre`, `uq_professionals_registro`. | Documento ya registrado. | "Ya existe un registro con ese documento / nombre." |
| `23514` | Falla una regla CHECK. El mensaje incluye el nombre: `ck_profiles_documento`, `ck_profiles_telefono`, `ck_profiles_fecha_nacimiento`, `ck_profiles_nombres`, `ck_specialties_nombre`, `ck_schedules_horas`… | Teléfono con letras. | "Revisa el formato del campo." |
| `PGRST301` / `401` | Sesión expirada o JWT inválido. | Token vencido. | Redirigir al inicio de sesión (CP-14). |
| `PGRST116` | `.single()` no encontró filas (o la RLS las ocultó). | Leer una cita ajena con `.single()`. | "No encontrado." |

> Una consulta `select` sobre una fila que la RLS oculta **no da error**: simplemente devuelve
> una lista vacía (CP-03).

---

## 5. Recetas por pantalla

| Pantalla (dueño) | Llamadas |
| --- | --- |
| Registro (P3) | `auth.signUp` con `data.nombres`. |
| Guarda por rol (P3) | `rpc('rol_actual')`. `null` → "Cuenta desactivada". |
| Perfil (P3) | `from('profiles').select().eq('id', user.id)` y `update(...)`. |
| Buscar disponibilidad (P3) | `from('specialties').select()`, `from('professionals').select()`, `rpc('franjas_disponibles', {...})`. |
| Confirmar reserva (P3) | `rpc('reservar_cita', {...})`. |
| Mis citas (P3) | `rpc('mis_citas')`, `rpc('cancelar_cita', {...})`. |
| Agenda del profesional (P4) | `rpc('mi_agenda', {...})`. |
| Detalle y cambio de estado (P4) | `from('transiciones_validas').select()`, `from('status_history').select().eq('appointment_id', id)`, `rpc('cambiar_estado_cita', {...})`, `rpc('cancelar_cita', {...})`. |
| Admin: especialidades (P4) | `from('specialties')` select / insert / update. |
| Admin: profesionales (P4) | `from('profiles').select()` para buscar usuarios, `rpc('asignar_rol', {...})`, `from('professionals')` select / update. |
| Admin: pacientes (P4) | `from('profiles').select().eq('rol','paciente')`, `update(...)`, `rpc('cambiar_activo_perfil')`, `rpc('anonimizar_paciente')`. |
| Admin: horarios (P4) | `rpc('generar_franjas', {...})`, `from('schedules')` select / insert / update. |
| Admin: citas (P4) | `rpc('citas_admin', {...})`, `rpc('cambiar_estado_cita')`, `rpc('cancelar_cita')`. |
| Admin: indicadores (P4) | `rpc('indicadores_citas', {...})`. |

---

## 6. Borrado de datos

| Entidad | Tratamiento |
| --- | --- |
| `specialties`, `professionals`, `schedules` | Borrado lógico con `activo = false`. Las FK usan `on delete restrict`. |
| `appointments`, `status_history` | Nunca se borran: son la trazabilidad de la agenda. |
| `profiles` | Desactivación (`cambiar_activo_perfil`) o anonimización (`anonimizar_paciente`). |

---

## 7. Historial de cambios del contrato

| Versión | Fecha | Cambio |
| --- | --- | --- |
| 1.0 | 28/10/2026 | Versión inicial. Respecto a la sección 7 del plan, se añaden: `rol_actual`, `mis_citas`, `citas_admin`, `cambiar_activo_perfil`, `anonimizar_paciente`; los códigos `FRANJA_CON_CITA` y `DATOS_INVALIDOS`; la columna `cancelado_por` en `appointments` y `email` en `profiles`; `p_observaciones` en `cambiar_estado_cita` y `p_agrupacion` en `indicadores_citas`. |
