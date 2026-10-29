# Sistema web de reserva de citas médicas

Proyecto integrador de **Análisis y Diseño de Software**: sistema web para reservar, consultar,
cancelar y administrar citas médicas en una clínica ambulatoria ficticia.

> **Estado:** en desarrollo (ronda 2). Ver [Estado de las funciones](#estado-de-las-funciones)
> para saber con honestidad qué está hecho y qué falta.

**Aplicación publicada:** <https://cospino08.github.io/diseno/> (GitHub Pages, rama `main`).

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

Los scripts están en `sql/` (responsable: P2; detalle en [sql/README.md](sql/README.md)). Se
ejecutan **en este orden** en el **SQL Editor** de Supabase (*SQL Editor > New query*, pegar el
contenido y *Run*):

| Paso | Script | Qué hace |
| --- | --- | --- |
| 0 | *(manual)* | Crear las 5 cuentas demo en *Authentication > Users > Add user* con "Auto Confirm User". La contraseña no se escribe en el repositorio. |
| 1 | `sql/esquema.sql` | Tipos, tablas, restricciones, índices y triggers. |
| 2 | `sql/politicas_rls.sql` | Permisos, RLS en todas las tablas y funciones RPC. **Siempre justo después del paso 1.** |
| 3 | `sql/datos_prueba.sql` | Datos ficticios (más de 500 citas) y nombramiento del primer admin. |
| 4 | `sql/pruebas_seguridad.sql` | Pruebas de seguridad; no deja cambios. Todas deben decir PASA. |

**Primer administrador.** Desde la página nadie puede volverse admin (el perfil siempre nace
como `paciente`). `datos_prueba.sql` nombra admin a `admin@demo.test` desde el SQL Editor, que
es el único lugar donde se puede hacer. A partir de ahí, ese admin promueve a los demás desde
*Administración > Profesionales* (RPC `asignar_rol`).

Para reconstruir desde cero: `sql/reiniciar.sql` y luego los pasos 1 a 3.

## Credenciales de demostración

Cuentas **ficticias** creadas solo para probar el sistema. No contienen datos reales.

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@demo.test` | _la entrega el equipo al docente_ |
| Profesional | `profesional1@demo.test`, `profesional2@demo.test` | _la entrega el equipo al docente_ |
| Paciente | `paciente1@demo.test`, `paciente2@demo.test` | _la entrega el equipo al docente_ |

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
├── profesional/               (P4) agenda.html, cita.html (también la usa el admin)
├── admin/                     (P4) resumen, especialidades, profesionales, horarios, citas,
│                                   pacientes, indicadores y componentes.js (piezas comunes)
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
Programada contra [docs/contrato_api.md](docs/contrato_api.md) v1.2.

| Módulo | Contenido |
| --- | --- |
| `cliente.js` | Cliente único de Supabase. |
| `respuesta.js` | Normaliza cualquier error: conserva `message`, `code` y `details` de Supabase y agrega `codigo` con el catálogo de `ui/mensajes.js` (P3). |
| `citas.js` | `franjasDisponibles`, `reservarCita`, `misCitas`, `cancelarCita`, `miAgenda`, `cambiarEstadoCita`, `obtenerDetalleCita`, `historialCita`, `transicionesValidas`, `citasAdmin`. |
| `catalogos.js` | Especialidades, profesionales y franjas: listar, crear, editar, activar o desactivar, `generarFranjas`, `citaActivaDe`. |
| `perfiles.js` | `actualizarPerfil`, `listarPerfiles`, `asignarRol`, `cambiarActivoPerfil`, `anonimizarPaciente`. |
| `indicadores.js` | `indicadoresCitas(desde, hasta, agrupacion)`: conteos por estado, especialidad y periodo. |

Todas las funciones devuelven `{ data, error }` y nunca lanzan excepciones. El `error` se
puede pasar tal cual a `mostrarError()` de `ui/estados.js`:

```js
import { cambiarEstadoCita } from '../assets/js/datos/citas.js';
import { mostrarError } from '../assets/js/ui/estados.js';

const { error } = await cambiarEstadoCita(idCita, 'confirmada');
if (error) {
  // error.codigo: 'NO_AUTORIZADO', 'ANTES_DE_HORA', 'TRANSICION_INVALIDA', 'SIN_CONEXION'...
  mostrarError(zona, error);
}
```

### Pantallas del profesional y del administrador (P4)

| Pantalla | Archivo | Llamadas principales |
| --- | --- | --- |
| Agenda propia | `profesional/agenda.html` | `mi_agenda` |
| Detalle y cambio de estado | `profesional/cita.html?id=` | `transiciones_validas`, `status_history`, `cambiar_estado_cita`, `cancelar_cita` |
| Resumen | `admin/resumen.html` | `indicadores_citas` |
| Especialidades | `admin/especialidades.html` | `specialties` (select, insert, update) |
| Profesionales | `admin/profesionales.html` | `professionals`, `profiles`, `asignar_rol` |
| Horarios | `admin/horarios.html` | `generar_franjas`, `schedules` (select, update) |
| Citas | `admin/citas.html` | `citas_admin` (detalle en `profesional/cita.html`) |
| Pacientes | `admin/pacientes.html` | `profiles`, `cambiar_activo_perfil`, `anonimizar_paciente` |
| Indicadores | `admin/indicadores.html` | `indicadores_citas` |

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
| Capa de acceso a datos (`assets/js/datos/`) | Hecha contra el contrato v1.2 y probada contra una réplica local de la base |
| Diagrama de arquitectura | Hecho |
| Esquema SQL, RLS, RPC y datos de prueba (P2) | Hecho y cargado en Supabase (62/62 pruebas de seguridad PASA) |
| Registro, inicio de sesión y recuperación (P3) | Hecho |
| Vistas del paciente: buscar, reservar, mis citas, perfil (P3) | **Pendiente** (ronda 2) |
| Panel del profesional (agenda, detalle, cambio de estado) | Hecho; probado en réplica local, **falta probarlo en Supabase** |
| Panel administrativo (resumen, especialidades, profesionales, horarios, citas, pacientes, indicadores) | Hecho; probado en réplica local, **falta probarlo en Supabase** |
| Publicación en GitHub Pages | Activa |
| Pruebas de P4 (CP-10, 11, 12, 15, 17, 22, 24, 25, 27) | Aprobadas en réplica local; repetir en la URL publicada |

**Limitaciones conocidas:**

- Las pruebas de P4 se ejecutaron con PostgreSQL y PostgREST locales (las mismas versiones y
  scripts de Supabase) porque las contraseñas demo no se comparten con los agentes. Falta
  repetirlas en la URL publicada.
- La agenda del profesional muestra solo citas, no las franjas libres del día.
- Las observaciones administrativas de una cita se pueden reemplazar, pero no borrar: la RPC
  conserva las anteriores cuando recibe un texto vacío.
- Para dar de alta a un profesional, la persona debe registrarse primero: crear cuentas ajenas
  exigiría la `service_role`, prohibida en el navegador.

**Fuera del MVP** (decisión del equipo): notificaciones por correo o SMS, horarios
recurrentes, varias sedes, pagos, telemedicina y lista de espera.

## Documentación

- [Enunciado del taller](docs/enunciado.md)
- [Plan de trabajo del equipo](docs/plan_trabajo.md)
- [Arquitectura](docs/arquitectura/arquitectura.md)
- [Instrucciones de los agentes](docs/prompts_agentes.md)
- [Estado del proyecto](docs/ESTADO.md)
- [Bitácora de fuentes e IA](docs/bitacora_ia.md)
