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

**Hecho:**

- `docs/contrato_api.md` v1.0 publicado (rama `p2/contrato-api`). **P3 y P4: ya pueden
  programar contra él.** Además de lo del plan, añade las RPC `rol_actual`, `mis_citas`,
  `citas_admin`, `cambiar_activo_perfil` y `anonimizar_paciente`, y los códigos
  `FRANJA_CON_CITA` y `DATOS_INVALIDOS`. Los errores llegan en `error.message` con el código
  exacto (sección 4).
- Rama `p2/sql` (PR aparte, incluye el contrato): `sql/esquema.sql`,
  `sql/politicas_rls.sql`, `sql/datos_prueba.sql`, `sql/pruebas_seguridad.sql`,
  `sql/reiniciar.sql`, `sql/README.md` (orden de ejecución) y `docs/modelo_datos/`
  (diagrama ER en Mermaid, diccionario de datos, matriz rol-recurso-operación e
  instrucciones de pruebas desde el navegador). Contrato actualizado a **v1.1** (sin cambios
  de nombres ni firmas).
- **Probado en PostgreSQL 15.19 local (Docker)**, no en Supabase. `sql/local/` simula lo
  mínimo de Supabase (roles `anon`/`authenticated`, `auth.users`, `auth.uid()`, permisos por
  defecto). Resultado: los scripts corren en orden sobre una base vacía sin errores;
  `pruebas_seguridad.sql` da **62/62 PASA**; el ciclo `reiniciar → esquema → políticas →
  datos` también funciona; CP-02 se probó además con **dos sesiones simultáneas** reales
  (la segunda espera el bloqueo y recibe `FRANJA_OCUPADA`).

**Pendiente:**

- ✅ _(coordinación)_ Scripts ejecutados en Supabase: 62/62 PASA.
- Pruebas desde el navegador (`docs/modelo_datos/pruebas_seguridad.md`, sección 2) cuando
  haya páginas publicadas.
- Atender pedidos de P3 y P4 sobre el contrato.

**Pasos para el humano (ronda 2):**

1. En Supabase: Authentication → Users → Add user (marcar "Auto Confirm User") para
   `admin@demo.test`, `profesional1@demo.test`, `profesional2@demo.test`,
   `paciente1@demo.test` y `paciente2@demo.test`. Elegir contraseñas y **no** subirlas al repo.
2. SQL Editor: ejecutar en orden `sql/esquema.sql`, `sql/politicas_rls.sql`,
   `sql/datos_prueba.sql` (este nombra a `admin@demo.test` como primer admin).
3. Ejecutar `sql/pruebas_seguridad.sql` y guardar captura de la tabla de resultados.

**Riesgos no verificados localmente (solo se pueden comprobar en Supabase):**

- `datos_prueba.sql` inserta 22 usuarios ficticios sin contraseña directamente en
  `auth.users` (con los campos `*_token` en `''`). Si la pantalla Authentication → Users da
  error tras ejecutarlo, avisar a P2.
- El SQL Editor muestra solo el último resultado; los scripts están hechos para que ese
  último resultado sea el resumen o la tabla de pruebas.

**Bloqueos:**

- Ninguno. No tengo acceso a Supabase: la ejecución real depende del humano.

**Pedidos para P2:**

- _(de P4)_ En `docs/contrato_api.md`, por favor indica para cada RPC: parámetros con tipo,
  forma exacta de lo que devuelve (sobre todo `mi_agenda` e `indicadores_citas`: nombres de
  columnas o JSON) y los códigos de error. Hoy `assets/js/datos/` sigue la sección 7 del plan.
- _(de P4)_ Que los errores de las RPC empiecen por el código en MAYÚSCULAS
  (`raise exception 'CODIGO'` o `'CODIGO: detalle'`): `datos/respuesta.js` extrae así el código.
