# Estado del proyecto

Tablero compartido de los 4 agentes. Cada uno actualiza **solo su sección** al terminar cada
sesión. Para pedirle algo a otro agente, escríbelo en la sección **Pedidos** del dueño.

Ronda actual: **2**. Lo que falta, por agente: `docs/PENDIENTE.md`.

Supabase Project URL: `https://oziwvgyddccfjxrcexnd.supabase.co`
Configuración lista en `assets/js/config.js` (exporta `SUPABASE_URL` y `SUPABASE_ANON_KEY`, con la
clave publishable). **P4:** impórtala desde `assets/js/datos/cliente.js` y **no** pongas `config.js`
en `.gitignore`: GitHub Pages la necesita publicada. Nadie usa la `service_role`.

**Base de datos en Supabase (28/10/2026, coordinación):** ejecutados en el proyecto real, en orden,
`esquema.sql`, `politicas_rls.sql` y `datos_prueba.sql`, sin errores. `pruebas_seguridad.sql` da
**62/62 PASA en Supabase**. Las 5 cuentas demo existen y ya se puede iniciar sesión con ellas
(las contraseñas las tiene el coordinador, fuera del repo). El analizador de seguridad de Supabase
solo advierte que las RPC son ejecutables por `authenticated`, lo cual es intencional: cada una
valida el rol por dentro. **P3 y P4: ya pueden probar contra la base real.**

---

## P1: Análisis y documentación

Rama `p1/ronda2`.

**Hecho (ronda 1):** Fase 1 (`docs/analisis/`), Fase 2 (`docs/requisitos/`: RF-01..RF-21,
RNF-01..RNF-11, CU-01..CU-12), plan de pruebas (CP-01..CP-27) y trazabilidad. En `main`.

**Hecho (ronda 2, 29/10/2026):**

- `docs/analisis/05_investigacion.md`: integra la comparación de plataformas de P3 con el
  problema, los RF y las exclusiones. Incluye una aclaración sobre H3 (ver pedido a P3).
- `docs/trazabilidad.md` verificada contra el contrato v1.1, `sql/` y `assets/`. Nuevas
  columnas BD / Pantalla / Evidencia. **Todos los objetos de la base que nombra existen en
  `sql/`.** Corregidos los nombres que venían del plan (`trg_validar_cita`,
  `trg_historial_cita`, `ex_schedules_sin_cruce`, `trg_proteger_franja`).
- `docs/pruebas/plan_pruebas.md`: 10 CP en "Aprobado en BD" (62/62 en Supabase); resumen de
  ejecución; evidencias en `docs/pruebas/CP-XX.md`.
- `docs/pruebas/plantilla_evidencia.md`: formato obligatorio para todos.
- RNF-07: fuente WCAG 1.4.3 **verificada** (consultada el 29/10/2026). RNF-03 alineado con
  los 4 pasos del wireframe.
- `docs/documento_final.md`: borrador con las 18 secciones del entregable 1, que resumen y
  enlazan los documentos de cada agente.

**Pendiente:**

- Ronda 3: copiar resultados de las evidencias al plan de pruebas, marcar Pant./Evid. en la
  trazabilidad, completar el documento final (capturas, limitaciones, bibliografía técnica,
  integrantes) y `docs/sustentacion.md` en lo que toca a P1.

**Bloqueos:**

- Ninguno. Lo que falta depende de las pantallas de P3 y P4 y del PR #9 de P2 (CP-19, CP-23).

**Pedidos para P1:**

---

## P2: Base de datos y seguridad

**Hecho (ronda 1):**

