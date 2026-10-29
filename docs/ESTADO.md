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

- Que el humano ejecute los scripts en Supabase (ver abajo) y confirme que
  `pruebas_seguridad.sql` da todo PASA allí.
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
