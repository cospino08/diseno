# Documento de análisis y diseño

**Sistema web de reserva de citas médicas — Clínica Ambulatoria San Rafael (ficticia)**

Proyecto integrador de Análisis y Diseño de Software. Entregable 1 (sección 14 del
enunciado).

| Campo | Valor |
| --- | --- |
| Docente | Ing. Mg. José Javier Zapata Polo |
| Integrantes | _(por completar: nombres de P1, P2, P3 y P4)_ |
| Repositorio | <https://github.com/cospino08/diseno> |
| Aplicación publicada | <https://cospino08.github.io/diseno/> |
| Versión | Borrador de la ronda 2 (29/10/2026) |

> **Cómo leer este documento.** Cada sección resume una parte del trabajo y enlaza el
> documento detallado del repositorio, que es la fuente de verdad. Así no hay dos versiones
> del mismo contenido. Para la entrega impresa o en PDF, P1 copiará los anexos al final.
> Las secciones marcadas **[PENDIENTE]** se completan en la ronda 3.

---

## Contenido

1. Introducción
2. Problema
3. Objetivos
4. Alcance, exclusiones, restricciones y supuestos
5. Investigación
6. Procesos AS IS y TO BE
7. Actores
8. Requisitos funcionales y no funcionales
9. Casos de uso
10. Arquitectura
11. Diseño de interfaz
12. Modelo de datos y diccionario
13. Seguridad
14. Riesgos
15. Pruebas
16. Trazabilidad
17. Limitaciones y siguiente incremento
18. Uso de IA y referencias

---

## 1. Introducción

Este documento presenta el ciclo completo de análisis y diseño de un sistema web que
centraliza la agenda de una clínica ambulatoria ficticia y permite a pacientes, profesionales
y administradores reservar, consultar, cancelar y administrar citas. La solución usa solo las
tecnologías exigidas: HTML5, CSS3, JavaScript vanilla, GitHub Pages y Supabase. Todas las
reglas críticas se validan en la base de datos, no solo en la interfaz.

El equipo se organizó en cuatro roles (análisis y documentación, base de datos y seguridad,
frontend del paciente y frontend del profesional y la administración). El reparto y las
decisiones previas están en [`plan_trabajo.md`](plan_trabajo.md).

> **[PENDIENTE]** Confirmar la autorización del docente para un equipo de 4 integrantes
> (el enunciado indica un máximo de 2; ver el plan, 0.1).

## 2. Problema

**Detalle:** [`analisis/01_ficha_problema.md`](analisis/01_ficha_problema.md), secciones
1.1 a 1.5.

La clínica agenda por teléfono, WhatsApp y de forma presencial. Cada recepcionista lleva su
propia hoja de cálculo. **Problema central:** la agenda está dispersa en varios canales y
archivos sin control de concurrencia, lo que provoca cruces de horario, registros duplicados
y falta de información confiable.

| Causas principales | Consecuencias principales |
| --- | --- |
| Hojas de cálculo independientes; reservas por WhatsApp anotadas tarde; paciente identificado por nombre; el médico no ve su agenda; sin estados de cita; cambios de horario sin cruzar con las citas. | Dos pacientes en la misma franja; pacientes duplicados; pacientes sin confirmación; el médico conoce su agenda al llegar; no se miden cancelaciones ni inasistencias. |

**Afectados:** pacientes, profesionales, recepción y dirección de la clínica.

## 3. Objetivos

**Detalle:** [`analisis/01_ficha_problema.md`](analisis/01_ficha_problema.md), 1.6 y 1.7.

**Objetivo general.** Desarrollar un sistema web, publicado en GitHub Pages y con persistencia
en Supabase, que centralice la agenda de la clínica y permita reservar, consultar, cancelar y
administrar citas con reglas de integridad y seguridad validadas en la base de datos.

| ID | Objetivo específico | Meta | Pruebas |
| --- | --- | --- | --- |
| OE-1 | Eliminar cruces de horario y reservas dobles. | 0 duplicados, incluso con reservas simultáneas. | CP-01, 02, 09, 11 |
| OE-2 | Reserva sin intervención de recepción. | ≤ 5 pasos (el diseño lo resuelve en 4). | CP-16 |
| OE-3 | Cada usuario restringido a su rol. | 100 % de pruebas negativas rechazadas. | CP-03, 04, 06, 13 |
| OE-4 | Agenda actualizada y control de estados para el profesional. | 0 transiciones inválidas aceptadas; agenda de 500 citas en ≤ 3 s. | CP-10, 17 |
| OE-5 | Indicadores para la administración. | 0 diferencias con un conteo SQL directo. | CP-15 |