- Contrato `docs/contrato_api.md` y SQL completo (`sql/`), fusionados en `main` (PR #3 y
  #8). El coordinador ejecutó los scripts en Supabase: **62/62 PASA**.

**Hecho (ronda 2, 29/10/2026, rama `p2/ronda2`):**

- Atendidos todos los pedidos de abajo (respuesta en cada uno).
- `sql/pruebas_seguridad.sql`: añadidos **CP-19** (rol falso en el registro, incluye CP-21 a
  nivel de base) y **CP-23** (historial automático y escritura directa). Ahora son **72
  comprobaciones**: 72/72 PASA en local, dos ejecuciones seguidas sin dejar cambios.
- Nuevo `sql/datos_pruebas_especiales.sql` (paso 3b, opcional): paciente con nombre
  `<img src=x onerror=alert(1)>` y una cita con la Dra. Gómez (CP-18), y un día de carga con
  500 citas de la Dra. Gómez a hoy + 90 días (CP-17). Se puede ejecutar sobre la base ya
  cargada; si se repite, no duplica nada. `mi_agenda` de ese día tarda **7 ms** en la base.
- **Verificado a través de la API:** PostgREST v12.2.3 (la versión de Supabase) en local con
  JWT de cada usuario. Los embebidos de `assets/js/datos/citas.js` funcionan tal cual, los
  errores llegan como `{ code: 'P0001', message: 'CODIGO', details }` y `anon` recibe HTTP 401
  con `42501`.
- Contrato **v1.2**: nombres de las FK para embeber y códigos HTTP reales. Sin cambios de
  nombres ni firmas.
- Revisé `docs/requisitos/`, `docs/trazabilidad.md` y `docs/pruebas/plan_pruebas.md` contra
  el contrato: las RPC, los códigos y las reglas (2 h, 31 días, 10-240 min, perfil completo)
  coinciden. No encontré diferencias.

**Pendiente:**

- ✅ _(coordinación)_ Scripts ejecutados en Supabase: 62/62 PASA.
- ✅ _(coordinación, 29/10)_ Ejecutados en Supabase `datos_pruebas_especiales.sql` y la nueva
  versión de `pruebas_seguridad.sql`: **72/72 PASA**. Evidencia en
  `docs/pruebas/evidencias/pruebas_seguridad_supabase_2026-10-29.md`.
- Pruebas desde el navegador (`docs/modelo_datos/pruebas_seguridad.md`, sección 2) cuando
  las páginas estén publicadas.

**Bloqueos:**

- Ninguno.

**Pedidos para P2** (todos atendidos el 29/10/2026):

- ✅ _(de P4)_ Parámetros, forma de lo que devuelve cada RPC y códigos de error →
  `docs/contrato_api.md` §3: tabla de parámetros con tipo y default, y columnas de salida
  de cada RPC. `mi_agenda` devuelve filas (§3.8) e `indicadores_citas` un JSON (§3.14).
  `assets/js/datos/` ya coincide con las firmas.
- ✅ _(de P4)_ Errores con el código al inicio → `error.message` es **exactamente** el
  código (`'FRANJA_OCUPADA'`, sin texto adicional); el detalle va en `error.details`.
  `PATRON_CODIGO_CONTRATO` de `respuesta.js` funciona; comprobado con PostgREST.
- ✅ _(de P4)_ `generar_franjas` traduce `exclusion_violation` a `HORARIO_SUPERPUESTO`, y el
  trigger de `schedules` usa `FRANJA_CON_CITA`. Un insert/update directo en `schedules` que
  se cruza también da `HORARIO_SUPERPUESTO` (lo adelanta el trigger).
- ✅ _(de P4)_ Una sola relación por tabla: `appointments` tiene una FK hacia `schedules`
  (`fk_appointments_schedule`, compuesta) y una hacia `professionals`
  (`appointments_professional_id_fkey`). `schedules(...)` y `professionals(...)` se embeben
  sin indicar la restricción; verificado con PostgREST v12 (contrato §2.5).
- ✅ _(de P4)_ `professionals` tiene `nombre_publico` y `registro_profesional`; el admin lee
  todos los `profiles` y todo `status_history` (contrato §2.1, §2.6; matriz de permisos).
- ✅ _(de P4)_ `indicadores_citas(p_desde, p_hasta, p_agrupacion)` devuelve `total`,
  `por_estado`, `por_especialidad` y `por_periodo`; `p_agrupacion` = `'dia'`, `'semana'` o
  `'mes'` (default `'mes'`).
- ✅ (P1) RF y CU contra el contrato: coinciden (ver "Hecho").
- ✅ (P1) Cuentas del plan de pruebas: las 5 cuentas demo ya existen. **`nuevo1@demo.test`
  no va en los scripts a propósito:** CP-19, CP-21 y CP-25 consisten justamente en
  registrar una cuenta nueva, así que se crea en la prueba, desde `registro.html`. Cualquier
  cuenta nueva queda con perfil incompleto. CP-17 y CP-18 → `sql/datos_pruebas_especiales.sql`
  (el día de carga tiene 500 citas en un solo día, como pide RNF-02).
- ✅ (P1) CP-19 y CP-23 incluidos en `sql/pruebas_seguridad.sql`.
- ✅ _(de P3)_ 1. `franjas_disponibles`: columnas exactamente las propuestas
  (`schedule_id, fecha, hora_inicio, hora_fin, professional_id, profesional, specialty_id,
  especialidad`); los tres parámetros aceptan `null`; `p_fecha = null` = próximos 30 días
  (§3.3). 2. "Mis citas": RPC `mis_citas()` con `cita_id, fecha, hora_inicio, hora_fin,
  estado, motivo, observaciones, profesional, especialidad, cancelado_por, created_at,
  cancelled_at, puede_cancelar` (§3.5). Si `cancelado_por` no es `'paciente'` →
  "Cancelada por la institución". 3. Filtro de profesionales: tabla `professionals`
  directamente (el paciente solo ve los activos), con `specialties(nombre)` embebido. No hay
  vistas `v_*`. 4. `profiles`: `id, email, nombres, documento, telefono, fecha_nacimiento,
  rol, activo, created_at`; `documento` es UNIQUE (`uq_profiles_documento`, error `23505`).
  5. Código al inicio: sí, `error.message` es el código exacto. 6. Trigger de P12:
  `FRANJA_CON_CITA`.

---

## P3: Interfaz, acceso y paciente

Rama `p3/interfaz`. Ronda 1 terminada y adelanté la base de la ronda 2 que no depende del
contrato.

**Hecho:**

- `docs/investigacion_plataformas.md`: comparación de Doctoralia y Zocdoc con 5 fuentes
  enlazadas (consultadas el 28/10/2026) y 10 hallazgos convertidos en decisiones de diseño.
  **Limitación:** la página de inicio de Zocdoc respondió HTTP 403 a la herramienta. Lo de
  Zocdoc sale de sus páginas oficiales de políticas, y los puntos sin confirmar están
  marcados "no verificado". Conviene que una persona los revise en el navegador.
- `docs/wireframes/`: inventario de las 17 pantallas, mapa de navegación por rol (Mermaid),
  wireframes ASCII a 360 px de acceso, paciente, profesional y admin (estos dos últimos en
  baja fidelidad para P4), los 5 estados de interfaz y el conteo de la reserva: **4 pasos**
  (máximo 5, RNF-03).
- `docs/wireframes/guia_estilos.html`: todos los componentes con datos ficticios
  (referencia para P4).
- `assets/css/` (`base.css`, `componentes.css` y `responsive.css`): mobile first, colores
  medidos contra WCAG AA, foco visible y tablas que pasan a tarjetas en móvil.
- `assets/js/ui/`: `mensajes.js`, `estados.js`, `dialogo.js`, `formato.js` y
  `formularios.js`, cada uno con su API documentada en la cabecera.
- `assets/js/validacion.js` y `assets/js/auth.js` (registro, inicio y cierre de sesión,
  recuperación, `protegerPagina` por rol, perfil completo obligatorio y sesión expirada).
- `index.html` (inicio de sesión y recuperación) y `registro.html`.
- Verificado en Chromium headless: sin desplazamiento horizontal a 360 px y a 1024 px,
  todos los controles con `label`, foco en el primer error, nombre con
  `<img onerror>` mostrado como texto y credenciales inválidas traducidas desde la
  respuesta real de Supabase Auth.

**Pendiente (ronda 2, cuando el contrato esté en main):**

- Vistas `paciente/`: inicio, buscar (`franjas_disponibles`), confirmar (`reservar_cita`,
  que recarga la disponibilidad si llega `FRANJA_OCUPADA`), mis citas con cancelación y
  perfil.
- Quitar el cliente temporal de `auth.js` cuando exista `assets/js/datos/cliente.js`.
- Pruebas CP-01, 05, 07, 08, 14, 16 y 18 con evidencia en `docs/pruebas/`.
- Probar registro, confirmación de correo y recuperación de punta a punta, cuando estén el
  SQL (trigger de perfiles) y la configuración de Auth.

**Bloqueos:**

- Sin `docs/contrato_api.md` no puedo programar buscar, reservar ni mis citas (ver los
  pedidos a P2).
- `profiles` aún no existe en Supabase: el inicio de sesión con una cuenta real fallará al
  leer el perfil hasta que se ejecute el SQL.

**Pedidos para P3:**

- _(de P4)_ El cliente ya existe: `import { supabase } from '<ruta>/assets/js/datos/cliente.js'`
  (PR #2). Para tablas y RPC usa mejor `datos/citas.js`, `catalogos.js` y `perfiles.js`:
  devuelven `{ data, error }` con `error.codigo` del contrato.
- _(de P4)_ Que `ui/mensajes.js` traduzca, además de los códigos de las RPC, estos códigos
  técnicos de `datos/respuesta.js`: `ERROR_RED`, `SESION_EXPIRADA`, `NO_AUTORIZADO`,
  `HORARIO_SUPERPUESTO`, `DUPLICADO`, `EN_USO`, `ERROR_DESCONOCIDO`.
- _(de P4)_ Para las páginas de `profesional/` y `admin/` necesito: una guarda por rol en
  `auth.js` (algo como `exigirRol('profesional')`), los estados de `ui/estados.js` y clases
  CSS para tabla, formulario, botón primario/secundario, insignia de estado de cita y
  diálogo de confirmación. Cuando estén, anota aquí su API y la uso tal cual.
- ✅ (P1) Comparación de plataformas: integrada desde `docs/investigacion_plataformas.md`.
- (P1, 29/10) En `docs/investigacion_plataformas.md`, hallazgo **H3**: dice que las 2 h de
  Zocdoc "coinciden con nuestra regla de cancelar hasta 2 h antes", pero tu propia tabla
  (fila "Anticipación mínima para reservar", F5) indica que ese valor es para **reservar**.
  Propuesta: "Zocdoc permite a la clínica fijar una anticipación mínima en horas (2 h por
  defecto para reservar). Nuestra regla de cancelar hasta 2 h antes es una decisión propia
  con la misma lógica de dar margen a la clínica". Ver `docs/analisis/05_investigacion.md`, 5.4.
- (P1) Para tus evidencias usa `docs/pruebas/plantilla_evidencia.md`, un archivo
  `docs/pruebas/CP-XX.md` por caso.
- (P1) Te asigné CP-20 (acceso por rol), CP-21 (perfil incompleto) y CP-26 (mensajes y
  estados), además de los del plan. Ver `docs/pruebas/plan_pruebas.md`.

---

## P4: Profesional, administración y despliegue

**Hecho (ronda 1, 28/10/2026):**

- PR #2 (`p4/esqueleto`): carpetas de la sección 11 con `.gitkeep`, `.gitignore` (no ignora
  `config.js`), `assets/js/config.example.js` y `assets/js/datos/cliente.js`.
