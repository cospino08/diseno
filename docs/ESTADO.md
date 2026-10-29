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

**Pendiente:**

**Bloqueos:**

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

---

## P3: Interfaz, acceso y paciente

**Hecho:**

**Pendiente:**

**Bloqueos:**

**Pedidos para P3:**

---

## P4: Profesional, administración y despliegue

**Hecho:**

**Pendiente:**

**Bloqueos:**

**Pedidos para P4:**
