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

**Pendiente:**

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