- Rama `p4/datos`: `assets/js/datos/` con `respuesta.js` (normaliza errores a
  `{ codigo, detalle }`), `citas.js`, `catalogos.js`, `perfiles.js` e `indicadores.js`.
  Escrito contra la sección 7 del plan porque el contrato aún no existe.
- Rama `p4/arquitectura`: `docs/arquitectura/arquitectura.md` (diagramas Mermaid y
  responsabilidades) y README completo (instalación, SQL, credenciales de demo, GitHub Pages,
  decisiones técnicas y estado honesto de las funciones).

**Pendiente:**

- Ajustar `assets/js/datos/` a `docs/contrato_api.md` cuando P2 lo publique.
- Ronda 2: páginas de `profesional/` (agenda, detalle y cambio de estado) y `admin/`
  (resumen, especialidades, profesionales, horarios, citas, indicadores).
- Pruebas CP-10, CP-11, CP-12, CP-15 y CP-17 en `docs/pruebas/` (necesitan la base real).
- Completar en el README los nombres de los integrantes y la URL publicada.

**Bloqueos:**

- Las páginas de profesional/admin esperan el CSS, `ui/` y `auth.js` de P3, y el contrato y
  el SQL de P2.
- **Humano:** activar GitHub Pages (pasos en el README, sección "Despliegue") y crear las
  cuentas de demostración.

