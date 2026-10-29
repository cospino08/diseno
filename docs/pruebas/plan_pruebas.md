# 8. Plan de pruebas consolidado

Responde a la sección 12 del enunciado (mínimo 15 casos que cubran funcionalidad, reglas de
negocio, seguridad, usabilidad y responsive). Parte de los 18 casos de la sección 8 del plan
de trabajo (CP-01 a CP-18) y agrega CP-19 a CP-27 para que **todo requisito de prioridad alta
llegue a una prueba** (sección 12.1).

## 8.1 Cómo se ejecuta y registra

- **Cuentas de prueba** (ficticias, definidas en `sql/datos_prueba.sql` por P2):
  `paciente1@demo.test`, `paciente2@demo.test`, `profesional1@demo.test`,
  `profesional2@demo.test`, `admin@demo.test`. Las contraseñas **no** se escriben aquí; se
  entregan en el README de demostración.
- **Pruebas de seguridad:** se ejecutan desde la consola del navegador con el cliente
  `supabase` ya autenticado, saltando la interfaz, para comprobar que quien bloquea es la base
  de datos y no el JavaScript.
- **Evidencia:** cada ejecución deja una captura en `docs/pruebas/evidencias/CP-XX.png` y se
  completan las columnas "Resultado obtenido" y "Estado".
- **Estados posibles:** Pendiente, Aprobado, Fallido (con referencia al issue o PR de la
  corrección), Bloqueado (falta una dependencia).

## 8.2 Casos de prueba

