# 1. Ficha del problema

Responde a las secciones 4 y 6.1 del enunciado. **Toda la organización es ficticia.** Las
cifras de la clínica (número de sedes, médicos, especialidades) son datos del escenario
inventado para dar contexto; **no** son estadísticas reales ni provienen de una fuente.

## 1.1 Organización

| Campo | Descripción |
| --- | --- |
| Nombre | Clínica Ambulatoria San Rafael (ficticia) |
| Tipo | Consultorio ambulatorio privado de consulta externa. No tiene urgencias ni hospitalización. |
| Sede | Una sola sede (múltiples sedes queda fuera del MVP). |
| Servicios del escenario | 4 especialidades: Medicina general, Pediatría, Odontología y Dermatología. |
| Personal del escenario | 8 profesionales de salud y 2 recepcionistas. |
| Horario del escenario | Lunes a sábado, 7:00 a 18:00, hora de Colombia (America/Bogota). |

## 1.2 Situación actual

La clínica agenda las citas por llamada telefónica, mensajes de WhatsApp y presencialmente.
Cada recepcionista lleva la agenda en una hoja de cálculo propia y algunos médicos anotan
citas en una libreta. No existe una fuente única de la agenda.

## 1.3 Problema central

**La agenda de citas está dispersa en varios canales y archivos sin control de
concurrencia, lo que provoca cruces de horario, registros duplicados y falta de
información confiable para pacientes, profesionales y administración.**

## 1.4 Árbol de problema

| Causas | Problema | Consecuencias |
| --- | --- | --- |
| C1. Varias hojas de cálculo independientes, una por recepcionista. | Agenda dispersa y sin control | E1. Dos pacientes reciben la misma franja (cruce de horario). |
| C2. Las reservas por WhatsApp se anotan horas después de recibirlas. | | E2. El mismo paciente queda registrado dos veces con datos distintos. |
| C3. No hay un identificador único del paciente (se busca por nombre). | | E3. Pacientes sin confirmación: no saben si su cita quedó registrada. |
| C4. El médico no ve su agenda actualizada; depende de que recepción le avise. | | E4. El médico no conoce su agenda del día hasta llegar. |
| C5. No hay estados de cita definidos (solo "anotada" o "borrada"). | | E5. Imposible saber cuántas citas se cancelan o a cuántas no asiste el paciente. |
| C6. Los cambios de horario del médico no se cruzan con las citas ya dadas. | | E6. Citas asignadas a horarios que el médico ya no atiende. |

## 1.5 Grupos afectados

| Grupo | Cómo le afecta |
| --- | --- |
| Pacientes | Esperan en la línea telefónica, no reciben confirmación y pueden llegar a una cita que no existe o está cruzada. |
| Profesionales de salud | No conocen su agenda con anticipación y atienden cruces de horario. |
| Recepción | Reprocesos al conciliar hojas de cálculo y atender reclamos. |
| Dirección de la clínica | No tiene datos para decidir (demanda por especialidad, cancelaciones, inasistencias). |

## 1.6 Objetivo general

Desarrollar un sistema web, publicado en GitHub Pages y con persistencia en Supabase, que
centralice la agenda de la Clínica Ambulatoria San Rafael y permita a pacientes,
profesionales y administradores reservar, consultar, cancelar y administrar citas médicas
con reglas de integridad y seguridad validadas en la base de datos.

## 1.7 Objetivos específicos (medibles)

Cada objetivo se verifica con casos de prueba concretos del plan de pruebas
(`docs/pruebas/plan_pruebas.md`).

| ID | Objetivo específico | Indicador | Meta | Se verifica con |
| --- | --- | --- | --- | --- |
| OE-1 | Eliminar los cruces de horario y las reservas dobles. | Citas activas duplicadas en la misma franja o superpuestas para un profesional. | 0 en todos los intentos de prueba, incluidas reservas simultáneas. | CP-01, CP-02, CP-09, CP-11 |
| OE-2 | Permitir que el paciente reserve sin intervención de recepción. | Pasos desde el inicio de sesión hasta la confirmación de la reserva. | ≤ 5 pasos. | CP-16 |
| OE-3 | Restringir cada usuario a los datos y acciones de su rol. | Pruebas negativas de acceso (cita ajena, cambio de rol, RPC sin sesión, cita de otro profesional) que el sistema rechaza. | 100 % de las pruebas negativas rechazadas. | CP-03, CP-04, CP-06, CP-13 |
| OE-4 | Dar al profesional su agenda actualizada y control del estado de sus citas. | Transiciones de estado inválidas aceptadas por el sistema. | 0. La agenda de un día con 500 citas de prueba carga en ≤ 3 s. | CP-10, CP-17 |
| OE-5 | Entregar indicadores básicos a la administración. | Diferencia entre los indicadores del panel y un conteo SQL directo sobre los datos de prueba. | 0 diferencias (por estado, especialidad y periodo). | CP-15 |

## 1.8 Alcance del MVP

Incluye las funcionalidades obligatorias de la sección 5.2 del enunciado:

1. Registro, inicio y cierre de sesión con Supabase Auth, e instrucción de recuperación de
   contraseña.
