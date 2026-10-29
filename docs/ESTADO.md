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

---

## P4: Profesional, administración y despliegue

**Hecho:**

**Pendiente:**

**Bloqueos:**

**Pedidos para P4:**

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

- *(de P3)* En Supabase, en **Authentication → URL Configuration**, agrega a *Redirect
  URLs* la URL de GitHub Pages (`https://cospino08.github.io/diseno/**`) y
  `http://localhost:8000/**`. Sin eso, los enlaces de confirmación y de recuperación de
  contraseña no vuelven al sitio.
- *(de P3)* En **Authentication → Providers → Email**, sube la longitud mínima de la
  contraseña a **8**, para que la base exija lo mismo que `validacion.js`.
