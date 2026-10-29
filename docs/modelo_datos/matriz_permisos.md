# Matriz rol-recurso-operación

Dueño: P2. Implementación: `sql/politicas_rls.sql`. Verificación: `sql/pruebas_seguridad.sql`.

Responde a la sección 10.1 del enunciado. Cada celda dice si la operación está permitida y
**sobre qué filas o columnas**. Tres capas trabajan juntas:

1. **Permisos** (`GRANT`): qué operación y qué columnas. Si falta, el error es `42501`.
2. **RLS** (políticas): qué filas. Si la fila no cumple, en SELECT simplemente no aparece y
   en INSERT/UPDATE el error es `42501` ("violates row-level security policy").
3. **RPC** `security definer`: operaciones que no se permiten directamente (citas, roles) y
   que pasan por funciones que validan el rol y la propiedad.

Leyenda: ✅ permitido · ❌ denegado · 🔒 solo mediante RPC.

## Tablas

| Recurso | Operación | anon (sin sesión) | Paciente | Profesional | Admin |
| --- | --- | --- | --- | --- | --- |
| `profiles` | SELECT | ❌ | ✅ solo su fila | ✅ solo su fila | ✅ todas |
| | INSERT | ❌ | ❌ (lo crea el trigger al registrarse) | ❌ | ❌ |
| | UPDATE | ❌ | ✅ su fila, solo `nombres`, `documento`, `telefono`, `fecha_nacimiento` | ✅ igual que paciente | ✅ esas 4 columnas en cualquier fila; `rol` 🔒 `asignar_rol`; `activo` 🔒 `cambiar_activo_perfil` |
| | DELETE | ❌ | ❌ | ❌ | ❌ (🔒 `anonimizar_paciente`) |
| `specialties` | SELECT | ❌ | ✅ activas | ✅ activas | ✅ todas |
| | INSERT | ❌ | ❌ | ❌ | ✅ `nombre`, `descripcion`, `activo` |
| | UPDATE | ❌ | ❌ | ❌ | ✅ `nombre`, `descripcion`, `activo` |
| | DELETE | ❌ | ❌ | ❌ | ❌ (borrado lógico) |
| `professionals` | SELECT | ❌ | ✅ activos | ✅ activos y su propia fila | ✅ todos |
| | INSERT | ❌ | ❌ | ❌ | 🔒 `asignar_rol` |
| | UPDATE | ❌ | ❌ | ❌ | ✅ `specialty_id`, `nombre_publico`, `registro_profesional`, `activo` |
| | DELETE | ❌ | ❌ | ❌ | ❌ (borrado lógico) |
| `schedules` | SELECT | ❌ | ✅ activas y las de sus citas | ✅ activas y todas las suyas | ✅ todas |
| | INSERT | ❌ | ❌ | ❌ | ✅ (y 🔒 `generar_franjas`); sin cruces |
| | UPDATE | ❌ | ❌ | ❌ | ✅ `fecha`, horas, `activo`; no si tiene cita activa |
| | DELETE | ❌ | ❌ | ❌ | ❌ (borrado lógico) |
| `appointments` | SELECT | ❌ | ✅ solo `patient_id = auth.uid()` | ✅ solo las asignadas a él | ✅ todas |
| | INSERT | ❌ | 🔒 `reservar_cita` (siempre a su nombre) | ❌ | ❌ |
| | UPDATE | ❌ | 🔒 `cancelar_cita` (sus citas, hasta 2 h antes) | 🔒 `cambiar_estado_cita`, `cancelar_cita` (solo sus citas) | 🔒 `cambiar_estado_cita`, `cancelar_cita` |
| | DELETE | ❌ | ❌ | ❌ | ❌ (ni desde el SQL Editor: trigger) |
| `status_history` | SELECT | ❌ | ✅ de sus citas | ✅ de sus citas | ✅ todo |
| | INSERT / UPDATE / DELETE | ❌ | ❌ (lo escribe el trigger) | ❌ | ❌ |
| `transiciones_validas` | SELECT | ❌ | ✅ | ✅ | ✅ |
| | INSERT / UPDATE / DELETE | ❌ | ❌ | ❌ | ❌ (solo por script SQL) |

