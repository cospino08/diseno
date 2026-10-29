# Sistema web de reserva de citas médicas

Proyecto integrador de **Análisis y Diseño de Software**: sistema web para reservar, consultar,
cancelar y administrar citas médicas en una clínica ambulatoria ficticia.

> **Estado:** en desarrollo (ronda 1). Ver [Estado de las funciones](#estado-de-las-funciones)
> para saber con honestidad qué está hecho y qué falta.

**Aplicación publicada:** <https://cospino08.github.io/diseno/> _(pendiente de activar GitHub
Pages; ver [Despliegue](#despliegue-en-github-pages))_

## Descripción

Tres roles usan el sistema:

| Rol | Qué puede hacer |
| --- | --- |
| Paciente | Registrarse, completar su perfil, buscar disponibilidad por especialidad, profesional y fecha, reservar, ver "Mis citas" y cancelar hasta 2 horas antes. |
| Profesional | Ver su agenda y cambiar el estado de sus citas (confirmada, atendida, no asistió, cancelada) solo por transiciones válidas. |
| Administrador | Gestionar especialidades, profesionales y horarios (crear, editar, activar o desactivar), ver todas las citas y consultar indicadores por estado, especialidad y periodo. |

Las reglas críticas (sin doble reserva, sin franjas superpuestas, transiciones válidas,
cada usuario solo ve lo suyo) se cumplen en la base de datos, no solo en la interfaz.

## Integrantes

| Rol en el equipo | Nombre | Responsabilidad |
| --- | --- | --- |
| P1 | _Por completar_ | Análisis, requisitos, casos de uso, trazabilidad, plan de pruebas y documento final. |
| P2 | _Por completar_ | Modelo de datos, SQL, RLS, triggers, funciones RPC y pruebas de seguridad. |
| P3 | _Por completar_ | Diseño de interfaz, CSS, autenticación y vistas del paciente. |
| P4 | _Por completar_ | Panel del profesional, panel administrativo, indicadores, capa de datos, arquitectura, repositorio y despliegue. |

## Tecnologías

HTML5, CSS3, JavaScript vanilla (módulos ES), GitHub Pages y Supabase (Auth, PostgreSQL y
Row Level Security). No se usan frameworks, Node, empaquetadores ni servidor propio.
`supabase-js` se carga por CDN con la versión fijada (`2.45.4`).

## Supabase y configuración

- Project URL: `https://oziwvgyddccfjxrcexnd.supabase.co`
- `assets/js/config.js` exporta `SUPABASE_URL` y `SUPABASE_ANON_KEY`. **Se sube al
  repositorio a propósito**: un sitio estático en GitHub Pages no tiene servidor ni archivo
  `.env`, así que todo lo que usa el navegador es visible para cualquiera. La clave anon (o
  publishable) **es pública por diseño**; por sí sola solo permite lo que dejan las políticas
  **RLS** y las funciones RPC de PostgreSQL. La seguridad está en la base de datos, no en
  esconder la clave.
- `assets/js/config.example.js` es la plantilla para conectar otro proyecto de Supabase.
- `assets/js/datos/cliente.js` crea el único cliente de Supabase y lo exporta como `supabase`.
  Todas las páginas lo importan desde ahí.
- **Nunca** se sube la `service_role`, la secret key ni la contraseña de la base de datos: esas
  claves saltan las RLS. Si alguna se filtra, se rota de inmediato en Supabase.

## Instalación

No hay nada que compilar ni instalar.

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/cospino08/diseno.git
   cd diseno
   ```
2. (Solo si se usa **otro** proyecto de Supabase) copiar `assets/js/config.example.js` como
   `assets/js/config.js` y poner la URL y la clave anon de *Project Settings > API*.
3. Preparar la base de datos (siguiente sección).
4. Servir la carpeta con cualquier servidor estático. Los módulos ES **no** funcionan abriendo
   el archivo con doble clic (`file://`), porque el navegador bloquea los `import`. Opciones:
   - Extensión **Live Server** de VS Code, o
   - `python3 -m http.server 8000` y abrir <http://localhost:8000>.
5. En Supabase, *Authentication > URL Configuration*: poner como **Site URL** la URL publicada
   y añadir `http://localhost:8000` en **Redirect URLs** (para el enlace de recuperación de
   contraseña).

## Cómo ejecutar los SQL

Los scripts están en `sql/` (responsable: P2). Se ejecutan **en este orden** en el
**SQL Editor** de Supabase (*SQL Editor > New query*, pegar el contenido y *Run*):

| Orden | Script | Qué hace |
| --- | --- | --- |
| 1 | `sql/esquema.sql` | Tipos, tablas, restricciones, índices, triggers y funciones RPC. |
| 2 | `sql/politicas_rls.sql` | Activa RLS en todas las tablas, crea las políticas y los permisos por columna. |
| 3 | `sql/datos_prueba.sql` | Especialidades, profesionales, franjas y citas ficticias. |

**Primer administrador.** Desde la página nadie puede volverse admin (el perfil siempre nace
como `paciente`). El primer admin se asigna a mano una sola vez, en el SQL Editor, con el
correo de una cuenta ya registrada:

```sql
update public.profiles set rol = 'admin'
where id = (select id from auth.users where email = 'admin@demo.test');
```

A partir de ahí, ese admin promueve a los demás desde *Administración > Profesionales*
(RPC `asignar_rol`). El script exacto lo documenta P2 en `sql/datos_prueba.sql`.

Para comprobar que la base se reconstruye desde cero, se ejecutan los tres scripts en un
proyecto de Supabase nuevo.

## Credenciales de demostración

Cuentas **ficticias** creadas solo para probar el sistema. No contienen datos reales.

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@demo.test` | _la entrega el equipo al docente_ |
| Profesional | `profesional1@demo.test` | _la entrega el equipo al docente_ |
| Paciente | `paciente1@demo.test` | _la entrega el equipo al docente_ |

> Las contraseñas no se escriben en el repositorio. Las define la persona que crea las
> cuentas en Supabase y se entregan al docente junto con la URL.

## Despliegue en GitHub Pages

La activa una persona del equipo con permisos de administrador en el repositorio (los agentes
de IA no lo hacen):

1. En GitHub: *Settings > Pages*.
2. *Build and deployment > Source*: **Deploy from a branch**.
3. *Branch*: **main** y carpeta **/ (root)**. Guardar.
4. Esperar 1-2 minutos y abrir `https://cospino08.github.io/diseno/`.
5. Poner esa URL como **Site URL** en Supabase (*Authentication > URL Configuration*).
6. Probar con las tres cuentas de demostración desde la URL publicada, no solo en local.

Notas:
- Todas las rutas del proyecto son **relativas** (`../assets/...`), porque la página vive en
  el subdirectorio `/diseno/` y una ruta absoluta (`/assets/...`) apuntaría a otro sitio.
- GitHub Pages es sensible a mayúsculas en los nombres de archivo.
- El plan gratuito de Supabase pausa los proyectos inactivos: entrar al panel cada semana y
  reactivarlo antes de la sustentación.

## Estructura del repositorio

```
/
├── index.html, registro.html  (P3) acceso
├── paciente/                  (P3) vistas del paciente
├── profesional/               (P4) agenda y detalle de cita
├── admin/                     (P4) resumen, catálogos, horarios, citas e indicadores
├── assets/
│   ├── css/                   (P3) estilos
│   └── js/
│       ├── config.js          URL + clave anon (pública por diseño)
│       ├── config.example.js  (P4) plantilla de config.js
│       ├── auth.js            (P3) sesión y guardas por rol
│       ├── validacion.js      (P3)
│       ├── datos/             (P4) cliente.js y un módulo por recurso
│       └── ui/                (P3) mensajes y estados de interfaz
├── sql/                       (P2) esquema.sql, politicas_rls.sql, datos_prueba.sql
└── docs/                      documentación, diagramas y pruebas
```

Las carpetas vacías llevan un `.gitkeep` para que Git las conserve hasta que tengan archivos.

### Capa de acceso a datos (`assets/js/datos/`)

| Módulo | Contenido |
| --- | --- |
| `cliente.js` | Cliente único de Supabase. |
| `respuesta.js` | Convierte cualquier error en `{ codigo, detalle }` con el código del contrato. |
| `citas.js` | Franjas disponibles, reservar, cancelar, mis citas, agenda, cambio de estado, detalle, historial y transiciones válidas. |
| `catalogos.js` | Especialidades, profesionales y franjas (listar, editar, activar o desactivar, generar). |
| `perfiles.js` | Perfil propio, lista de perfiles (admin) y `asignarRol`. |
| `indicadores.js` | Conteos agregados de citas (admin). |

Todas las funciones devuelven `{ data, error }` y nunca lanzan excepciones:

```js
import { cambiarEstadoCita } from '../assets/js/datos/citas.js';

const { error } = await cambiarEstadoCita(idCita, 'confirmada');
if (error) {
  // error.codigo: 'NO_AUTORIZADO', 'ANTES_DE_HORA', 'TRANSICION_INVALIDA', 'ERROR_RED'...
}
```

## Decisiones técnicas

Resumen; el detalle está en [docs/plan_trabajo.md](docs/plan_trabajo.md) (secciones 3 y 4) y
en [docs/arquitectura/arquitectura.md](docs/arquitectura/arquitectura.md).

- **Arquitectura cliente-nube sin servidor propio.** El navegador se trata como no confiable;
  toda regla crítica vive en PostgreSQL.
- **Franjas concretas.** Cada fila de `schedules` es una franja (fecha + hora). El admin las
  crea en bloque con `generar_franjas`. Los horarios semanales recurrentes quedan fuera.
- **Sin doble reserva.** Índice único parcial sobre `schedule_id` para citas no canceladas y
  RPC atómica con `for update`. Una cita cancelada libera la franja automáticamente.
- **Sin franjas superpuestas.** Restricción de exclusión (`btree_gist`) por profesional.
- **Escrituras de citas solo por RPC.** Nadie tiene `INSERT`/`UPDATE`/`DELETE` directo sobre
  `appointments` ni `status_history`.
- **Transiciones de estado controladas por trigger,** que además escribe el historial con
  `changed_by = auth.uid()`.
- **Roles protegidos.** El perfil nace como `paciente`; solo un admin cambia roles con
  `asignar_rol`. Permisos por columna impiden que un usuario edite su propio `rol`.
- **Borrado lógico** (`activo = false`) en catálogos; citas e historial nunca se borran.
- **Cancelación** hasta 2 horas antes, validada en la base con hora de America/Bogota.
- **Seguridad en el frontend:** nada de `innerHTML` con datos de la base (`textContent` y
  `createElement`); ocultar botones es solo usabilidad.
- **Datos ficticios.** Sin diagnósticos ni historia clínica; el motivo se limita a 200
  caracteres.

## Estado de las funciones

Se actualiza al final de cada ronda. Lo que no esté marcado como hecho **no funciona aún**.

| Función | Estado |
| --- | --- |
| Estructura del repositorio, cliente de Supabase, `.gitignore` | Hecho |
| Capa de acceso a datos (`assets/js/datos/`) | Hecha contra la sección 7 del plan; **pendiente de ajustar** a `docs/contrato_api.md` y de probar contra la base real |
| Diagrama de arquitectura | Hecho |
| Esquema SQL, RLS, RPC y datos de prueba | Pendiente (P2) |
| Registro, inicio de sesión, perfil y vistas del paciente | Pendiente (P3) |
| Panel del profesional (agenda, detalle, cambio de estado) | Pendiente (P4, ronda 2) |
| Panel administrativo e indicadores | Pendiente (P4, ronda 2) |
| Publicación en GitHub Pages | Pendiente de activar |
| Pruebas CP-01 a CP-18 | Pendientes |

**Fuera del MVP** (decisión del equipo): notificaciones por correo o SMS, horarios
recurrentes, varias sedes, pagos, telemedicina y lista de espera.

## Documentación

- [Enunciado del taller](docs/enunciado.md)
- [Plan de trabajo del equipo](docs/plan_trabajo.md)
- [Arquitectura](docs/arquitectura/arquitectura.md)
- [Instrucciones de los agentes](docs/prompts_agentes.md)
- [Estado del proyecto](docs/ESTADO.md)
- [Bitácora de fuentes e IA](docs/bitacora_ia.md)
