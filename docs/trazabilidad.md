# 9. Matriz de trazabilidad

Responde a la sección 12.1 del enunciado: necesidad → requisito → caso de uso → pantalla →
tabla o política → caso de prueba. **Cada requisito de prioridad alta llega a una prueba.**

> **Versión provisional (ronda 1).** Las tablas, RPC y códigos están alineados con
> `docs/contrato_api.md` v1.0 (P2, 28/10/2026). Las pantallas salen de la estructura de la
> sección 11 del plan; todavía no existen `sql/` ni el código de P3 y P4. Antes de la entrega,
> P1 verifica cada fila contra `sql/` y `assets/` y marca la columna "Verificado".

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
| N7 | Que cada usuario acceda solo a lo que le corresponde. | Sección 5.3 y 10 del enunciado |
| N8 | Datos para la toma de decisiones. | E5 |
| N9 | Catálogos vigentes de especialidades y profesionales. | Sección 5.2 del enunciado |

## 9.2 Matriz

| Necesidad | Requisito | Prioridad | Caso de uso | Pantalla | Tabla / RPC / política | Prueba | Verificado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N2, N7 | RF-01 Registro | Alta | CU-01 | `registro.html` | `auth.users`, trigger `tg_crear_perfil` → `profiles` (rol `paciente`) | CP-19 | ☐ |
| N7 | RF-02 Sesión y acceso por rol | Alta | CU-01 | `index.html`, guardas en `auth.js` | RPC `rol_actual`, RLS de todas las tablas | CP-20, CP-14 | ☐ |
| N3 | RF-03 Recuperación de contraseña | Media | CU-01 | `index.html` | Supabase Auth (`resetPasswordForEmail`) | — (prioridad media; verificación manual) | ☐ |
| N2, N7 | RF-04 Perfil | Alta | CU-02 | `paciente/perfil.html` | `profiles`; `grant update` por columnas; `uq_profiles_documento`, `ck_profiles_*` | CP-06 | ☐ |
| N2 | RF-05 Perfil completo para reservar | Alta | CU-02, CU-04 | `paciente/perfil.html`, `paciente/reservar.html` | RPC `reservar_cita` (`PERFIL_INCOMPLETO`) | CP-21 | ☐ |
| N1, N3 | RF-06 Reservar cita | Alta | CU-04 | `paciente/reservar.html` | `appointments`, índice `uq_franja_con_cita_activa`, RPC `reservar_cita` | CP-01, CP-02, CP-07, CP-09 | ☐ |
| N1, N3 | RF-07 Buscar disponibilidad | Alta | CU-03 | `paciente/buscar.html` | RPC `franjas_disponibles` | CP-01 | ☐ |
| N9 | RF-08 Catálogo | Alta | CU-03 | `paciente/buscar.html` | `specialties`, `professionals.nombre_publico` (RLS: solo activos para paciente) | CP-24 | ☐ |
| N3, N7 | RF-09 Mis citas | Alta | CU-05 | `paciente/mis-citas.html` | RPC `mis_citas`; `appointments` con política `select` por `patient_id = auth.uid()` | CP-03 | ☐ |
| N4, N7 | RF-10 Agenda propia | Alta | CU-06 | `profesional/agenda.html` | RPC `mi_agenda` | CP-22, CP-17 | ☐ |
| N4, N5 | RF-11 Cambio de estado | Alta | CU-07 | `profesional/cita.html` | RPC `cambiar_estado_cita`, `transiciones_validas`, trigger `tg_validar_estado` | CP-04, CP-10 | ☐ |
| N3, N5 | RF-12 Cancelar cita | Alta | CU-05 | `paciente/mis-citas.html` | RPC `cancelar_cita` (regla 2 h), índice parcial | CP-08, CP-09 | ☐ |
| N5 | RF-13 Historial de estados | Alta | CU-05, CU-07, CU-11 | `profesional/cita.html`, `admin/citas.html` | `status_history`, trigger `tg_validar_estado`, `revoke insert` | CP-23 | ☐ |
| N9 | RF-14 Especialidades | Alta | CU-09 | `admin/especialidades.html` | `specialties` (RLS: escritura solo admin), `uq_specialties_nombre` | CP-24 | ☐ |
| N7, N9 | RF-15 Profesionales y roles | Alta | CU-09 | `admin/profesionales.html` | RPC `asignar_rol`, `professionals` (update solo admin) | CP-25 | ☐ |
| N1 | RF-16 Generar franjas | Alta | CU-08 | `admin/horarios.html` | RPC `generar_franjas`, restricción `exclude using gist` en `schedules` | CP-11 | ☐ |
| N6 | RF-17 Modificar franja sin cita activa | Alta | CU-08 | `admin/horarios.html` | Trigger de `schedules` (`FRANJA_CON_CITA`) | CP-12 | ☐ |
| N5, N7 | RF-18 Gestionar todas las citas | Media | CU-11 | `admin/citas.html` | RPC `citas_admin`, `cambiar_estado_cita`, `cancelar_cita` (rol admin) | CP-23 | ☐ |
| N8 | RF-19 Indicadores | Alta | CU-10 | `admin/indicadores.html`, `admin/resumen.html` | RPC `indicadores_citas` | CP-15 | ☐ |
| N3 | RF-20 Mensajes y estados de interfaz | Alta | Todos | Todas | `assets/js/ui/mensajes.js` (códigos de la sección 4 del contrato), `assets/js/ui/estados.js` | CP-26 | ☐ |
| N2, N7 | RF-21 Gestionar pacientes | Alta | CU-12 | `admin/pacientes.html` (nombre por confirmar con P4) | RPC `cambiar_activo_perfil`, `anonimizar_paciente`, `rol_actual` | CP-27 | ☐ |

## 9.3 Requisitos no funcionales

| RNF | Implementación esperada | Prueba | Verificado |
| --- | --- | --- | --- |
| RNF-01 Seguridad RLS | `sql/politicas_rls.sql` | CP-03, CP-04, CP-06, CP-13 | ☐ |
| RNF-02 Rendimiento | `mi_agenda` + índices de `appointments` | CP-17 | ☐ |
| RNF-03 Usabilidad | Flujo buscar → reservar | CP-16 | ☐ |
| RNF-04 Compatibilidad | `assets/css/responsive.css` | CP-05 | ☐ |
| RNF-05 Sin secretos | `assets/js/config.js` (solo `anon`), `revoke execute` en RPC | CP-13 | ☐ |
| RNF-06 Sin `innerHTML` | Módulos de `assets/js/ui/` | CP-18 | ☐ |
| RNF-07 Accesibilidad | HTML semántico y `label` | CP-16 | ☐ |
| RNF-08 Reglas en la base | Restricciones, triggers y RPC | CP-02, CP-07, CP-08, CP-10, CP-11, CP-12 | ☐ |
| RNF-09 Mantenibilidad | `assets/js/datos/`, scripts de `sql/` | Revisión de código y reconstrucción | ☐ |
| RNF-10 Disponibilidad | GitHub Pages, `onAuthStateChange` | CP-14 | ☐ |
| RNF-11 Privacidad | Diccionario de datos, `motivo` ≤ 200 | Revisión del diccionario | ☐ |

## 9.4 Comprobación de cobertura

- Requisitos funcionales de prioridad alta: 19. Con prueba asignada: 19.
- Requisitos de prioridad media sin prueba propia: RF-03 (verificación manual). RF-18 se
  cubre con CP-23.
- Casos de prueba sin requisito: ninguno.