## 4. Alcance, exclusiones, restricciones y supuestos

**Detalle:** [`analisis/01_ficha_problema.md`](analisis/01_ficha_problema.md), 1.8 a 1.12.

- **Alcance:** las 12 funcionalidades obligatorias de la sección 5.2 del enunciado, más la
  gestión de pacientes (desactivar y anonimizar).
- **Exclusiones:** notificaciones por correo o SMS, horarios recurrentes, varias sedes,
  información clínica, pagos, telemedicina, lista de espera, creación de cuentas de terceros
  desde el navegador y reprogramación en un paso.
- **Restricciones:** solo las tecnologías obligatorias; frontend público (solo la clave
  `anon`); reglas críticas en PostgreSQL; plan gratuito de Supabase; datos 100 % ficticios.
- **Supuestos principales:** hora de America/Bogota; una franja atiende a un paciente; un
  profesional tiene una especialidad; el primer admin se asigna desde el SQL Editor.
- **Criterios de éxito:** pruebas de prioridad alta aprobadas con evidencia, metas OE-1 a
  OE-5 cumplidas, aplicación funcionando desde la URL pública, base reconstruible desde los
  scripts y repositorio sin secretos.

## 5. Investigación

**Detalle:** [`investigacion_plataformas.md`](investigacion_plataformas.md) (P3, fuentes
consultadas el 28/10/2026) y su síntesis en
[`analisis/05_investigacion.md`](analisis/05_investigacion.md).

Se compararon **Doctoralia** y **Zocdoc**. Ambas siguen el patrón *buscar → elegir un hueco
libre → confirmar → recibir confirmación inmediata → cancelar sin llamar*, que es el que
adopta nuestro proceso TO BE. Nos diferenciamos en dos puntos a propósito:

1. **Sin búsqueda por texto libre**, para no invitar a escribir datos clínicos (hallazgo H6).
2. **La doble reserva se impide en la base de datos**, no solo en la interfaz.

Lo que las plataformas tienen y nosotros no (pagos, opiniones, recordatorios, telemedicina,
sanciones por inasistencia) queda como exclusión declarada. La regla de cancelar hasta 2 h
antes es una decisión del equipo; el hallazgo de Zocdoc sobre 2 h se refiere a la
anticipación para **reservar** (ver la aclaración en `05_investigacion.md`, 5.4).

> **[PENDIENTE]** Un integrante debe confirmar en el navegador los puntos que P3 marcó como
> "no verificado".

## 6. Procesos AS IS y TO BE

**Detalle y diagramas:** [`analisis/03_procesos.md`](analisis/03_procesos.md).

- **AS IS:** el paciente llama o escribe; la recepcionista revisa *su* hoja, anota por
  nombre y avisa al médico cuando puede. Los puntos de falla están señalados en el diagrama.
- **TO BE:** el paciente inicia sesión, completa su perfil, busca, elige una franja libre y
  confirma. La base crea la cita en una transacción atómica o devuelve `FRANJA_OCUPADA`. El
  profesional ve su agenda en línea y registra el estado; el admin publica franjas y
  consulta indicadores.
- **Ciclo de vida de la cita:** `programada → confirmada → atendida | no_asistio`, con
  `cancelada` posible desde `programada` o `confirmada`. Los estados finales no cambian.

## 7. Actores

**Detalle:** [`analisis/02_actores.md`](analisis/02_actores.md).

| Actor | Necesidad principal | Permisos clave |
| --- | --- | --- |
| Paciente | Reservar una franja libre con confirmación. | Su perfil; sus citas; catálogos y disponibilidad. |
| Profesional | Ver su agenda y registrar la atención. | Solo sus citas, con nombre y teléfono del paciente. |
| Administrador / recepcionista | Mantener catálogos y agendas; medir la demanda. | Catálogos, franjas, todas las citas, roles e indicadores. |
| Visitante | Registrarse. | Ninguno sobre los datos. |

Administrador y recepcionista comparten el rol `admin` en el MVP. Los conflictos entre actores
(doble reserva, cambios de horario con citas, privacidad del paciente) están resueltos en el
documento de actores, 2.3.

## 8. Requisitos funcionales y no funcionales

**Detalle:** [`requisitos/requisitos_funcionales.md`](requisitos/requisitos_funcionales.md)
(RF-01 a RF-21) y
[`requisitos/requisitos_no_funcionales.md`](requisitos/requisitos_no_funcionales.md)
(RNF-01 a RNF-11).

- **21 requisitos funcionales**, 19 de prioridad alta y 2 de prioridad media. Cada uno tiene
  actor, prioridad, fuente y criterio de aceptación verificable (*Dado… cuando… entonces…*).
