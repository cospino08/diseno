# Evidencia: pruebas de seguridad en Supabase

- **Fecha:** 29/10/2026
- **Proyecto:** `citas-medicas` (`oziwvgyddccfjxrcexnd`)
- **Script:** `sql/pruebas_seguridad.sql` (versión de la ronda 2, P2)
- **Ejecutado por:** coordinación, con la CLI de Supabase (`db query --linked`)
- **Resultado:** **72/72 PASA**
- **Sin efectos:** antes y después hay 1344 citas y 2685 filas de historial (incluye los datos de `datos_pruebas_especiales.sql`).

| Caso | Prueba | Esperado | Obtenido | Estado |
| --- | --- | --- | --- | --- |
| CP-19 | registro con {"rol": "admin"} en metadatos: el perfil queda paciente | paciente | paciente | PASA |
| CP-19 | el nombre sí se toma de los metadatos | Nuevo CP-19 | Nuevo CP-19 | PASA |
| CP-19 | el usuario nuevo tiene rol_actual() = paciente | paciente | paciente | PASA |
| CP-19 | con perfil incompleto no puede reservar (CP-21) | PERFIL_INCOMPLETO | PERFIL_INCOMPLETO | PASA |
| CP-02 | paciente1 reserva una franja libre | OK | OK | PASA |
| CP-02 | paciente2 intenta reservar la MISMA franja | FRANJA_OCUPADA | FRANJA_OCUPADA | PASA |
| CP-02 | la franja tiene exactamente 1 cita activa | 1 | 1 | PASA |
| CP-02 | la franja ya no aparece en franjas_disponibles | 0 | 0 | PASA |
| CP-03 | paciente1 lee la cita de paciente2 por su id (RLS la oculta) | 0 | 0 | PASA |
| CP-03 | paciente1 lee el historial de esa cita | 0 | 0 | PASA |
| CP-03 | paciente1 solo ve citas propias (ninguna ajena) | 0 | 0 | PASA |
| CP-03 | paciente1 solo ve su propio perfil | 1 | 1 | PASA |
| CP-03 | paciente1 cancela la cita ajena por RPC | NO_AUTORIZADO | NO_AUTORIZADO | PASA |
| CP-03 | paciente1 hace UPDATE directo de la cita ajena | 42501 | 42501 | PASA |
| CP-03 | paciente1 hace DELETE directo de la cita ajena | 42501 | 42501 | PASA |
| CP-03 | paciente1 inserta una cita a nombre de paciente2 | 42501 | 42501 | PASA |
| CP-03 | control positivo: paciente1 sí ve sus propias citas | mayor que 0 | mayor que 0 | PASA |
| CP-03 | control positivo: paciente2 sí ve su cita | 1 | 1 | PASA |
| CP-04 | profesional2 confirma una cita de profesional1 | NO_AUTORIZADO | NO_AUTORIZADO | PASA |
| CP-04 | profesional2 cancela una cita de profesional1 | NO_AUTORIZADO | NO_AUTORIZADO | PASA |
| CP-04 | profesional2 hace UPDATE directo de esa cita | 42501 | 42501 | PASA |
| CP-04 | profesional2 no ve la cita de profesional1 | 0 | 0 | PASA |
| CP-04 | profesional2 no ve citas de otros profesionales | 0 | 0 | PASA |
| CP-04 | profesional2 no puede leer perfiles de pacientes | 1 | 1 | PASA |
| CP-04 | control positivo: profesional1 sí confirma su cita | OK | OK | PASA |
| CP-04 | el historial registra a profesional1 como autor | 1 | 1 | PASA |
| CP-06 | paciente1: update profiles set rol = admin | 42501 | 42501 | PASA |
| CP-06 | paciente1: update profiles set activo | 42501 | 42501 | PASA |
| CP-06 | paciente1: insert en professionals | 42501 | 42501 | PASA |
| CP-06 | paciente1: rpc asignar_rol(a sí mismo, admin) | NO_AUTORIZADO | NO_AUTORIZADO | PASA |
| CP-06 | paciente1: rpc asignar_rol(a paciente2, admin) | NO_AUTORIZADO | NO_AUTORIZADO | PASA |
| CP-06 | paciente1: crear especialidad (solo admin) | 42501 o fila rechazada | 42501 o fila rechazada | PASA |
| CP-06 | paciente1 sigue siendo paciente | paciente | paciente | PASA |
| CP-06 | control positivo: paciente1 sí edita su teléfono | OK | OK | PASA |
| CP-06 | paciente2 (rol admin en metadatos del registro) quedó paciente | paciente | paciente | PASA |
| CP-06 | control positivo: admin sí puede asignar_rol | OK | OK | PASA |
| CP-06 | admin no puede cambiar su propio rol | NO_AUTORIZADO | NO_AUTORIZADO | PASA |
| CP-09 | paciente1 reserva la franja | OK | OK | PASA |
| CP-09 | paciente1 cancela (faltan más de 2 h) | OK | OK | PASA |
| CP-09 | la cita queda cancelada con fecha y autor | cancelada/paciente | cancelada/paciente | PASA |
| CP-09 | cancelar otra vez la misma cita | TRANSICION_INVALIDA | TRANSICION_INVALIDA | PASA |
| CP-09 | la franja vuelve a estar disponible | 1 | 1 | PASA |
| CP-09 | paciente2 reserva la misma franja | OK | OK | PASA |
| CP-09 | la franja conserva 2 citas: 1 cancelada y 1 activa | 2 | 2 | PASA |
| CP-09 | historial de la cita cancelada: creación + cancelación | 2 | 2 | PASA |
| CP-23 | al confirmar, el historial guarda programada→confirmada y changed_by = profesional1 | 1 | 1 | PASA |
| CP-23 | profesional1 hace UPDATE del historial | 42501 | 42501 | PASA |
| CP-23 | profesional1 hace DELETE del historial | 42501 | 42501 | PASA |
| CP-23 | paciente1 inserta una fila en status_history | 42501 | 42501 | PASA |
| CP-23 | ni el admin inserta en status_history | 42501 | 42501 | PASA |
| CP-23 | control positivo: paciente2 ve el historial de su cita | 2 | 2 | PASA |
| CP-07 | paciente1 reserva una franja pasada | FRANJA_PASADA | FRANJA_PASADA | PASA |
| CP-07 | paciente1 reserva una franja inexistente | FRANJA_NO_EXISTE | FRANJA_NO_EXISTE | PASA |
| CP-10 | profesional1 pasa una cita atendida a programada | TRANSICION_INVALIDA | TRANSICION_INVALIDA | PASA |
| CP-10 | profesional1 marca atendida una cita futura | TRANSICION_INVALIDA o ANTES_DE_HORA | TRANSICION_INVALIDA o ANTES_DE_HORA | PASA |
| CP-10 | confirmada → atendida antes de la hora de inicio | ANTES_DE_HORA | ANTES_DE_HORA | PASA |
| CP-11 | admin genera franjas que se cruzan con las existentes | HORARIO_SUPERPUESTO | HORARIO_SUPERPUESTO | PASA |
| CP-11 | admin inserta directo una franja que se cruza | HORARIO_SUPERPUESTO | HORARIO_SUPERPUESTO | PASA |
| CP-11 | control positivo: admin genera franjas en horario libre (19:00-20:00) | OK | OK | PASA |
| CP-12 | admin mueve una franja con cita activa | FRANJA_CON_CITA | FRANJA_CON_CITA | PASA |
| CP-12 | admin desactiva una franja con cita activa | FRANJA_CON_CITA | FRANJA_CON_CITA | PASA |
| CP-12 | control positivo: admin desactiva una franja libre | OK | OK | PASA |
| Admin | el admin ve todas las citas | 1344 | 1344 | PASA |
| CP-13 | anon: rpc reservar_cita | 42501 | 42501 | PASA |
| CP-13 | anon: rpc franjas_disponibles | 42501 | 42501 | PASA |
| CP-13 | anon: rpc indicadores_citas | 42501 | 42501 | PASA |
| CP-13 | anon: rpc asignar_rol | 42501 | 42501 | PASA |
| CP-13 | anon: rpc rol_actual | 42501 | 42501 | PASA |
| CP-13 | anon: select appointments | 42501 | 42501 | PASA |
| CP-13 | anon: select profiles | 42501 | 42501 | PASA |
| CP-13 | anon: select specialties | 42501 | 42501 | PASA |
| CP-13 | anon: insert specialties | 42501 | 42501 | PASA |
