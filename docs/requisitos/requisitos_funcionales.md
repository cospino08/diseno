# 5. Requisitos funcionales

Responde a la sección 7.1 del enunciado (mínimo 15 requisitos con descripción, actor,
prioridad, fuente y criterio de aceptación).

- **Prioridad:** Alta = obligatoria por el enunciado o necesaria para una regla de negocio;
  Media = mejora la operación pero el MVP funciona sin ella; Baja = deseable.
- **Fuente:** sección del enunciado (E §) o decisión del plan de trabajo (Plan Cx / Px).
- **Criterio de aceptación:** en formato *Dado … cuando … entonces …*, verificable con un
  caso de prueba.
- Los nombres de RPC y códigos de error siguen la sección 7 del plan. Se confirmarán contra
  `docs/contrato_api.md` (P2) antes de cerrar la trazabilidad.

| ID | Requisito | Actor | Prioridad | Fuente | Criterio de aceptación |
| --- | --- | --- | --- | --- | --- |
| RF-01 | El sistema permitirá a un visitante registrarse con nombres, correo y contraseña mediante Supabase Auth. | Visitante | Alta | E §5.2; Plan P4 | Dado un correo no registrado, cuando el visitante envía el formulario válido, se crea el usuario en `auth.users` y un perfil en `profiles` con rol `paciente`, aunque haya enviado otro rol en los metadatos. |
| RF-02 | El sistema permitirá iniciar y cerrar sesión, y llevará a cada usuario a la página de su rol. | Paciente, Profesional, Admin | Alta | E §5.2, §8.3 | Dado un usuario con credenciales válidas, cuando inicia sesión, llega a la página de inicio de su rol; si abre una página de otro rol, ve "acceso denegado". Al cerrar sesión, volver atrás no muestra datos. |
| RF-03 | El sistema ofrecerá una instrucción de recuperación de contraseña por correo. | Paciente, Profesional, Admin | Media | E §8.3 | Dado un correo registrado, cuando el usuario solicita recuperar la contraseña, el sistema muestra un mensaje de confirmación sin revelar si el correo existe. |
| RF-04 | El paciente podrá consultar y actualizar su perfil: nombres, documento, teléfono y fecha de nacimiento. | Paciente | Alta | E §5.2; Plan P4 | Dado un paciente autenticado, cuando guarda datos válidos, el perfil se actualiza; si intenta cambiar `rol` o `activo`, la base rechaza la operación. El documento no se repite entre pacientes. |
| RF-05 | El sistema exigirá un perfil completo antes de permitir una reserva. | Paciente | Alta | Plan P4 | Dado un paciente sin documento registrado, cuando intenta reservar, recibe `PERFIL_INCOMPLETO` y la interfaz lo lleva al perfil. |
| RF-06 | El sistema permitirá al paciente reservar una cita en una franja disponible. | Paciente | Alta | E §5.2, §5.3, §7.1 | Dado un paciente autenticado y una franja libre, cuando confirma la reserva, se crea una sola cita en estado `programada` y la franja deja de aparecer disponible. Si dos reservas llegan a la vez, solo una se confirma y la otra recibe `FRANJA_OCUPADA`. |
| RF-07 | El paciente podrá buscar franjas disponibles por especialidad, profesional y fecha. | Paciente | Alta | E §5.2 | Dada una especialidad y una fecha, la búsqueda devuelve solo franjas activas, futuras y sin cita activa, con fecha, hora, profesional y especialidad. Sin resultados, muestra el estado vacío. |
| RF-08 | El sistema consultará el catálogo de especialidades y profesionales activos. | Paciente, Admin | Alta | E §5.2 | Al abrir la búsqueda, se listan solo especialidades y profesionales con `activo = true`, con el nombre público del profesional. |
| RF-09 | El paciente podrá consultar "Mis citas" con fecha, hora, profesional, especialidad y estado. | Paciente | Alta | E §5.2 | Dado un paciente con citas, la vista muestra solo sus citas. Una consulta con el ID de una cita ajena no devuelve filas. |
| RF-10 | El profesional consultará únicamente su agenda. | Profesional | Alta | E §5.2, §7.1 | Al ingresar como profesional, la consulta no retorna citas asignadas a otro profesional; muestra fecha, hora, nombre y teléfono del paciente, motivo y estado. |
| RF-11 | El profesional cambiará el estado de sus citas siguiendo las transiciones válidas. | Profesional, Admin | Alta | E §5.2, §5.3; Plan P6 | Dada una cita propia `confirmada` cuya hora de inicio ya pasó, puede marcarla `atendida` o `no_asistio`. Una transición fuera de la tabla devuelve `TRANSICION_INVALIDA`; una cita de otro profesional devuelve `NO_AUTORIZADO`; marcar atendida antes de la hora devuelve `ANTES_DE_HORA`. |
| RF-12 | El paciente podrá cancelar sus citas futuras hasta 2 horas antes del inicio. | Paciente | Alta | E §5.2; Plan C4 | Dada una cita propia `programada` o `confirmada` que empieza en más de 2 h, al cancelar pasa a `cancelada`, se guarda `cancelled_at` y la franja vuelve a estar disponible. A menos de 2 h, recibe `FUERA_DE_PLAZO`. |
| RF-13 | El sistema registrará cada cambio de estado con el usuario y la fecha. | Sistema | Alta | E §5.3, §9 | Después de cualquier cambio de estado, existe una fila en `status_history` con estado anterior, estado nuevo, `changed_by = auth.uid()` y `changed_at`. Ningún usuario puede insertar ni editar el historial directamente. |
| RF-14 | El administrador podrá crear, editar, activar y desactivar especialidades. | Admin | Alta | E §5.2 | Dado un admin, cuando crea una especialidad con nombre único, aparece en el catálogo; al desactivarla deja de aparecer en la búsqueda del paciente. Un paciente o profesional que lo intente recibe rechazo de la RLS. |
| RF-15 | El administrador podrá promover un usuario registrado a profesional (con especialidad) o a admin, y activar o desactivar profesionales. | Admin | Alta | E §5.2; Plan P10 | Dado un usuario registrado, cuando el admin ejecuta `asignar_rol` con rol `profesional` y una especialidad, se actualiza el rol y se crea la fila en `professionals`. Si lo intenta un no admin, recibe `NO_AUTORIZADO`. |
| RF-16 | El administrador podrá generar franjas en bloque para un profesional, fecha y rango horario. | Admin | Alta | E §5.2; Plan C2, P3 | Dado un profesional, una fecha, 08:00–12:00 y 30 minutos, se crean 8 franjas. Si alguna se cruza con una franja activa existente del mismo profesional, la operación se rechaza con `HORARIO_SUPERPUESTO`. |
| RF-17 | El administrador podrá modificar o desactivar una franja solo si no tiene cita activa. | Admin | Alta | E §6.2; Plan P12 | Dada una franja con cita activa, cambiar su fecha u horas o desactivarla se rechaza. Sin cita activa, el cambio se guarda. |
| RF-18 | El administrador podrá consultar todas las citas y cambiar su estado o cancelarlas (cancelación institucional). | Admin | Media | E §5.1, §5.2 | Dado un admin, la vista de citas lista citas de todos los profesionales con filtros por fecha y estado; al cancelar, el historial registra al admin como autor. |
| RF-19 | El administrador consultará indicadores de citas por estado, especialidad y periodo. | Admin | Alta | E §5.2; Plan P11 | Dado un rango de fechas, `indicadores_citas` devuelve conteos agregados que coinciden con un conteo SQL directo sobre los mismos datos. Un no admin recibe `NO_AUTORIZADO`. |
| RF-20 | El sistema mostrará mensajes claros de éxito, error, validación y confirmación antes de acciones relevantes. | Todos | Alta | E §5.2, §8.2 | Cada código de error de las RPC se muestra como un mensaje en español comprensible. Reservar, cancelar y cambiar estado piden confirmación. Cada vista tiene estados de cargando, vacío, error, acceso denegado y éxito. |

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
