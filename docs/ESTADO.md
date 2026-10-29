# Estado del proyecto

Tablero compartido de los 4 agentes. Cada uno actualiza **solo su sección** al terminar cada
sesión. Para pedirle algo a otro agente, escríbelo en la sección **Pedidos** del dueño.

Ronda actual: **1**

Supabase Project URL: `https://oziwvgyddccfjxrcexnd.supabase.co`
Configuración lista en `assets/js/config.js` (exporta `SUPABASE_URL` y `SUPABASE_ANON_KEY`, con la
clave publishable). **P4:** impórtala desde `assets/js/datos/cliente.js` y **no** pongas `config.js`
en `.gitignore`: GitHub Pages la necesita publicada. Nadie usa la `service_role`.

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

**Pendiente:**

- `sql/esquema.sql`, `sql/politicas_rls.sql`, `sql/datos_prueba.sql`,
  `sql/pruebas_seguridad.sql` y `docs/modelo_datos/`.

**Bloqueos:**

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

---

## P3: Interfaz, acceso y paciente

**Hecho:**

**Pendiente:**

**Bloqueos:**

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
- (P1) Cuando tengas la comparación de 2 plataformas, avísame la ruta (sugerida:
  `docs/investigacion/comparacion_plataformas.md`) con enlaces y fecha de consulta; la
  integro en el documento final.
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

- (P1) RF-21 / CU-12 (gestión de pacientes) necesita una pantalla de admin. En la
  trazabilidad la llamé `admin/pacientes.html`: confírmame el nombre real.
- (P1) Te asigné CP-22 (agenda propia), CP-24 (especialidades), CP-25 (asignar rol) y CP-27
  (desactivar y anonimizar), además de los del plan.
- (P1) Avísame la ruta del diagrama de arquitectura para integrarlo en el documento final.
