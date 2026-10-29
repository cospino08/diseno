# 2. Matriz de actores

Responde a las secciones 5.1, 6.1 y 6.3 del enunciado. Los permisos aquí descritos son los
**funcionales**; la matriz técnica rol-recurso-operación (SELECT, INSERT, UPDATE, DELETE) la
elabora P2 junto con las políticas RLS.

## 2.1 Matriz

| Actor | Necesidad | Responsabilidad | Permisos | Dato utilizado | Decisión que apoya |
| --- | --- | --- | --- | --- | --- |
| **Paciente** | Encontrar una franja libre compatible con su horario y tener certeza de que la cita quedó registrada. | Mantener su perfil completo y veraz; cancelar con al menos 2 h de anticipación si no asistirá. | Leer y editar su perfil (excepto rol y estado activo). Consultar catálogos y franjas disponibles. Crear citas propias. Ver y cancelar solo sus citas. | Nombres, documento, teléfono, fecha de nacimiento, correo. Franjas libres (fecha, hora, profesional, especialidad). Estado de sus citas. | Qué día, hora y profesional elegir; si cancelar. |
| **Profesional de salud** | Conocer su agenda actualizada y registrar qué pasó con cada cita. | Confirmar las citas, marcar atendida o no asistió, y cancelar cuando no pueda atender. | Leer su perfil y su ficha profesional. Ver solo sus franjas y citas asignadas, con nombre y teléfono del paciente. Cambiar el estado de sus citas siguiendo las transiciones válidas. | Agenda (fecha, hora, paciente, motivo breve, estado). | A qué paciente llamar para confirmar; cómo organizar su día. |
| **Administrador / recepcionista** | Mantener catálogos y agendas correctos y conocer el comportamiento de la demanda. | Gestionar especialidades, profesionales y franjas; asignar roles; atender cancelaciones institucionales. Todas sus acciones quedan asociadas a su usuario. | Crear, editar, activar y desactivar especialidades, profesionales y franjas. Consultar y cambiar el estado de cualquier cita. Asignar roles. Consultar indicadores agregados. | Catálogos, franjas, citas, historial de estados, indicadores por estado, especialidad y periodo. | Cuántas franjas abrir por especialidad; detectar inasistencias y cancelaciones. |
| **Visitante (sin sesión)** | Saber qué ofrece la clínica y cómo registrarse. | Ninguna. | Ver la página de inicio, registrarse e iniciar sesión. Sin acceso a datos de la base ni a RPC. | Ninguno. | Si registrarse. |
| **Supabase Auth (actor de sistema)** | — | Autenticar, emitir la sesión (JWT) y disparar la creación del perfil. | Escribe en `auth.users`; el trigger crea `profiles` con rol `paciente`. | Correo y contraseña (nunca guardados por el equipo). | — |

## 2.2 Decisión sobre el actor "Administrador o recepcionista"

El enunciado agrupa administrador y recepcionista en un solo actor. En el MVP se mantienen
**en un solo rol (`admin`)** para no multiplicar políticas RLS. La diferencia entre ambos
(por ejemplo, que la recepcionista no asigne roles) queda como incremento futuro.

## 2.3 Conflictos entre actores y cómo se resuelven

| Conflicto | Actores | Resolución |
| --- | --- | --- |
| Dos pacientes quieren la misma franja al mismo tiempo. | Paciente – Paciente | Gana la primera transacción que se confirma; la otra recibe `FRANJA_OCUPADA` y la interfaz recarga la disponibilidad. |
| El profesional ya no puede atender una franja que tiene cita. | Profesional/Admin – Paciente | No se puede mover ni desactivar la franja con cita activa. El profesional o el admin cancela la cita (queda en el historial) y luego modifica la franja. |
| El paciente cancela muy cerca de la hora. | Paciente – Profesional | Regla de 2 h: después de ese plazo el paciente no puede cancelar desde el sistema; el profesional registra "no asistió" si no llega. |
| El profesional necesita datos del paciente, pero el paciente tiene derecho a su privacidad. | Profesional – Paciente | El profesional solo ve nombre, teléfono y motivo breve, y solo de sus citas (mínimo privilegio). |
| El admin puede ver todas las citas. | Admin – Paciente | Necesario para la operación; sus cambios de estado quedan registrados en `status_history` con `changed_by`. |
| Un paciente intenta darse permisos de admin. | Paciente – Sistema | El rol no es editable por el usuario; solo la RPC `asignar_rol` (ejecutada por un admin) lo cambia. |
