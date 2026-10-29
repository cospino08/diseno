# 9. Matriz de trazabilidad

Responde a la sección 12.1 del enunciado: necesidad → requisito → caso de uso → pantalla →
tabla o política → caso de prueba. **Cada requisito de prioridad alta llega a una prueba.**

> **Versión de la ronda 2 (29/10/2026).** Verificada contra `docs/contrato_api.md` v1.1,
> `sql/esquema.sql`, `sql/politicas_rls.sql`, `sql/pruebas_seguridad.sql` y los archivos de
> `assets/` e `*.html` que existen en `main`. Las vistas de `paciente/`, `profesional/` y
> `admin/` todavía no existen (ronda 2 de P3 y P4).

**Columnas de verificación:**

- **BD:** ✅ el objeto nombrado existe en `sql/` con ese nombre; ☐ todavía no.
- **Pant.:** ✅ el archivo de la pantalla existe en `main`; ☐ todavía no.
- **Evid.:** estado de la prueba. **SQL** = pasa en `sql/pruebas_seguridad.sql` ejecutado en
  Supabase (62/62 PASA, 28/10/2026, coordinación), pero falta la evidencia desde el navegador
  en `docs/pruebas/`; ✅ = evidencia completa; ☐ = sin ejecutar.

## 9.1 Necesidades

Cada necesidad sale del árbol de problema (`docs/analisis/01_ficha_problema.md`, 1.4).

| ID | Necesidad | Causa / efecto que atiende |
| --- | --- | --- |
| N1 | Evitar cruces de horario y reservas dobles. | C1, C2, E1 |
| N2 | Identificar a cada paciente de forma única. | C3, E2 |
| N3 | Que el paciente reserve y tenga confirmación sin llamar. | E3 |
| N4 | Que el profesional conozca su agenda y registre la atención. | C4, E4 |
| N5 | Estados de cita definidos y auditables. | C5, E5 |
| N6 | Que los cambios de horario no afecten citas existentes. | C6, E6 |
| N7 | Que cada usuario acceda solo a lo que le corresponde. | Secciones 5.3 y 10 del enunciado |
| N8 | Datos para la toma de decisiones. | E5 |
| N9 | Catálogos vigentes de especialidades y profesionales. | Sección 5.2 del enunciado |

## 9.2 Matriz

Las pantallas usan los ID de `docs/wireframes/README.md` (A-, P-, R-, D-).

