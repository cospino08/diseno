# Diagrama entidad-relación

Dueño: P2. Implementación: `sql/esquema.sql`. Detalle de cada columna en
[diccionario_datos.md](diccionario_datos.md).

GitHub muestra el diagrama Mermaid directamente. Para exportarlo como imagen al documento
final se puede pegar el bloque en <https://mermaid.live>.

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "tiene perfil (trigger al registrarse)"
    PROFILES ||--o| PROFESSIONALS : "puede ser profesional"
    SPECIALTIES ||--o{ PROFESSIONALS : "agrupa"
    PROFESSIONALS ||--o{ SCHEDULES : "publica franjas"
    PROFILES |o--o{ SCHEDULES : "crea (admin)"
    PROFILES ||--o{ APPOINTMENTS : "reserva (paciente)"
    PROFESSIONALS ||--o{ APPOINTMENTS : "atiende"
    SCHEDULES ||--o{ APPOINTMENTS : "ocupa (max. 1 activa)"
    APPOINTMENTS ||--|{ STATUS_HISTORY : "registra cambios"
    PROFILES |o--o{ STATUS_HISTORY : "cambia (changed_by)"
    TRANSICIONES_VALIDAS }o--o{ STATUS_HISTORY : "valida (por valor de estado)"

    AUTH_USERS {
        uuid id PK "gestionado por Supabase Auth"
        text email
        jsonb raw_user_meta_data "solo se lee nombres"
    }
    PROFILES {
        uuid id PK,FK "= auth.users.id"
        text email
        text nombres "NOT NULL"
        text documento UK "nullable"
        text telefono "nullable"
        date fecha_nacimiento "nullable"
        rol_usuario rol "paciente | profesional | admin"
        boolean activo
        timestamptz created_at
    }
    SPECIALTIES {
        bigint id PK
        text nombre UK "unico sin mayusculas"
        text descripcion
        boolean activo
        timestamptz created_at
    }
    PROFESSIONALS {
        bigint id PK
        uuid profile_id FK,UK
        bigint specialty_id FK
        text nombre_publico
        text registro_profesional UK "nullable"
        boolean activo
        timestamptz created_at
    }
    SCHEDULES {
        bigint id PK
        bigint professional_id FK "UK(id, professional_id)"
        date fecha
        time hora_inicio
        time hora_fin "CHECK > hora_inicio"
        boolean activo "EXCLUDE: sin cruces si activo"
        uuid created_by FK
        timestamptz created_at
    }
    APPOINTMENTS {
        bigint id PK
        uuid patient_id FK
        bigint professional_id FK "FK compuesta con schedule_id"
        bigint schedule_id FK "UK parcial si estado <> cancelada"
        text motivo "max 200, no clinico"
        estado_cita estado
        text observaciones "max 500"
        rol_usuario cancelado_por
        timestamptz created_at
        timestamptz cancelled_at
    }
    STATUS_HISTORY {
        bigint id PK
        bigint appointment_id FK
        estado_cita estado_anterior "null = creacion"
        estado_cita estado_nuevo
        uuid changed_by FK
        timestamptz changed_at
    }
    TRANSICIONES_VALIDAS {
        estado_cita desde PK
        estado_cita hacia PK
    }
```

## Cardinalidades y decisiones

| Relación | Cardinalidad | Decisión |
| --- | --- | --- |
| `auth.users` – `profiles` | 1 a 1 | Credenciales separadas de los datos públicos (sección 9.1). Mismo UUID. El trigger `trg_nuevo_usuario` crea el perfil, siempre como `paciente`. |
| `profiles` – `professionals` | 1 a 0..1 | Un usuario es profesional solo si un admin lo promueve con `asignar_rol`. `profile_id` es único. |
| `specialties` – `professionals` | 1 a N | Cada profesional tiene una especialidad (MVP). Varias especialidades por profesional quedan fuera del alcance. |
| `professionals` – `schedules` | 1 a N | Cada franja es concreta (C2). La restricción `ex_schedules_sin_cruce` impide franjas activas cruzadas del mismo profesional (P3). |
| `schedules` – `appointments` | 1 a N, **máximo 1 activa** | Una franja conserva el historial de citas canceladas, pero el índice único parcial `uq_franja_con_cita_activa` solo permite una cita no cancelada (P2). |
| `appointments` – `schedules` / `professionals` | FK compuesta | `(schedule_id, professional_id)` → `schedules(id, professional_id)`: la cita no puede apuntar a la franja de otro profesional (C7). |
| `appointments` – `status_history` | 1 a 1..N | El trigger `trg_historial_cita` escribe la creación y cada cambio de estado con `changed_by = auth.uid()`. |
| `transiciones_validas` | catálogo | No tiene FK hacia otras tablas: el trigger `trg_validar_cita` la consulta por valor (`desde`, `hacia`) para aceptar o rechazar cada cambio. |

## Normalización

- **1FN:** todos los atributos son atómicos (no hay listas en columnas).
- **2FN:** todas las tablas tienen clave primaria simple, salvo `transiciones_validas`, que
  no tiene atributos fuera de la clave.
- **3FN:** no hay dependencias transitivas, con **una redundancia controlada**:
  `appointments.professional_id` se puede deducir de `schedule_id`. Se conserva para filtrar
  rápido la agenda y para la RLS del profesional, y la FK compuesta garantiza que nunca sea
  inconsistente (C7). `professionals.nombre_publico` no es redundante con
  `profiles.nombres`: es el nombre que se muestra a los pacientes (ej. "Dra. Laura Gómez"),
  porque ellos no pueden leer perfiles ajenos (P9).
