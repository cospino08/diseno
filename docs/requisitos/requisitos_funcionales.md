# 5. Requisitos funcionales

Responde a la sección 7.1 del enunciado (mínimo 15 requisitos con descripción, actor,
prioridad, fuente y criterio de aceptación).

- **Prioridad:** Alta = obligatoria por el enunciado o necesaria para una regla de negocio;
  Media = mejora la operación pero el MVP funciona sin ella; Baja = deseable.
- **Fuente:** sección del enunciado (E §) o decisión del plan de trabajo (Plan Cx / Px).
- **Criterio de aceptación:** en formato *Dado … cuando … entonces …*, verificable con un
  caso de prueba.
- Los nombres de tablas, RPC y códigos de error siguen `docs/contrato_api.md` **v1.0**
  (P2, 28/10/2026), que es la fuente de verdad técnica.

| ID | Requisito | Actor | Prioridad | Fuente | Criterio de aceptación |
| --- | --- | --- | --- | --- | --- |
| RF-01 | El sistema permitirá a un visitante registrarse con nombres, correo y contraseña mediante Supabase Auth. | Visitante | Alta | E §5.2; Plan P4 | Dado un correo no registrado, cuando el visitante envía el formulario válido, se crea el usuario en `auth.users` y un perfil en `profiles` con rol `paciente`, aunque haya enviado otro rol en los metadatos. |
| RF-02 | El sistema permitirá iniciar y cerrar sesión, y llevará a cada usuario a la página de su rol. | Paciente, Profesional, Admin | Alta | E §5.2, §8.3 | Dado un usuario con credenciales válidas, cuando inicia sesión, llega a la página de inicio de su rol; si abre una página de otro rol, ve "acceso denegado". Si su cuenta está desactivada (`rol_actual()` devuelve `null`), ve "Cuenta desactivada". Al cerrar sesión, volver atrás no muestra datos. |
| RF-03 | El sistema ofrecerá una instrucción de recuperación de contraseña por correo. | Paciente, Profesional, Admin | Media | E §8.3 | Dado un correo registrado, cuando el usuario solicita recuperar la contraseña, el sistema muestra un mensaje de confirmación sin revelar si el correo existe. |
| RF-04 | El paciente podrá consultar y actualizar su perfil: nombres, documento, teléfono y fecha de nacimiento. | Paciente | Alta | E §5.2; Plan P4 | Dado un paciente autenticado, cuando guarda datos válidos, el perfil se actualiza; si intenta cambiar `rol` o `activo`, la base responde `42501`. Un documento ya usado por otro usuario se rechaza (`23505`, `uq_profiles_documento`); formatos inválidos se rechazan (`23514`). |
| RF-05 | El sistema exigirá un perfil completo antes de permitir una reserva. | Paciente | Alta | Plan P4 | Dado un paciente al que le falta nombre, documento, teléfono o fecha de nacimiento, cuando intenta reservar, recibe `PERFIL_INCOMPLETO` y la interfaz lo lleva al perfil. |
| RF-06 | El sistema permitirá al paciente reservar una cita en una franja disponible. | Paciente | Alta | E §5.2, §5.3, §7.1 | Dado un paciente autenticado y una franja libre, cuando confirma la reserva, se crea una sola cita en estado `programada` a su nombre (el `patient_id` lo fija la base) y la franja deja de aparecer disponible. Si dos reservas llegan a la vez, solo una se confirma y la otra recibe `FRANJA_OCUPADA`. |
| RF-07 | El paciente podrá buscar franjas disponibles por especialidad, profesional y fecha. | Paciente | Alta | E §5.2 | Dada una especialidad y una fecha, `franjas_disponibles` devuelve solo franjas activas, futuras y sin cita activa, de profesionales y especialidades activos, con fecha, hora, profesional y especialidad. Sin fecha, devuelve los próximos 30 días. Sin resultados, muestra el estado vacío. |
| RF-08 | El sistema consultará el catálogo de especialidades y profesionales activos. | Paciente, Admin | Alta | E §5.2 | Al abrir la búsqueda, se listan solo especialidades y profesionales con `activo = true`, con el nombre público del profesional. |
| RF-09 | El paciente podrá consultar "Mis citas" con fecha, hora, profesional, especialidad y estado. | Paciente | Alta | E §5.2 | Dado un paciente con citas, `mis_citas` muestra solo sus citas; las canceladas por la institución se identifican como tales. Una consulta a `appointments` con el ID de una cita ajena devuelve una lista vacía. |
| RF-10 | El profesional consultará únicamente su agenda. | Profesional | Alta | E §5.2, §7.1 | Al ingresar como profesional, `mi_agenda` no retorna citas asignadas a otro profesional; muestra fecha, hora, nombre y teléfono del paciente (nunca el perfil completo), motivo y estado. Un usuario que no es profesional recibe `NO_AUTORIZADO`. |
| RF-11 | El profesional cambiará el estado de sus citas siguiendo las transiciones válidas. | Profesional, Admin | Alta | E §5.2, §5.3; Plan P6 | Dada una cita propia `confirmada` cuya hora de inicio ya pasó, puede marcarla `atendida` o `no_asistio`. Una transición fuera de la tabla devuelve `TRANSICION_INVALIDA`; una cita de otro profesional devuelve `NO_AUTORIZADO`; marcar atendida antes de la hora devuelve `ANTES_DE_HORA`. |
| RF-12 | El paciente podrá cancelar sus citas futuras hasta 2 horas antes del inicio. | Paciente | Alta | E §5.2; Plan C4 | Dada una cita propia `programada` o `confirmada` que empieza en más de 2 h, al cancelar pasa a `cancelada`, se guarda `cancelled_at` y la franja vuelve a estar disponible. A menos de 2 h, recibe `FUERA_DE_PLAZO`. |
| RF-13 | El sistema registrará cada cambio de estado con el usuario y la fecha. | Sistema | Alta | E §5.3, §9 | Al crear la cita y después de cualquier cambio de estado, existe una fila en `status_history` con estado anterior (`null` en la creación), estado nuevo, `changed_by = auth.uid()` y `changed_at`. Ningún usuario puede insertar ni editar el historial directamente. |
| RF-14 | El administrador podrá crear, editar, activar y desactivar especialidades. | Admin | Alta | E §5.2 | Dado un admin, cuando crea una especialidad con nombre único (sin distinguir mayúsculas; un repetido da `23505`), aparece en el catálogo; al desactivarla deja de aparecer en la búsqueda del paciente. Un paciente o profesional que lo intente recibe rechazo de la RLS. |
| RF-15 | El administrador podrá promover un usuario registrado a profesional (con especialidad y nombre público) o a admin, y activar o desactivar profesionales. | Admin | Alta | E §5.2; Plan P10 | Dado un usuario registrado, cuando el admin ejecuta `asignar_rol` con rol `profesional` y una especialidad activa, se actualiza el rol y se crea (o reactiva) la fila en `professionals`. Si lo intenta un no admin, recibe `NO_AUTORIZADO`. Un admin no puede cambiar su propio rol. |
| RF-16 | El administrador podrá generar franjas en bloque para un profesional, fecha y rango horario. | Admin | Alta | E §5.2; Plan C2, P3 | Dado un profesional, una fecha, 08:00–12:00 y 30 minutos, `generar_franjas` crea 8 franjas. Si alguna se cruza con una franja activa existente del mismo profesional, no se crea ninguna (`HORARIO_SUPERPUESTO`). Una fecha pasada da `FRANJA_PASADA`. |
| RF-17 | El administrador podrá modificar o desactivar una franja solo si no tiene cita activa. | Admin | Alta | E §6.2; Plan P12 | Dada una franja con cita activa, cambiar su fecha u horas o desactivarla se rechaza con `FRANJA_CON_CITA`. Sin cita activa, el cambio se guarda. |
| RF-18 | El administrador podrá consultar todas las citas y cambiar su estado o cancelarlas (cancelación institucional). | Admin | Media | E §5.1, §5.2 | Dado un admin, `citas_admin` lista citas de todos los profesionales con filtros por rango de fechas, profesional y estado; al cancelar, la cita queda con `cancelado_por = 'admin'` y el historial registra al admin como autor. |
| RF-19 | El administrador consultará indicadores de citas por estado, especialidad y periodo. | Admin | Alta | E §5.2; Plan P11 | Dado un rango de fechas y una agrupación (día, semana o mes), `indicadores_citas` devuelve conteos agregados que coinciden con un conteo SQL directo sobre los mismos datos. Un no admin recibe `NO_AUTORIZADO`. |
| RF-20 | El sistema mostrará mensajes claros de éxito, error, validación y confirmación antes de acciones relevantes. | Todos | Alta | E §5.2, §8.2 | Cada código de error de las RPC se muestra como un mensaje en español comprensible. Reservar, cancelar y cambiar estado piden confirmación. Cada vista tiene estados de cargando, vacío, error, acceso denegado y éxito. |
| RF-21 | El administrador podrá consultar pacientes, desactivar o reactivar cuentas y anonimizar a un paciente que pide la baja. | Admin | Alta | E §5.1, §9.1; Plan P13 | Dado un paciente desactivado con `cambiar_activo_perfil`, `rol_actual()` devuelve `null` y sus RPC son rechazadas. Al ejecutar `anonimizar_paciente`, sus datos personales se reemplazan, sus citas futuras activas quedan canceladas y las citas se conservan. Un admin no puede desactivarse a sí mismo. |

## 5.1 Reglas de negocio y requisitos que las cubren

| Regla (E §5.3) | Requisitos |
| --- | --- |
| No reservar una franja ocupada ni una fecha pasada | RF-06, RF-07 |
| Un profesional no tiene dos citas superpuestas | RF-06, RF-16 |
| El paciente no modifica citas ajenas | RF-09, RF-12 |
| El profesional solo administra sus citas | RF-10, RF-11 |
| Acciones del admin asociadas al usuario autenticado | RF-13, RF-18 |
| La cancelación libera la franja | RF-12 |
| Transiciones válidas de estado | RF-11 |
| Controles críticos en la base de datos | Todos los anteriores + RNF-01, RNF-08 |