- _(de P4)_ Que `generar_franjas` traduzca `exclusion_violation` a `HORARIO_SUPERPUESTO`, y que
  el trigger de `schedules` (P12) use un código propio, por ejemplo `FRANJA_CON_CITA`.
- _(de P4)_ Que `appointments` tenga **una sola** relación hacia `schedules` y una hacia
  `professionals` para que PostgREST pueda embeber sin ambigüedad
  (`schedules(...)`, `professionals(...)`). Si la FK compuesta de C7 convive con una FK simple,
  dime el nombre de la restricción y lo pongo en `datos/citas.js`.
- _(de P4)_ Confirmar que `professionals` tiene `nombre_publico` y `registro_profesional`, y
  que el admin puede leer `profiles` (para buscar a quién promover) y `status_history`.
- _(de P4)_ Que `indicadores_citas` devuelva conteos **por estado, por especialidad y por
  periodo** (por día o por mes), como pide la sección 5.2 del enunciado.
- (P1) Revisa que los RF y CU de `docs/requisitos/` coincidan con el contrato v1.0. Se
  añadió RF-21 (gestión de pacientes) por `cambiar_activo_perfil` y `anonimizar_paciente`.
- (P1) En `sql/datos_prueba.sql`, usa las cuentas del plan de pruebas (8.1):
  `paciente1`, `paciente2`, `profesional1`, `profesional2`, `admin` y `nuevo1@demo.test`
  (este último sin perfil completo, para CP-19, CP-21 y CP-25). Para CP-17, un script o
  bloque que genere 500 citas de un día para `profesional1`. Para CP-18, un paciente con el
  nombre `<img src=x onerror=alert(1)>`.
- (P1) Te asigné CP-19 (rol falso en el registro) y CP-23 (historial e insert directo), además
  de los del plan. Inclúyelos en `sql/pruebas_seguridad.sql` si aplica.
- *(de P3, 28/10)* Para las vistas del paciente necesito que `docs/contrato_api.md` defina:
  1. **Columnas exactas que devuelve `franjas_disponibles`**. Propuesta: `schedule_id`,
     `fecha`, `hora_inicio`, `hora_fin`, `professional_id`, `profesional` (nombre público),
     `specialty_id`, `especialidad`. Además, que `p_profesional` y `p_fecha` acepten `null`
     (cualquier profesional).
  2. **Cómo lee el paciente "Mis citas"** con el nombre del profesional y la especialidad
     (¿vista `v_mis_citas` o `select` con relaciones embebidas?). Necesito `id`, `fecha`,
     `hora_inicio`, `hora_fin`, `profesional`, `especialidad`, `estado`, `motivo`, `cancelled_at`
     y, si es posible, quién canceló, para mostrar "Cancelada por la institución" (plan, P12).
  3. **Cómo se listan los profesionales para el filtro** (¿`v_profesionales_publicos`?).
  4. **Columnas de `profiles`** (uso `id, nombres, documento, telefono, fecha_nacimiento,
     rol, activo`) y si `documento` es `UNIQUE`.
  5. Que las RPC lancen el código **al inicio** del mensaje (`raise exception
     'FRANJA_OCUPADA'` o `'TRANSICION_INVALIDA: …'`). `assets/js/ui/mensajes.js` lo
     detecta así.
  6. **Código de error del trigger de P12** (mover o desactivar una franja con cita activa).
     Propongo `FRANJA_CON_CITA`; ya está en `mensajes.js`.

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

- *(de P3)* En Supabase, en **Authentication → URL Configuration**, agrega a *Redirect
  URLs* la URL de GitHub Pages (`https://cospino08.github.io/diseno/**`) y
  `http://localhost:8000/**`. Sin eso, los enlaces de confirmación y de recuperación de
  contraseña no vuelven al sitio.
- *(de P3)* En **Authentication → Providers → Email**, sube la longitud mínima de la
  contraseña a **8**, para que la base exija lo mismo que `validacion.js`.