| ID | Tipo | Escenario | Requisito | Datos usados | Resultado esperado | Resultado obtenido | Estado | Resp. |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CP-01 | Funcional | Paciente reserva una franja libre. | RF-06, RF-07 | paciente1, franja futura libre de profesional1 | Se crea una única cita `programada` y la franja desaparece de la búsqueda. | | Pendiente | P3 |
| CP-02 | Regla / concurrencia | Dos sesiones reservan la misma franja a la vez (dos navegadores o `Promise.all`). | RF-06, RNF-08 | paciente1 y paciente2, misma franja | Solo una se confirma; la otra recibe `FRANJA_OCUPADA`. Existe una sola cita activa en la franja. | | Pendiente | P2 |
| CP-03 | Seguridad | Paciente consulta `appointments` con el ID de una cita ajena. | RF-09, RNF-01 | paciente1, ID de una cita de paciente2 | La consulta devuelve 0 filas. | | Pendiente | P2 |
| CP-04 | Seguridad | Profesional intenta cambiar el estado de una cita de otro profesional. | RF-11, RNF-01 | profesional1, cita de profesional2 | `NO_AUTORIZADO`; la cita no cambia. | | Pendiente | P2 |
| CP-05 | Responsive | Vistas principales en 360 px de ancho. | RNF-04 | Modo dispositivo del navegador, 360 × 740 | Sin desplazamiento horizontal; todos los controles se pueden usar. | | Pendiente | P3 |
| CP-06 | Seguridad | Paciente ejecuta `update profiles set rol='admin'` desde la consola. | RF-04, RNF-01 | paciente1 | Error `42501`; el rol sigue en `paciente`. | | Pendiente | P2 |
| CP-07 | Regla | Paciente reserva una franja pasada. | RF-06, RNF-08 | paciente1, franja de ayer | `FRANJA_PASADA`; no se crea cita. | | Pendiente | P3 |
| CP-08 | Regla | Paciente cancela a menos de 2 h del inicio. | RF-12 | paciente1, cita que empieza en 1 h | `FUERA_DE_PLAZO`; la cita no cambia. | | Pendiente | P3 |
| CP-09 | Regla | Cancelar y volver a reservar la misma franja. | RF-12, RF-06 | paciente1 cancela; paciente2 reserva | La segunda reserva se acepta; la cita anterior queda `cancelada`. | | Pendiente | P2 |
| CP-10 | Regla | Pasar una cita de `atendida` a `programada`. | RF-11 | profesional1, cita atendida propia | `TRANSICION_INVALIDA`. | | Pendiente | P4 |
| CP-11 | Regla | Admin genera franjas que se cruzan para el mismo profesional. | RF-16 | admin, profesional1, rango ya publicado | `HORARIO_SUPERPUESTO`; no se crea ninguna franja nueva. | | Pendiente | P4 |
| CP-12 | Regla | Admin intenta mover o desactivar una franja con cita activa. | RF-17 | admin, franja con cita `programada` | `FRANJA_CON_CITA`; la franja no cambia. | | Pendiente | P4 |
| CP-13 | Seguridad | Usuario sin sesión llama a una RPC (`reservar_cita`, `indicadores_citas`). | RNF-01, RNF-05 | Cliente con solo la clave `anon` | Error `42501`; no se devuelven datos. | | Pendiente | P2 |
| CP-14 | Disponibilidad | La sesión expira en mitad de una reserva. | RNF-10 | paciente1; cerrar sesión en otra pestaña | Redirige al inicio de sesión con un mensaje. | | Pendiente | P3 |
| CP-15 | Funcional | Los indicadores coinciden con conteos SQL de los datos de prueba. | RF-19 | admin, rango del mes de prueba | Totales por estado, especialidad y periodo iguales a la consulta SQL directa. | | Pendiente | P4 |
| CP-16 | Usabilidad / accesibilidad | Reserva completa después de iniciar sesión, primero con ratón y luego solo con teclado. | RNF-03, RNF-07 | paciente1 con perfil completo | ≤ 5 pasos; el recorrido con teclado se completa y el foco es visible. | | Pendiente | P3 |
| CP-17 | Rendimiento | Agenda de un día con 500 citas de prueba. | RNF-02, RF-10 | profesional1, 500 citas generadas | Carga en ≤ 3 s (promedio de 3 mediciones). | | Pendiente | P4 |
| CP-18 | Seguridad (XSS) | Nombre de paciente con `<img src=x onerror=alert(1)>`. | RNF-06 | paciente con ese nombre, vista del profesional y del admin | Se muestra como texto; no se ejecuta código. | | Pendiente | P3 |
| CP-19 | Seguridad | Registro enviando `rol: 'admin'` en los metadatos. | RF-01 | Correo nuevo `nuevo1@demo.test` | El perfil se crea con rol `paciente`. | | Pendiente | P2 |
| CP-20 | Funcional / seguridad | Inicio de sesión por rol y acceso a una página de otro rol. | RF-02 | paciente1 abre `admin/resumen.html` | Cada rol llega a su inicio; el paciente ve "acceso denegado" y no se cargan datos. | | Pendiente | P3 |
| CP-21 | Regla | Reserva con perfil incompleto. | RF-05 | Usuario nuevo sin documento, teléfono ni fecha de nacimiento | `PERFIL_INCOMPLETO`; la interfaz abre el perfil. | | Pendiente | P3 |
| CP-22 | Seguridad | Profesional consulta su agenda; un paciente llama a `mi_agenda`. | RF-10 | profesional1; paciente1 | Solo aparecen citas de profesional1; el paciente recibe `NO_AUTORIZADO`. | | Pendiente | P4 |
| CP-23 | Auditoría | Cambio de estado e intento de insertar historial directamente. | RF-13 | profesional1 confirma una cita; paciente1 inserta en `status_history` | Existe la fila del historial con `changed_by` = profesional1; la inserción directa es rechazada (`42501`). | | Pendiente | P2 |
| CP-24 | Funcional / seguridad | Admin crea y desactiva una especialidad; un paciente intenta crear una. | RF-14, RF-08 | admin; paciente1 | La especialidad desactivada no aparece en la búsqueda; el insert del paciente es rechazado. | | Pendiente | P4 |
| CP-25 | Funcional / seguridad | Admin promueve un usuario a profesional; un paciente intenta lo mismo. | RF-15 | admin, `nuevo1@demo.test`; paciente1 | Se crea la fila en `professionals`; el paciente recibe `NO_AUTORIZADO`. | | Pendiente | P4 |
| CP-26 | Usabilidad | Mensajes y estados de interfaz. | RF-20 | Forzar cada código de error, lista vacía y red desconectada | Cada código se muestra en español claro; hay confirmación antes de reservar, cancelar y cambiar estado; se ven los estados cargando, vacío, error y éxito. | | Pendiente | P3 |
| CP-27 | Funcional / seguridad | Admin desactiva y luego anonimiza a un paciente. | RF-21 | admin; paciente2 con una cita futura | Desactivado: `rol_actual()` devuelve `null` y `reservar_cita` es rechazada. Anonimizado: nombres = "Paciente anonimizado", documento y teléfono vacíos, la cita futura queda `cancelada` y sigue existiendo. | | Pendiente | P4 |

## 8.3 Cobertura por tipo

| Tipo exigido (E §12) | Casos |
| --- | --- |
| Funcionalidad | CP-01, CP-15, CP-20, CP-24, CP-25, CP-27 |
| Reglas de negocio | CP-02, CP-07, CP-08, CP-09, CP-10, CP-11, CP-12, CP-21 |
| Seguridad | CP-03, CP-04, CP-06, CP-13, CP-18, CP-19, CP-22, CP-23 |
| Usabilidad básica | CP-16, CP-26 |
| Responsive | CP-05 |
| Rendimiento y disponibilidad | CP-14, CP-17 |