2. Perfil del paciente (nombres, documento, teléfono, fecha de nacimiento).
3. Catálogo de especialidades y profesionales.
4. Generación de franjas concretas de atención por profesional, fecha y rango horario.
5. Búsqueda de disponibilidad por especialidad, profesional y fecha.
6. Reserva de una franja realmente disponible, con control de concurrencia.
7. "Mis citas" con fecha, hora, profesional, especialidad y estado.
8. Cancelación de citas futuras hasta 2 horas antes del inicio.
9. Agenda del profesional y cambio controlado de estado.
10. Panel administrativo: especialidades, profesionales, franjas, citas y asignación de roles.
11. Indicadores por estado, especialidad y periodo.
12. Mensajes de éxito, error, validación y confirmación.

## 1.9 Exclusiones (fuera del MVP)

| Exclusión | Motivo |
| --- | --- |
| Notificaciones por correo, SMS o WhatsApp | Requieren un servicio externo o un backend propio, fuera de las herramientas permitidas. |
| Horarios recurrentes (patrón semanal) | Se usan franjas concretas generadas en bloque (decisión C2 del plan). |
| Múltiples sedes o consultorios | La clínica del escenario tiene una sola sede. |
| Historia clínica, diagnósticos, fórmulas o resultados | Datos sensibles; el enunciado pide no recopilarlos. |
| Pagos, facturación y convenios con aseguradoras | No forman parte del problema planteado. |
| Telemedicina y lista de espera | Funciones de un siguiente incremento. |
| Creación de cuentas de terceros desde el navegador | Requiere la `service_role`, prohibida en el frontend. Se usa registro propio y promoción de rol (P10 del plan). |
| Reprogramar una cita en un solo paso | El paciente cancela y vuelve a reservar. |

## 1.10 Restricciones

- Tecnologías: solo HTML5, CSS3, JavaScript vanilla (módulos ES), GitHub Pages y Supabase.
  Sin frameworks, Node, empaquetadores ni servidor propio.
- El frontend es estático y público: solo puede contener la URL del proyecto y la clave
  `anon`/publishable. Nunca la `service_role`.
- Todas las reglas críticas se validan en PostgreSQL (restricciones, triggers, funciones RPC
  y RLS), no solo en JavaScript (sección 5.3 del enunciado).
- Plan gratuito de Supabase: el proyecto puede pausarse por inactividad (riesgo R6).
- Datos 100 % ficticios.

## 1.11 Supuestos

| ID | Supuesto |
| --- | --- |
| S1 | Los usuarios tienen un navegador moderno (Chrome o Firefox recientes) y conexión a internet. |
| S2 | Cada paciente tiene un correo electrónico propio para registrarse. |
| S3 | Todas las horas se interpretan en America/Bogota (decisión C8 del plan). |
| S4 | Una franja dura un tiempo fijo definido al generarla (por ejemplo, 20 o 30 minutos) y atiende a un solo paciente. |
| S5 | Un profesional pertenece a una sola especialidad en el MVP. |
| S6 | El primer administrador se asigna manualmente desde el SQL Editor de Supabase. |
| S7 | El docente autoriza el equipo de 4 integrantes (ver 0.1 del plan). |

## 1.12 Criterios de éxito

El proyecto se considera exitoso si:

1. Los 18 casos de prueba del plan se ejecutan y los de prioridad alta quedan en estado
   **Aprobado**, con evidencia en `docs/pruebas/`.
2. Se cumplen las metas de los objetivos OE-1 a OE-5.
3. La aplicación funciona desde la URL de GitHub Pages con cuentas de demostración de los
   tres roles.
4. La base de datos se reconstruye desde cero con los scripts de `sql/`.
5. Todo requisito de prioridad alta llega a un caso de prueba en la matriz de trazabilidad.
6. El repositorio no contiene la `service_role`, contraseñas ni datos reales.

## 1.13 Respuestas a las preguntas orientadoras (sección 6.2)

| Pregunta | Respuesta |
| --- | --- |
| ¿Qué problema concreto se resuelve y cómo se evidencia? | Agenda dispersa que provoca cruces, duplicados y falta de confirmación (1.3). En el sistema se evidencia con las pruebas de OE-1 y OE-3 y con los indicadores de estados (cancelaciones e inasistencias, antes invisibles). |
| ¿Qué información necesita cada actor y para qué decisión? | Ver la matriz de actores (`02_actores.md`), columnas "Dato utilizado" y "Decisión que apoya". |
| ¿Qué ocurre si un médico modifica su horario con reservas? | La base de datos rechaza cambiar o desactivar una franja con cita activa. Primero se cancela la cita (queda en el historial y el paciente la ve cancelada). Ver P12 del plan y CP-12. |
| ¿Cómo se evita la doble reserva simultánea? | Índice único parcial sobre `appointments(schedule_id)` para citas no canceladas y RPC `reservar_cita` atómica con bloqueo `for update`. La segunda solicitud recibe `FRANJA_OCUPADA`. Ver P2 y P7 del plan y CP-02. |
| ¿Qué datos son necesarios y cuáles sería irresponsable recopilar? | Necesarios: nombres, documento, teléfono, fecha de nacimiento, correo (en Auth) y un motivo breve de máximo 200 caracteres. Irresponsable: diagnósticos, historia clínica, medicamentos, tipo de sangre, aseguradora y dirección. |
| ¿Qué parte queda fuera del MVP? | Ver 1.9. |