## Funciones RPC (EXECUTE)

Todas tienen `revoke execute ... from public, anon`, así que **anon no ejecuta ninguna**
(CP-13). "Rechaza" indica el código que devuelve si otro rol la llama.

| RPC | Paciente | Profesional | Admin |
| --- | --- | --- | --- |
| `rol_actual` | ✅ | ✅ | ✅ |
| `franjas_disponibles` | ✅ | ✅ | ✅ |
| `reservar_cita` | ✅ | rechaza `SOLO_PACIENTES` | rechaza `SOLO_PACIENTES` |
| `mis_citas` | ✅ | rechaza `SOLO_PACIENTES` | rechaza `SOLO_PACIENTES` |
| `cancelar_cita` | ✅ sus citas, hasta 2 h antes | ✅ sus citas | ✅ todas |
| `cambiar_estado_cita` | rechaza `NO_AUTORIZADO` | ✅ sus citas | ✅ todas |
| `mi_agenda` | rechaza `NO_AUTORIZADO` | ✅ | rechaza `NO_AUTORIZADO` |
| `citas_admin` | rechaza `NO_AUTORIZADO` | rechaza `NO_AUTORIZADO` | ✅ |
| `generar_franjas` | rechaza `NO_AUTORIZADO` | rechaza `NO_AUTORIZADO` | ✅ |
| `asignar_rol` | rechaza `NO_AUTORIZADO` | rechaza `NO_AUTORIZADO` | ✅ (no a sí mismo) |
| `cambiar_activo_perfil` | rechaza `NO_AUTORIZADO` | rechaza `NO_AUTORIZADO` | ✅ (no a sí mismo) |
| `anonimizar_paciente` | rechaza `NO_AUTORIZADO` | rechaza `NO_AUTORIZADO` | ✅ solo pacientes |
| `indicadores_citas` | rechaza `NO_AUTORIZADO` | rechaza `NO_AUTORIZADO` | ✅ |

Un usuario con `profiles.activo = false` tiene `rol_actual() = null`: todas las RPC lo
rechazan y `franjas_disponibles` le devuelve una lista vacía.

## Políticas RLS implementadas

| Tabla | Política | Operación | Condición |
| --- | --- | --- | --- |
| `profiles` | `profiles_select_propio_o_admin` | SELECT | `id = auth.uid()` o admin |
| `profiles` | `profiles_update_propio_o_admin` | UPDATE | `id = auth.uid()` o admin |
| `specialties` | `specialties_select_activas_o_admin` | SELECT | `activo` o admin |
| `specialties` | `specialties_insert_admin`, `specialties_update_admin` | INSERT, UPDATE | admin |
| `professionals` | `professionals_select_activos_propio_o_admin` | SELECT | `activo`, propio o admin |
| `professionals` | `professionals_update_admin` | UPDATE | admin |
| `schedules` | `schedules_select` | SELECT | `activo`, admin, propias del profesional o de una cita del paciente |
| `schedules` | `schedules_insert_admin`, `schedules_update_admin` | INSERT, UPDATE | admin |
| `appointments` | `appointments_select_paciente_profesional_admin` | SELECT | `patient_id = auth.uid()`, `professional_id = mi_profesional_id()` o admin |
| `status_history` | `status_history_select_si_ve_la_cita` | SELECT | la cita es visible para el usuario (hereda la RLS de `appointments`) |
| `transiciones_validas` | `transiciones_select_todos` | SELECT | `true` (con sesión) |

"admin" significa `(select public.rol_actual()) = 'admin'`. `rol_actual()` es
`security definer` para leer `profiles` sin volver a pasar por su RLS (evita la recursión
infinita, P5).
