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
- ✅ *(de P3, 28/10)* Columnas de `franjas_disponibles`, `mis_citas`, profesionales, `profiles`,
  códigos al inicio del mensaje y `FRANJA_CON_CITA`: resuelto por el contrato v1.1. Gracias.

---

## P3: Interfaz, acceso y paciente

Rama `p3/ronda2` (desde `origin/main` el 29/10). La ronda 1 (`p3/interfaz`) ya está en `main`.

**Hecho (ronda 2, 29/10/2026):**

- `auth.js` importa el cliente desde `assets/js/datos/cliente.js`; se quitó el temporal. Si la
  base responde "sesión expirada", ahora se olvida la sesión local antes de ir al inicio de
  sesión (antes `index.html` podía devolver al usuario a la página privada).
- `ui/mensajes.js` acepta también los errores de `datos/respuesta.js` (`{ codigo, detalle }`)
  y traduce **todos** los códigos del contrato v1.1 (4.2), los técnicos de P4 (`ERROR_RED`,
  `DUPLICADO`, `EN_USO`, `ERROR_DESCONOCIDO`…) y `23505` de `uq_profiles_documento`
  ("Ese número de documento ya está registrado en otra cuenta").
- `validacion.js` igualado a los CHECK de `profiles` (documento 4 a 20; teléfono máximo 20).
- Vistas del paciente en `paciente/`: `index.html` (P-01), `buscar.html` (P-02,
  `franjas_disponibles`), `reservar.html` (P-03, `reservar_cita`; ante `FRANJA_OCUPADA`,
  `FRANJA_PASADA` o `FRANJA_NO_EXISTE` vuelve a buscar, avisa y recarga), `mis-citas.html`
  (P-04, `mis_citas` y `cancelar_cita` con diálogo; "Cancelada por la institución" con
  `cancelado_por`) y `perfil.html` (P-05). Reserva en **4 pasos** después de iniciar sesión.
- Pruebas en `docs/pruebas/`: CP-01, 05, 07, 08, 14, 16, 18, 20, 21 y 26, con capturas en
  `docs/pruebas/capturas/`, en el formato de `plantilla_evidencia.md` de P1. **Ojo:** la
  ejecución 1 es de la interfaz con respuestas de Supabase **simuladas** según el contrato
  (57/57 comprobaciones); la ejecución 2 contra la base real queda **pendiente** y cada ficha
  trae los pasos.

**Pendiente:**

- Ejecución 2 de mis 10 casos en `https://cospino08.github.io/diseno/` con las cuentas demo
  (la hace una persona: los agentes no tienen las contraseñas).
- Probar registro, confirmación de correo y recuperación de contraseña de punta a punta.
- Cuando P4 agregue `misCitas()` a `datos/citas.js`, usarla en `paciente/comun.js` (TODO
  marcado).
- Ronda 3: CP-05, CP-18 y CP-20 en las vistas de `profesional/` y `admin/` de P4, y revisión
  de accesibilidad y 360 px de **todas** las pantallas.

**Bloqueos:**

- Ninguno para el código. Las ejecuciones contra la base real dependen de una persona con
  las contraseñas demo.

**Pedidos para P3:**

- ✅ _(de P4)_ Importar el cliente desde `datos/cliente.js` y usar `datos/`: hecho. Las vistas
  usan `franjasDisponibles`, `reservarCita`, `cancelarCita`, `listarEspecialidades`,
  `listarProfesionales` y `actualizarMiPerfil`.
- ✅ _(de P4)_ Traducir `ERROR_RED`, `SESION_EXPIRADA`, `NO_AUTORIZADO`,
  `HORARIO_SUPERPUESTO`, `DUPLICADO`, `EN_USO`, `ERROR_DESCONOCIDO`: hecho. Puedes pasar el
  `error` de tus funciones directo a `mostrarError(zona, error)` o `mensajeDeError(error)`.
- ✅ _(de P4)_ Guarda por rol, estados, clases CSS y diálogo: ya estaban en `main` (API en la
  sección de P4, abajo, y en `docs/wireframes/guia_estilos.html`).
- ✅ (P1) Comparación de plataformas: está en `docs/investigacion_plataformas.md`.
- ✅ (P1) CP-20, CP-21 y CP-26: documentados (CP-20 parcial: falta el caso con
  `admin/resumen.html`, que es de P4).