**Pedidos para P4:**

- ✅ (P1) Pantalla de pacientes: `admin/pacientes.html` (acordado en `docs/PENDIENTE.md`).
  No tiene wireframe en `docs/wireframes/profesional_admin.md`; si lo agregas, avísame.
- *(de P2, 29/10)* Sugerencias para `assets/js/datos/` (lo demás ya coincide con el contrato
  v1.2): (1) `listarMisCitas()` embebe `professionals`; para el paciente, la RLS oculta los
  profesionales inactivos y en citas antiguas `profesional` llegaría `null`. Mejor usar
  `supabase.rpc('mis_citas')`, que además ordena y trae `puede_cancelar` y `cancelado_por`.
  (2) `cambiarEstadoCita()` puede pasar `p_observaciones` (opcional). (3) Para el admin,
  `citas_admin(p_desde, p_hasta, p_profesional, p_estado)` trae los nombres del paciente
  y del profesional ya aplanados. (4) CP-17: con `sql/datos_pruebas_especiales.sql`, la
  agenda de profesional1 a hoy + 90 días tiene 500 citas.

- (P1) Te asigné CP-22 (agenda propia), CP-24 (especialidades), CP-25 (asignar rol) y CP-27
  (desactivar y anonimizar), además de los del plan.
- ✅ (P1) Arquitectura integrada desde `docs/arquitectura/arquitectura.md`.
- (P1, 29/10) En `docs/arquitectura/arquitectura.md`, sección 2, la fila "Funciones RPC" dice
  `sql/esquema.sql`, pero las 13 RPC están en `sql/politicas_rls.sql` (en `esquema.sql`
  están las tablas, restricciones y triggers). Además, la fila de GitHub Pages aún dice
  `https://<usuario>.github.io/diseno/`: la URL real es `https://cospino08.github.io/diseno/`.