| Necesidad | Requisito | Prior. | CU | Pantalla | Tabla / RPC / política (nombres reales) | Prueba | BD | Pant. | Evid. |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| N2, N7 | RF-01 Registro | Alta | CU-01 | A-02 `registro.html` | `auth.users` → trigger `trg_nuevo_usuario` (`tg_crear_perfil`) → `profiles` con rol `paciente` | CP-19 | ✅ | ✅ | ☐ |
| N7 | RF-02 Sesión y acceso por rol | Alta | CU-01 | A-01 `index.html`; `protegerPagina` en `assets/js/auth.js` | RPC `rol_actual`; RLS en todas las tablas | CP-20, CP-14 | ✅ | ✅ | ☐ |
| N3 | RF-03 Recuperación de contraseña | Media | CU-01 | A-03 `index.html#recuperar` | Supabase Auth: `resetPasswordForEmail`, `updateUser` (`enviarRecuperacion`, `cambiarContrasena` en `auth.js`) | Verificación manual | — | ✅ | ☐ |
| N2, N7 | RF-04 Perfil | Alta | CU-02 | P-05 `paciente/perfil.html` | `profiles`; `grant update (nombres, documento, telefono, fecha_nacimiento)`; política `profiles_update_propio_o_admin`; `uq_profiles_documento`; `ck_profiles_*` | CP-06 | ✅ | ☐ | SQL |
| N2 | RF-05 Perfil completo para reservar | Alta | CU-02, CU-04 | P-05, P-03 | RPC `reservar_cita` (`PERFIL_INCOMPLETO`); `perfilCompleto` en `auth.js` | CP-21 | ✅ | ☐ | ☐ |
| N1, N3 | RF-06 Reservar cita | Alta | CU-04 | P-03 `paciente/reservar.html` | `appointments`; índice `uq_franja_con_cita_activa`; RPC `reservar_cita` | CP-01, CP-02, CP-07, CP-09 | ✅ | ☐ | SQL (CP-02, 07, 09); ☐ CP-01 |
| N1, N3 | RF-07 Buscar disponibilidad | Alta | CU-03 | P-02 `paciente/buscar.html` | RPC `franjas_disponibles` | CP-01 | ✅ | ☐ | ☐ |
| N9 | RF-08 Catálogo | Alta | CU-03 | P-02 | `specialties` (política `specialties_select_activas_o_admin`); `professionals.nombre_publico` (política `professionals_select_activos_propio_o_admin`) | CP-24 | ✅ | ☐ | ☐ |
| N3, N7 | RF-09 Mis citas | Alta | CU-05 | P-04 `paciente/mis-citas.html` | RPC `mis_citas`; política `appointments_select_paciente_profesional_admin` | CP-03 | ✅ | ☐ | SQL |
| N4, N7 | RF-10 Agenda propia | Alta | CU-06 | R-01 `profesional/agenda.html` | RPC `mi_agenda`; índice `idx_appointments_professional` | CP-22, CP-17 | ✅ | ☐ | ☐ |
| N4, N5 | RF-11 Cambio de estado | Alta | CU-07 | R-02 `profesional/cita.html` | RPC `cambiar_estado_cita`; tabla `transiciones_validas`; trigger `trg_validar_cita` | CP-04, CP-10 | ✅ | ☐ | SQL |
| N3, N5 | RF-12 Cancelar cita | Alta | CU-05 | P-04 | RPC `cancelar_cita` (regla de 2 h); índice `uq_franja_con_cita_activa` | CP-08, CP-09 | ✅ | ☐ | SQL (CP-09); ☐ CP-08 |
| N5 | RF-13 Historial de estados | Alta | CU-05, CU-07, CU-11 | R-02, D-05 | `status_history`; trigger `trg_historial_cita`; sin permisos de escritura (`revoke all` + `grant select`); trigger `trg_no_borrar_historial` | CP-23 | ✅ | ☐ | ☐ |
| N9 | RF-14 Especialidades | Alta | CU-09 | D-02 `admin/especialidades.html` | `specialties`; políticas `specialties_insert_admin`, `specialties_update_admin`; `uq_specialties_nombre` | CP-24 | ✅ | ☐ | ☐ |
| N7, N9 | RF-15 Profesionales y roles | Alta | CU-09 | D-03 `admin/profesionales.html` | RPC `asignar_rol`; política `professionals_update_admin` | CP-25 | ✅ | ☐ | ☐ |
| N1 | RF-16 Generar franjas | Alta | CU-08 | D-04 `admin/horarios.html` | RPC `generar_franjas`; restricción `ex_schedules_sin_cruce`; trigger `trg_proteger_franja` (`HORARIO_SUPERPUESTO`) | CP-11 | ✅ | ☐ | SQL |
| N6 | RF-17 Modificar franja sin cita activa | Alta | CU-08 | D-04 | Trigger `trg_proteger_franja` (`FRANJA_CON_CITA`); política `schedules_update_admin` | CP-12 | ✅ | ☐ | SQL |
| N5, N7 | RF-18 Gestionar todas las citas | Media | CU-11 | D-05 `admin/citas.html` | RPC `citas_admin`, `cambiar_estado_cita`, `cancelar_cita` | CP-23 | ✅ | ☐ | ☐ |
| N8 | RF-19 Indicadores | Alta | CU-10 | D-01 `admin/resumen.html`, D-06 `admin/indicadores.html` | RPC `indicadores_citas` | CP-15 | ✅ | ☐ | ☐ |
| N3 | RF-20 Mensajes y estados de interfaz | Alta | Todos | Todas | `assets/js/ui/mensajes.js` (`MENSAJES`, `mensajeDeError`), `assets/js/ui/estados.js`, `assets/js/ui/dialogo.js` | CP-26 | — | ✅ (módulos) | ☐ |
| N2, N7 | RF-21 Gestionar pacientes | Alta | CU-12 | `admin/pacientes.html` (nombre acordado con P4 en `PENDIENTE.md`; no tiene wireframe) | RPC `cambiar_activo_perfil`, `anonimizar_paciente`, `rol_actual` | CP-27 | ✅ | ☐ | ☐ |