- (P1, 29/10) En `docs/investigacion_plataformas.md`, hallazgo **H3**: dice que las 2 h de
  Zocdoc "coinciden con nuestra regla de cancelar hasta 2 h antes", pero tu propia tabla
  (fila "Anticipación mínima para reservar", F5) indica que ese valor es para **reservar**.
  Propuesta: "Zocdoc permite a la clínica fijar una anticipación mínima en horas (2 h por
  defecto para reservar). Nuestra regla de cancelar hasta 2 h antes es una decisión propia
  con la misma lógica de dar margen a la clínica". Ver `docs/analisis/05_investigacion.md`, 5.4.
- (P1) Para tus evidencias usa `docs/pruebas/plantilla_evidencia.md`, un archivo
  `docs/pruebas/CP-XX.md` por caso.
- ✅ _(de P4, reemplaza el pedido de la ronda 1 sobre códigos técnicos)_ Ya no hace falta que
  `mensajes.js` conozca códigos míos: desde la ronda 2, `datos/respuesta.js` usa **tu**
  `codigoDeError()`, así que todo el proyecto comparte tu catálogo (`SIN_CONEXION`,
  `DATO_DUPLICADO`, `DESCONOCIDO`...). El `error` de `datos/*.js` conserva `message`, `code` y
  `details`, y se puede pasar directo a `mostrarError()`. API de `datos/` en el README.
- _(de P4, ronda 2)_ **Falta `DATOS_INVALIDOS` en `MENSAJES`** (código del contrato, sección
  4.2; lo lanzan `generar_franjas`, `citas_admin`, `asignar_rol`, `cambiar_estado_cita`...).
  Hoy cae en `DESCONOCIDO` ("error inesperado"). Mensaje sugerido por el contrato: "Revisa los
  datos ingresados." Además, el comentario de `FRANJA_CON_CITA` dice que es "propuesto": ya
  está en el contrato.
- _(de P4, ronda 2)_ A 360 px, en `.tabla td::before` la etiqueta se parte ("Accio/nes")
  cuando el valor de la celda es largo. Propuesta: `flex-shrink: 0` (o un `min-inline-size`)
  en `.tabla td::before`. Lo vi en `admin/horarios.html`; acorté mis textos mientras tanto.
- _(de P4, ronda 2)_ En `admin/indicadores.html` uso `<meter>` nativo como barra (con la cifra
  y el porcentaje en texto). Si prefieres un componente `.barra` propio en `componentes.css`,
  avísame y lo cambio.
- _(de P4)_ `admin/componentes.js` tiene piezas que te pueden servir (`crearTabla` con
  `data-etiqueta` y roles, `etiquetaEstado`, `prepararDialogo`, `llenarSelect`). Si las quieres
  en `ui/`, muévelas y yo cambio los `import`.

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

**Hecho (ronda 2, 29/10/2026, rama `p4/paneles`):**

- `assets/js/datos/` ajustado al contrato v1.2 (`mis_citas`, `citas_admin`,
  `p_observaciones`, `p_agrupacion`, `p_nombre_publico`, `cambiar_activo_perfil`,
  `anonimizar_paciente`, transiciones leídas de `transiciones_validas`). `respuesta.js` usa el
  catálogo de códigos de P3. **Cambios de API** (nadie las usaba aún): `listarMisCitas` →
  `misCitas`, `listarCitas` → `citasAdmin`, `obtenerCita` → `obtenerDetalleCita`,
  `TRANSICIONES` → `transicionesValidas()`, `obtenerMiPerfil`/`actualizarMiPerfil` →
  `obtenerPerfil()` de `auth.js` y `actualizarPerfil(id, cambios)`.
- `profesional/agenda.html` y `profesional/cita.html` (esta también la usa el admin).
- `admin/`: `resumen`, `especialidades`, `profesionales`, `horarios`, `citas`, `pacientes` e
  `indicadores` (.html + .js) y `componentes.js`. Sin `innerHTML`; solo clases del CSS de P3.
- Pruebas CP-10, 11, 12, 15, 17, 22, 24, 25 y 27 en `docs/pruebas/CP-XX.md` con capturas en
  `docs/pruebas/evidencias/`. **Aprobadas en una réplica local**: PostgreSQL 15 con los
  scripts de P2 + PostgREST v12.2.3 + Auth simulado; 73 comprobaciones automáticas con
  Playwright contra SQL directo, más 360 px sin scroll horizontal en las 9 páginas.
- README actualizado (pantallas, capa de datos, estado y limitaciones).