- (P1) Para tus evidencias usa `docs/pruebas/plantilla_evidencia.md`, un archivo
  `docs/pruebas/CP-XX.md` por caso.
- *(de P3, 28/10)* En `assets/js/datos/cliente.js`, exporta el cliente con **nombre**:
  `export const supabase = createClient(...)`. `auth.js` también acepta `export default`,
  pero el nombre deja el código más claro. Mientras no exista, `auth.js` usa un cliente
  temporal.
- *(de P3)* Para tus páginas, reutiliza:
  - `protegerPagina({ roles: ['profesional'] })` o `['admin']`, de `assets/js/auth.js`.
    Muestra "Acceso denegado" y prepara el menú.
  - Los estados de `assets/js/ui/estados.js`, los mensajes de `ui/mensajes.js` y la
    confirmación de `ui/dialogo.js`.
  - La estructura del encabezado y del menú de `docs/wireframes/guia_estilos.html`.
  - Si te falta un componente CSS, pídelo aquí en vez de crear otro sistema de estilos.

---

## Pedidos para el coordinador (humano)

✅ _(coordinación, 28/10)_ Hechos los dos pedidos: Redirect URLs y contraseña mínima de 8.
GitHub Pages activo en `https://cospino08.github.io/diseno/`.
- ✅ _(coordinación, 29/10)_ Hecho: día de carga CP-17 = **2027-01-27** (500 citas de
  profesional1); cita CP-18 = 2026-10-30 08:00 con la Dra. Gómez; 72/72 PASA.
- *(de P2, 29/10)* En el SQL Editor de Supabase: (1) ejecutar `sql/datos_pruebas_especiales.sql`
  (no toca lo ya cargado) y anotar la fecha del "día de carga CP-17" que muestra al final;
  (2) ejecutar la nueva versión de `sql/pruebas_seguridad.sql` y confirmar **72/72 PASA**
  (guardar captura en `docs/pruebas/evidencias/`). Desde que existe ese paciente, la pantalla
  Authentication → Users debería seguir abriendo bien; si no, avisarme.

- *(de P3)* En Supabase, en **Authentication → URL Configuration**, agrega a *Redirect
  URLs* la URL de GitHub Pages (`https://cospino08.github.io/diseno/**`) y
  `http://localhost:8000/**`. Sin eso, los enlaces de confirmación y de recuperación de
  contraseña no vuelven al sitio.
- *(de P3)* En **Authentication → Providers → Email**, sube la longitud mínima de la
  contraseña a **8**, para que la base exija lo mismo que `validacion.js`.
