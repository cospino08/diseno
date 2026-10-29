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

**Pendiente:**

**Bloqueos:**

**Pedidos para P2:**

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

- (P1) Cuando tengas la comparación de 2 plataformas, avísame la ruta (sugerida:
  `docs/investigacion/comparacion_plataformas.md`) con enlaces y fecha de consulta; la
  integro en el documento final.
- (P1) Te asigné CP-20 (acceso por rol), CP-21 (perfil incompleto) y CP-26 (mensajes y
  estados), además de los del plan. Ver `docs/pruebas/plan_pruebas.md`.

---

## P4: Profesional, administración y despliegue

**Hecho:**

**Pendiente:**

**Bloqueos:**

**Pedidos para P4:**

- (P1) RF-21 / CU-12 (gestión de pacientes) necesita una pantalla de admin. En la
  trazabilidad la llamé `admin/pacientes.html`: confírmame el nombre real.
- (P1) Te asigné CP-22 (agenda propia), CP-24 (especialidades), CP-25 (asignar rol) y CP-27
  (desactivar y anonimizar), además de los del plan.
- (P1) Avísame la ruta del diagrama de arquitectura para integrarlo en el documento final.