- **11 requisitos no funcionales medibles:** seguridad (RLS, sin secretos, sin
  `innerHTML`), rendimiento (agenda de 500 citas en ≤ 3 s), usabilidad (≤ 5 pasos),
  compatibilidad (Chrome y Firefox, 360 px), accesibilidad (WCAG 2.1 AA, contraste ≥ 4.5:1),
  integridad, mantenibilidad, disponibilidad y privacidad.
- Las reglas de negocio de la sección 5.3 del enunciado se relacionan con sus requisitos en
  la tabla 5.1 de los requisitos funcionales.

## 9. Casos de uso

**Detalle:** [`requisitos/casos_uso.md`](requisitos/casos_uso.md).

Diagrama general y **12 casos de uso detallados** (CU-01 a CU-12), cada uno con
precondiciones, flujo principal, alternativas, excepciones y postcondiciones. Los flujos
críticos son CU-04 *Reservar cita* (incluye el conflicto por reserva simultánea), CU-05
*Consultar y cancelar mis citas* (regla de 2 h) y CU-07 *Cambiar estado de cita*
(transiciones válidas).

## 10. Arquitectura

**Detalle:** [`arquitectura/arquitectura.md`](arquitectura/arquitectura.md) (P4).

Arquitectura **cliente-nube** sin servidor propio. GitHub Pages sirve los archivos
estáticos. El navegador ejecuta las páginas, los módulos de interfaz (`assets/js/ui/`,
`auth.js`) y la capa de datos (`assets/js/datos/`), que es la única que llama a Supabase.
Supabase aporta Auth, PostgreSQL, la API REST (PostgREST), RLS, funciones RPC y triggers. El
navegador se trata como un cliente **no confiable**: toda regla crítica se vuelve a validar
en la base.

## 11. Diseño de interfaz

**Detalle:** [`wireframes/`](wireframes/README.md) (P3), con la guía de estilos en
[`wireframes/guia_estilos.html`](wireframes/guia_estilos.html).

- 17 pantallas inventariadas (acceso A-01 a A-04, paciente P-01 a P-05, profesional R-01 y
  R-02, administración D-01 a D-06), más la de pacientes del admin (`admin/pacientes.html`).
- Mapa de navegación por rol en Mermaid.
- Wireframes a 360 px, cinco estados de interfaz (cargando, vacío, error, acceso denegado y
  éxito) y reserva en 4 pasos.
- CSS *mobile first* con contraste medido contra WCAG AA y foco visible.

> **[PENDIENTE]** Capturas de las pantallas construidas (ronda 2 de P3 y P4).

## 12. Modelo de datos y diccionario

**Detalle:** [`modelo_datos/diagrama_er.md`](modelo_datos/diagrama_er.md),
[`modelo_datos/diccionario_datos.md`](modelo_datos/diccionario_datos.md) y los scripts de
[`../sql/`](../sql/README.md) (P2).

- 7 tablas: `profiles`, `specialties`, `professionals`, `schedules`, `appointments`,
  `status_history` y `transiciones_validas`. Roles y estados son tipos enumerados.
- **Franjas concretas:** cada fila de `schedules` es una fecha y un rango horario. El admin
  las genera en bloque con `generar_franjas`.
- **Sin doble reserva:** índice único parcial `uq_franja_con_cita_activa` sobre
  `appointments(schedule_id)` para citas no canceladas, más la RPC atómica `reservar_cita`.
- **Sin franjas superpuestas:** restricción de exclusión `ex_schedules_sin_cruce`.
- **Cancelación:** la franja se conserva y queda disponible otra vez.
- **Borrado:** lógico (`activo = false`) en catálogos y franjas; citas e historial nunca se
  borran; los pacientes se desactivan o se anonimizan.
- Los scripts reconstruyen la base en orden: `esquema.sql`, `politicas_rls.sql`,
  `datos_prueba.sql`.

## 13. Seguridad

**Detalle:** [`modelo_datos/matriz_permisos.md`](modelo_datos/matriz_permisos.md),
[`modelo_datos/pruebas_seguridad.md`](modelo_datos/pruebas_seguridad.md) y
[`contrato_api.md`](contrato_api.md) (P2).

- RLS habilitado en las 7 tablas, con 13 políticas por rol o propietario.
- Nadie escribe directamente en `appointments` ni en `status_history`: las escrituras pasan
  por RPC que validan quién llama.
- El rol no es editable por el usuario (permisos por columna). El perfil nace siempre como
  `paciente` y solo un admin cambia roles con `asignar_rol`.
- Las 13 RPC revocan la ejecución a `anon`. En el frontend solo está la clave publishable;
  la `service_role` no se usa.
