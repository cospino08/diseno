-- =============================================================================
-- reiniciar.sql  —  Borra TODO el modelo de la aplicación para reconstruirlo.
-- =============================================================================
-- Dueño: P2. Úselo para probar que la base se reconstruye desde cero con los
-- scripts (Hito 5, lista de verificación de la sección 17 del enunciado):
--
--   reiniciar.sql → esquema.sql → politicas_rls.sql → datos_prueba.sql
--
-- ¡CUIDADO! Borra todas las citas, franjas, profesionales y perfiles. No toca
-- las cuentas de demostración creadas a mano en Authentication (conservan su
-- contraseña): esquema.sql les vuelve a crear el perfil. Sí borra los usuarios
-- ficticios sin contraseña (*.ficticio*@demo.test) que crea datos_prueba.sql.
-- =============================================================================

begin;

drop trigger if exists trg_nuevo_usuario on auth.users;

-- cascade elimina también políticas, triggers, índices y restricciones.
drop table if exists
  public.status_history, public.appointments, public.schedules, public.professionals,
  public.specialties, public.transiciones_validas, public.profiles
cascade;

drop function if exists
  public.rol_actual, public.mi_profesional_id, public.ahora_local, public.hoy_local,
  public.franjas_disponibles, public.reservar_cita, public.mis_citas, public.cancelar_cita,
  public.cambiar_estado_cita, public.mi_agenda, public.citas_admin, public.generar_franjas,
  public.asignar_rol, public.cambiar_activo_perfil, public.anonimizar_paciente,
  public.indicadores_citas, public.tg_crear_perfil, public.tg_validar_cita,
  public.tg_historial_cita, public.tg_proteger_franja, public.tg_impedir_borrado;

drop type if exists public.estado_cita, public.rol_usuario;

delete from auth.users where email like '%.ficticio%@demo.test';

commit;
