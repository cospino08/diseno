# Investigación: comparación de dos plataformas de citas médicas

Producto de la sección 6.1 del enunciado ("Comparar dos plataformas de citas disponibles en
la web. Registrar enlaces y fecha de consulta"). Responsable: P3. P1 lo integra en el
documento de análisis.

**Objetivo:** identificar patrones, buenas prácticas, vacíos y decisiones de diseño. No se
busca copiar las plataformas.

**Fecha de consulta de todas las fuentes:** 28/10/2026.

## 1. Plataformas elegidas y por qué

| Plataforma | País de origen | Por qué se eligió |
| --- | --- | --- |
| **Doctoralia** (doctoralia.co) | España, con operación en Colombia | Es la plataforma de reserva en línea más conocida en Colombia y está en español. Su contexto es el más parecido al de la clínica ficticia. |
| **Zocdoc** (zocdoc.com) | Estados Unidos | Es un referente internacional y publica sus políticas de cancelación, inasistencia y recordatorios. Sirve de contraste con Doctoralia. |

## 2. Fuentes consultadas

| # | Fuente | Enlace | Fecha de consulta | Qué se obtuvo |
| --- | --- | --- | --- | --- |
| F1 | Doctoralia Colombia, página de inicio | <https://www.doctoralia.co/> | 28/10/2026 | Buscador, mensajes de confirmación inmediata y recordatorio por SMS. |
| F2 | Doctoralia Colombia, listado "Médico general en Bogotá" | <https://www.doctoralia.co/medico-general/bogota> | 28/10/2026 | Filtros y contenido de la tarjeta de cada profesional. |
| F3 | Doctoralia Pro, infografía "¿Cómo se generan tus citas en Doctoralia?" | <https://pro.doctoralia.es/hubfs/ES-infographic-CM-admin-bookings.pdf> | 28/10/2026 | Flujo de reserva visto por el profesional, cancelación y liberación del hueco. |
| F4 | Zocdoc, "Customer support and cancellations" | <https://www.zocdoc.com/blog/facts/customer-support-and-cancellations/> | 28/10/2026 | Cancelación y reprogramación por autoservicio, recordatorios y límites por inasistencia. |
| F5 | Zocdoc (The Paper Gown), "Appointments, cancellations and no-shows" | <https://thepapergown.zocdoc.com/facts/appointments-cancellations-no-shows/> | 28/10/2026 | Disponibilidad en tiempo real, anticipación mínima de reserva y calendario de recordatorios. |

> **Limitación de la investigación (con honestidad):** la página de inicio de Zocdoc
> (<https://www.zocdoc.com/>) respondió **HTTP 403** a la herramienta de consulta
> automática, así que su buscador no se pudo revisar directamente. Lo que se dice de Zocdoc
> sale **solo** de F4 y F5. Tampoco se completó una reserva real en ninguna plataforma: no
> se crearon cuentas, para no registrar datos personales. Antes de la sustentación, un
> integrante debería abrir ambos sitios en el navegador, sin reservar, y confirmar los
> puntos marcados como "no verificado".

## 3. Comparación

| Criterio | Doctoralia | Zocdoc | Fuente |
| --- | --- | --- | --- |
| **Búsqueda** | Un solo campo: "especialidad, enfermedad o nombre", más la ciudad ("p. ej. Bogotá") y el botón "Buscar". Pestañas "Visita presencial" / "En línea". | No verificado: la página de inicio respondió 403. | F1 |
| **Filtros del listado** | "Consulta en línea", "Fechas disponibles", "Seguro" (lista de aseguradoras), "Más filtros" y "Mapa". No tiene filtro de precio ni ordenamiento. | Permite cargar el seguro y elegir el plan antes de reservar. | F2, F5 |
| **Datos en la tarjeta del profesional** | Nombre con "Dr."/"Dra.", especialidad, subespecialidades, número de opiniones, dirección, modalidad, servicios con precio e insignias ("Destacado"). | No verificado. | F2 |
| **Disponibilidad** | "Elige la hora que prefieras": el paciente elige un "hueco libre" en la agenda del profesional. | "Online availability reflects your calendar in real time". Las reservas de todos los canales actualizan la agenda. | F1, F3, F5 |
| **Prevención de doble reserva** | Promete "Sin solapamientos ni errores" y "Sincronización a tiempo real". | La disponibilidad se actualiza en tiempo real en todos los canales. | F3, F5 |
| **Anticipación mínima para reservar** | No verificado. | Configurable por la clínica. **Por defecto, 2 horas.** | F5 |
| **Confirmación** | Inmediata: la cita queda "confirmada al instante" y aparece como "Reserva confirmada en tu agenda". | No verificado. | F1, F3 |
| **Cancelación** | "El paciente puede cancelar desde Doctoralia sin llamarte". "La cancelación se refleja al instante y se libera ese hueco". | "Cancel or reschedule in a few taps" desde la cuenta o la aplicación. Sin costo para el paciente. | F3, F4 |
| **Inasistencias** | No verificado. | Si el paciente falta, reprograma o cancela tarde con frecuencia, su acceso se puede limitar, suspender o cerrar. | F4, F5 |
| **Recordatorios** | Automáticos. SMS al teléfono antes de la cita. | Correo 7 días y 1 día antes; mensaje de texto unas 3 horas antes. | F1, F3, F5 |
| **Costo para el paciente** | "La reserva de cita es un servicio gratuito". | No cobra por reservar, cancelar ni reprogramar. | F1, F4 |
| **Registro de la cuenta** | Botones "Registrarse gratuitamente" e "Iniciar sesión". No se verificó si exige cuenta antes de reservar. | La gestión de citas se hace desde la cuenta o la aplicación. | F1, F4 |

## 4. Hallazgos y cómo influyen en nuestro diseño

| # | Hallazgo | Decisión en nuestro sistema | Dónde se aplica |
| --- | --- | --- | --- |
| H1 | Las dos plataformas presentan la disponibilidad como **huecos concretos** que el paciente elige. | Cada fila de `schedules` es una franja concreta (decisión C2 del plan). La búsqueda muestra franjas como **botones de hora** agrupados por profesional. | Wireframe P-02 |
| H2 | Doctoralia libera el hueco **al instante** cuando se cancela. | Al cancelar, la cita pasa a `cancelada` y la franja vuelve a estar disponible gracias al índice único parcial (plan, P2). | CP-09, wireframe P-04 |
| H3 | Zocdoc pone por defecto **2 horas** de anticipación mínima. | Coincide con nuestra regla de cancelar hasta 2 h antes (C4). Así la regla tiene un referente real. | `cancelar_cita`, CP-08 |
| H4 | Las dos plataformas permiten **cancelar sin llamar**. | "Mis citas" tiene un botón "Cancelar" en cada cita futura cancelable y pide confirmación antes de hacerlo. | Wireframe P-04 |
| H5 | Las dos plataformas confirman la cita de inmediato. | Después de `reservar_cita`, la pantalla de éxito muestra fecha, hora, profesional, especialidad y estado "Programada". | Wireframe P-03b |
| H6 | El buscador de Doctoralia es un solo campo libre y mezcla especialidad, enfermedad y nombre. | **Vacío o riesgo:** buscar por enfermedad invita a escribir datos clínicos. Usamos **listas desplegables** (especialidad, profesional) y fecha. No hay campo libre en la búsqueda, y el "motivo" se limita a 200 caracteres con un aviso de no escribir información clínica. | Wireframe P-02, plan P15 |
| H7 | Las tarjetas de Doctoralia muestran precios, opiniones e insignias pagadas ("Destacado"). | **Fuera del MVP:** pagos, opiniones y posicionamiento pagado. La tarjeta solo muestra nombre público, especialidad y horas. | Exclusiones (P1) |
| H8 | Zocdoc envía recordatorios en varios momentos y por varios canales. | **Fuera del MVP:** notificaciones por correo o SMS (plan, sección 5). Se documenta como siguiente incremento. | README, sección 18 |
| H9 | Zocdoc sanciona las inasistencias repetidas. | **Fuera del MVP.** El estado `no_asistio` sí se registra (lo marca el profesional), así que los indicadores pueden contar inasistencias y servir de base para una regla futura. | Indicadores (P4) |
| H10 | Doctoralia separa "Visita presencial" de "En línea". | **Fuera del MVP:** telemedicina. Solo hay atención presencial. | Exclusiones (P1) |

## 5. Conclusión

Las dos plataformas siguen el mismo patrón básico: **buscar → elegir un hueco libre →
confirmar → recibir confirmación → poder cancelar uno mismo**. Nuestro flujo de reserva
sigue ese patrón en 4 acciones después de iniciar sesión, dentro del máximo de 5 que exige
RNF-03 (ver `docs/wireframes/README.md`, sección 3).

Nos diferenciamos a propósito en dos puntos: no tenemos búsqueda por texto libre (para no
recopilar datos clínicos) y la regla de doble reserva vive en la base de datos, no solo en
la interfaz. Lo que dejamos fuera (pagos, opiniones, recordatorios, telemedicina,
sanciones) está declarado como exclusión del MVP.