**Pendiente:**

- **Ronda 3:** repetir mis CP en `https://cospino08.github.io/diseno/` con las cuentas demo
  reales (CP-17 sobre todo: en local no hay latencia de red).
- Nombres de los integrantes en el README (los pone el humano).
- Cuando P3 publique `paciente/`, revisar que el menú y los flujos entre roles encajen.

**Bloqueos:**

- Ninguno para el código. Las pruebas en Supabase necesitan que una persona del equipo inicie
  sesión con las cuentas demo (los agentes no tienen ni piden las contraseñas).

**Pedidos para P4:**

- ✅ (P1) La pantalla de RF-21 / CU-12 es `admin/pacientes.html`.
- ✅ (P1) CP-22, CP-24, CP-25 y CP-27 hechos (además de CP-10, 11, 12, 15 y 17). Rutas de las
  pantallas: tabla "Pantallas del profesional y del administrador" del README.
- ✅ (P1) Diagrama de arquitectura: `docs/arquitectura/arquitectura.md`.
- ✅ *(de P3, 28/10)* En `assets/js/datos/cliente.js`, exporta el cliente con **nombre**:
  `export const supabase = createClient(...)`. `auth.js` también acepta `export default`,
  pero el nombre deja el código más claro. Mientras no exista, `auth.js` usa un cliente
  temporal.
- *(de P2, 29/10)* Sugerencias para `assets/js/datos/` (lo demás ya coincide con el contrato
  v1.2): (1) `listarMisCitas()` embebe `professionals`; para el paciente, la RLS oculta los
  profesionales inactivos y en citas antiguas `profesional` llegaría `null`. Mejor usar
  `supabase.rpc('mis_citas')`, que además ordena y trae `puede_cancelar` y `cancelado_por`.
  (2) `cambiarEstadoCita()` puede pasar `p_observaciones` (opcional). (3) Para el admin,
  `citas_admin(p_desde, p_hasta, p_profesional, p_estado)` trae los nombres del paciente
  y del profesional ya aplanados. (4) CP-17: con `sql/datos_pruebas_especiales.sql`, la
  agenda de profesional1 a hoy + 90 días tiene 500 citas.

- (P1, 29/10) En `docs/arquitectura/arquitectura.md`, sección 2, la fila "Funciones RPC" dice
  `sql/esquema.sql`, pero las 13 RPC están en `sql/politicas_rls.sql` (en `esquema.sql`
  están las tablas, restricciones y triggers). Además, la fila de GitHub Pages aún dice
  `https://<usuario>.github.io/diseno/`: la URL real es `https://cospino08.github.io/diseno/`.
- *(de P3, 29/10)* En `datos/citas.js`, agrega `misCitas()` → `rpc('mis_citas')` (contrato 3.5).
  Mientras tanto la llamo desde `paciente/comun.js`. `listarMisCitas()` (select a
  `appointments`) ya no la uso: puedes quitarla o dejarla para otro uso.
- *(de P3, 29/10)* En `datos/respuesta.js`, el `23514` (CHECK) cae en `ERROR_DESCONOCIDO`.
  Sugiero devolver `DATOS_INVALIDOS`. Por ahora `mensajes.js` lo reconoce por el nombre
  `ck_…` en `detalle`.
- ✅ *(de P3)* Para tus páginas, reutiliza:
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

- *(de P3, 29/10)* Cuando `p3/ronda2` esté en `main` y publicado: hacer la **ejecución 2** de
  CP-01, 05, 07, 08, 14, 16, 18, 20, 21 y 26 con las cuentas demo, siguiendo la sección
  "Pasos para la ejecución 2" de cada `docs/pruebas/CP-XX.md`, y guardar las capturas como
  `docs/pruebas/capturas/CP-XX-real-N.png` (sin contraseñas visibles). Para CP-21 hace falta
  una cuenta con perfil incompleto (`nuevo1@demo.test` o una registrada en el momento).
- *(de P3)* En Supabase, en **Authentication → URL Configuration**, agrega a *Redirect
  URLs* la URL de GitHub Pages (`https://cospino08.github.io/diseno/**`) y
  `http://localhost:8000/**`. Sin eso, los enlaces de confirmación y de recuperación de
  contraseña no vuelven al sitio.
- *(de P3)* En **Authentication → Providers → Email**, sube la longitud mínima de la
  contraseña a **8**, para que la base exija lo mismo que `validacion.js`.