## 9.3 Requisitos no funcionales

| RNF | Implementación | Prueba | Verificado |
| --- | --- | --- | --- |
| RNF-01 Seguridad RLS | `enable row level security` en todas las tablas de `sql/politicas_rls.sql`; 13 políticas | CP-03, CP-04, CP-06, CP-13 | ✅ BD · SQL |
| RNF-02 Rendimiento | RPC `mi_agenda` + índices `idx_appointments_professional`, `idx_schedules_profesional_fecha` | CP-17 | ✅ BD · ☐ (P2 midió 7 ms en la base local, PR #9; falta medir en el navegador) |
| RNF-03 Usabilidad | Flujo de 4 pasos en `docs/wireframes/README.md`, sección 3 | CP-16 | ✅ diseño · ☐ |
| RNF-04 Compatibilidad | `assets/css/responsive.css` | CP-05 | ✅ archivo · ☐ (P3 lo revisó en Chromium headless a 360 px para A-01 y A-02) |
| RNF-05 Sin secretos | `assets/js/config.js` solo con URL y clave publishable; `revoke execute ... from public, anon` en las 13 RPC | CP-13 | ✅ BD · SQL |
| RNF-06 Sin `innerHTML` | `assets/js/ui/`: ninguna asignación a `innerHTML` (la única mención es un comentario en `estados.js`) | CP-18 | ✅ código actual · ☐ |
| RNF-07 Accesibilidad | HTML semántico y `label` en `index.html` y `registro.html`; contraste medido por P3 | CP-16 | ✅ acceso · ☐ resto |
| RNF-08 Reglas en la base | Restricciones, triggers y RPC (ver 9.2) | CP-02, CP-07, CP-08, CP-10, CP-11, CP-12 | ✅ BD · SQL (excepto CP-08) |
| RNF-09 Mantenibilidad | `assets/js/datos/` (único lugar que llama a Supabase); `sql/README.md` con el orden de ejecución | Revisión de código y reconstrucción | ✅ estructura · ☐ reconstrucción en proyecto nuevo |
| RNF-10 Disponibilidad | GitHub Pages activo; `onAuthStateChange` y `manejarSesionExpirada` en `auth.js` | CP-14 | ✅ código · ☐ |
| RNF-11 Privacidad | Diccionario de datos sin campos clínicos; `motivo` ≤ 200 (rechazo, no recorte) | Revisión del diccionario | ✅ |

## 9.4 Comprobación de cobertura

- Requisitos funcionales de prioridad alta: 19. Con prueba asignada: 19.
- Requisitos de prioridad media sin prueba propia: RF-03 (verificación manual). RF-18 se
  cubre con CP-23.
- Casos de prueba sin requisito: ninguno.
- Objetos de la base nombrados en la matriz que no existen en `sql/`: **ninguno**.
- Diferencias corregidas en esta ronda respecto a los nombres del plan: el trigger de
  validación es `trg_validar_cita` (no `tg_validar_estado`), el historial lo escribe un
  trigger aparte (`trg_historial_cita`), la exclusión de cruces es `ex_schedules_sin_cruce`
  y `status_history` se protege con `revoke all` en lugar de `revoke insert`.

## 9.5 Pendiente para cerrar la trazabilidad (ronda 3)

1. Pantallas de `paciente/`, `profesional/` y `admin/` en `main` (P3 y P4).
2. Evidencias `docs/pruebas/CP-XX.md` con el formato de
   [`pruebas/plantilla_evidencia.md`](pruebas/plantilla_evidencia.md).
3. CP-19 y CP-23 en `sql/pruebas_seguridad.sql`: están en el PR #9 de P2, todavía sin fusionar.