- Resultado: `sql/pruebas_seguridad.sql` dio **62/62 PASA en Supabase** (28/10/2026).

## 14. Riesgos

**Detalle:** [`analisis/04_riesgos.md`](analisis/04_riesgos.md).

11 riesgos con probabilidad, impacto, nivel, prevención, respuesta y dueño. Los de nivel alto
son el retraso de las RPC (R1, ya mitigado con el contrato), una política RLS que exponga
datos (R2), la doble reserva concurrente (R3), la falta de dominio en la sustentación (R4),
la autorización del equipo de 4 (R5) y la inyección de HTML (R9).

## 15. Pruebas

**Detalle:** [`pruebas/plan_pruebas.md`](pruebas/plan_pruebas.md). Formato de evidencia:
[`pruebas/plantilla_evidencia.md`](pruebas/plantilla_evidencia.md).

27 casos de prueba (CP-01 a CP-27) que cubren funcionalidad, reglas de negocio, seguridad,
usabilidad, responsive y rendimiento.

| Estado al 29/10/2026 | Casos |
| --- | --- |
| Aprobado en la base de datos (falta evidencia desde el navegador) | 10 |
| Pendiente de pantallas | 15 |
| Pendiente de fusionar (PR #9) | 2 |

> **[PENDIENTE]** Resultados y evidencias de todas las pruebas en la URL publicada (ronda 3).

## 16. Trazabilidad

**Detalle:** [`trazabilidad.md`](trazabilidad.md).

Matriz necesidad → RF → CU → pantalla → tabla, RPC o política → CP. Los 19 requisitos de
prioridad alta tienen una prueba asignada. Todos los objetos de la base que nombra la matriz
existen en `sql/` (verificado el 29/10/2026). Falta verificar las pantallas y las evidencias.

| Necesidad | Requisito | Diseño | Implementación | Prueba |
| --- | --- | --- | --- | --- |
| Evitar cruces | RF-06 | CU-04 Reservar cita | `appointments` + `uq_franja_con_cita_activa` + RPC `reservar_cita` | CP-01, CP-02 |
| Acceso por rol | RF-09 | CU-05 Mis citas | Política `appointments_select_paciente_profesional_admin` | CP-03 |
| Estados auditables | RF-11, RF-13 | CU-07 Cambiar estado | `transiciones_validas`, `trg_validar_cita`, `trg_historial_cita` | CP-10, CP-23 |

## 17. Limitaciones y siguiente incremento

> **[PENDIENTE]** Completar en la ronda 3 según lo que quede construido. Base actual:

- Sin notificaciones ni recordatorios: el siguiente incremento sería un recordatorio por
  correo antes de la cita.
- Franjas concretas, sin patrón semanal.
- Una sola sede (ver la arquitectura, sección 4, para el cambio a varias sedes).
- Sin anticipación mínima para reservar (posible mejora, ver `05_investigacion.md`, 5.4).
- Administrador y recepcionista comparten el rol `admin`.

## 18. Uso de IA y referencias

**Bitácora:** [`bitacora_ia.md`](bitacora_ia.md). Cada integrante registra herramienta,
propósito, qué se usó, qué se modificó y cómo se verificó.

**Referencias** (formato APA; **[PENDIENTE]** completar la bibliografía técnica en la ronda 3):

- Doctoralia. (s. f.). *Doctoralia Colombia*. <https://www.doctoralia.co/>. Consultado el
  28/10/2026.
- Doctoralia. (s. f.). *Médico general en Bogotá*.
  <https://www.doctoralia.co/medico-general/bogota>. Consultado el 28/10/2026.
- Doctoralia Pro. (s. f.). *¿Cómo se generan tus citas en Doctoralia?* [Infografía].
  <https://pro.doctoralia.es/hubfs/ES-infographic-CM-admin-bookings.pdf>. Consultado el
  28/10/2026.
- Zocdoc. (s. f.). *Customer support and cancellations*.
  <https://www.zocdoc.com/blog/facts/customer-support-and-cancellations/>. Consultado el
  28/10/2026.
- Zocdoc. (s. f.). *Appointments, cancellations and no-shows*. The Paper Gown.
  <https://thepapergown.zocdoc.com/facts/appointments-cancellations-no-shows/>. Consultado
  el 28/10/2026.
- W3C. (s. f.). *Understanding Success Criterion 1.4.3: Contrast (Minimum)*. Web
  Accessibility Initiative. <https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html>.
  Consultado el 29/10/2026.

Las referencias de Doctoralia y Zocdoc las consultó P3; P1 solo las pasó a formato APA. Las
fechas de publicación no aparecen en las fuentes, por eso se usa "(s. f.)".
