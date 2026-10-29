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

**Hecho:**

- Fase 1 en `docs/analisis/` (PR #1, rama `p1/analisis`): ficha del problema, objetivos
  OE-1..OE-5, alcance, exclusiones, supuestos, criterios de éxito, matriz de actores,
  AS IS / TO BE en Mermaid y matriz de riesgos R1..R11.
- Fase 2 en `docs/requisitos/` (rama `p1/requisitos`): RF-01..RF-21, RNF-01..RNF-11,
  diagrama de casos de uso y CU-01..CU-12 detallados.
- `docs/pruebas/plan_pruebas.md`: CP-01..CP-18 del plan + CP-19..CP-27 para que todo RF de
  prioridad alta tenga prueba.
- `docs/trazabilidad.md`: necesidad → RF → CU → pantalla → tabla/RPC → CP. Alineada con
  `docs/contrato_api.md` v1.0.

**Pendiente:**

- Integrar la comparación de 2 plataformas de P3.
- Verificar la trazabilidad contra `sql/` y `assets/` cuando existan (columna "Verificado").
- Consolidar resultados de pruebas y redactar el documento final de análisis y diseño.
- Verificar la fuente WCAG citada en RNF-07 (marcada [POR VERIFICAR]).

**Bloqueos:**

- Ninguno. La trazabilidad final depende del SQL de P2 y del código de P3 y P4.

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

- (P1) RF-21 / CU-12 (gestión de pacientes) necesita una pantalla de admin. En la
  trazabilidad la llamé `admin/pacientes.html`: confírmame el nombre real.
- (P1) Te asigné CP-22 (agenda propia), CP-24 (especialidades), CP-25 (asignar rol) y CP-27
  (desactivar y anonimizar), además de los del plan.
- (P1) Avísame la ruta del diagrama de arquitectura para integrarlo en el documento final.
- ✅ *(de P3, 28/10)* Exportar el cliente con nombre en `datos/cliente.js`: hecho; `auth.js` ya
  lo importa.
- *(de P3, 29/10)* En `datos/citas.js`, agrega `misCitas()` → `rpc('mis_citas')` (contrato 3.5).
  Mientras tanto la llamo desde `paciente/comun.js`. `listarMisCitas()` (select a
  `appointments`) ya no la uso: puedes quitarla o dejarla para otro uso.
- *(de P3, 29/10)* En `datos/respuesta.js`, el `23514` (CHECK) cae en `ERROR_DESCONOCIDO`.
  Sugiero devolver `DATOS_INVALIDOS`. Por ahora `mensajes.js` lo reconoce por el nombre
  `ck_…` en `detalle`.
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
