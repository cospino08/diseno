**PROYECTO INTEGRADOR**

# Análisis diseño y desarrollo de un sistema web de reserva de citas médicas

**HTML CSS JavaScript GitHub Pages y Supabase**

| **Asignatura** | **Población** | **Modalidad** |
| --- | --- | --- |
| Análisis y Diseño de Software | Estudiantes de Ingeniería de Software | Proyecto por equipos |

**Propósito**

Aplicar el ciclo completo de análisis y diseño para transformar una necesidad real del sector salud en un producto mínimo viable funcional, documentado, seguro y desplegado en la web.

**Docente: Ing. Mg. José Javier Zapata Polo**

Documento de orientaciones para el estudiante

# 1 Presentación de la actividad

Este proyecto integra los aprendizajes trabajados en clase sobre definición de sistemas de información, análisis del problema, levantamiento de requisitos, modelado, diseño de datos, prototipado, construcción y validación. El reto consiste en desarrollar un sistema web de reserva de citas médicas que responda a necesidades reales de pacientes, profesionales de la salud y personal administrativo.

El resultado no se evaluará únicamente por “funcionar”. Cada equipo deberá demostrar por qué construyó determinadas funciones, cómo se relacionan con los requisitos y de qué manera el modelo de datos, la interfaz y las pruebas responden al problema analizado.

# 2 Resultado de aprendizaje esperado

Al finalizar, el estudiante estará en capacidad de analizar una situación organizacional, especificar requisitos funcionales y no funcionales, modelar procesos y datos, diseñar una solución web, implementar un MVP con persistencia en la nube y validar su correspondencia con las necesidades de los usuarios.

# 3 Organización sugerida

| **Aspecto** | **Orientación** |
| --- | --- |
| Conformación | Equipos Maximo 2 estudiantes. |
| Tecnologías obligatorias | HTML5, CSS3, JavaScript, GitHub Pages y Supabase. |
| Modalidad de entrega | Repositorio, aplicación desplegada, documentación y sustentación. |
| Caso | Consultorio o clínica ambulatoria ficticia, pero plausible. No usar datos clínicos reales. |

# 4 Situación problema

Una institución de salud gestiona las citas mediante llamadas, mensajes y archivos separados. Como consecuencia, se presentan cruces de horarios, registros duplicados, pacientes sin confirmación, dificultad para consultar la disponibilidad de los médicos y poca información para la toma de decisiones. La institución requiere un sistema web que centralice la agenda y permita reservar, consultar, cancelar y administrar citas.

El equipo actuará como una pequeña célula de análisis y desarrollo. Deberá investigar cómo funcionan los procesos de agendamiento, definir el alcance del sistema y justificar sus decisiones sin asumir que la primera idea es necesariamente la mejor solución.

# 5 Alcance mínimo del sistema

## 5.1 Actores

| **Actor** | **Responsabilidad principal** |
| --- | --- |
| Paciente | Registrarse, consultar disponibilidad, reservar y gestionar sus propias citas. |
| Profesional de salud | Consultar su agenda y actualizar el estado de las citas asignadas. |
| Administrador o recepcionista | Gestionar especialidades, médicos, horarios, pacientes y citas; consultar indicadores. |

## 5.2 Funcionalidades obligatorias

- Registro e inicio de sesión mediante Supabase Auth. Cada usuario debe acceder solo a las funciones autorizadas por su rol.

- Gestión del perfil del paciente: nombres, documento, teléfono y fecha de nacimiento. Evitar información clínica sensible.

- Catálogo de especialidades y profesionales disponibles.

- Configuración de horarios de atención por profesional, fecha y franja horaria.

- Búsqueda de disponibilidad por especialidad, profesional y fecha.

- Reserva de una cita seleccionando un horario realmente disponible.

- Consulta de “Mis citas” con fecha, hora, profesional, especialidad y estado.

- Cancelación de citas futuras, con regla de anticipación definida por el equipo.

- Panel del profesional con agenda propia y cambio controlado de estado: programada, confirmada, atendida, cancelada o no asistió.

- Panel administrativo para crear, editar, activar o desactivar especialidades, profesionales y horarios.

- Indicadores básicos: citas por estado, por especialidad y por periodo.

- Mensajes claros de éxito, error, validación y confirmación de acciones relevantes.

## 5.3 Reglas de negocio mínimas

- No se puede reservar una franja ya ocupada ni una fecha pasada.

- Un profesional no puede tener dos citas superpuestas.

- El paciente no puede modificar citas de otra persona.

- El profesional solo puede administrar citas que le han sido asignadas.

- El administrador puede gestionar catálogos y agendas, pero las acciones deben quedar asociadas al usuario autenticado.

- Una cita cancelada libera la franja según la estrategia de modelado elegida.

- Los estados deben cambiar mediante transiciones válidas. Ejemplo: una cita atendida no debe volver a programada sin una regla explícita.

- Todos los controles críticos deben validarse en la base de datos o mediante políticas, no únicamente en la interfaz.

# 6 Fase 1 Investigación y análisis

Antes de programar, el equipo debe indagar en fuentes confiables sobre el proceso de asignación de citas y analizar al menos dos sistemas existentes. No se busca copiarlos, sino identificar patrones, buenas prácticas, vacíos y decisiones de diseño.

## 6.1 Actividades de análisis

- Describir la organización, el problema, sus causas, consecuencias y grupos afectados.

- Formular un objetivo general y entre tres y cinco objetivos específicos medibles.

- Definir alcance, exclusiones, restricciones, supuestos y criterios de éxito.

- Identificar actores, necesidades, tareas, permisos y posibles conflictos.

- Representar el proceso actual AS IS y el proceso propuesto TO BE mediante BPMN simplificado, diagrama de actividades o flujograma.

- Comparar dos plataformas de citas disponibles en la web. Registrar enlaces y fecha de consulta.

- Proponer al menos tres riesgos del proyecto y sus medidas de tratamiento.

## 6.2 Preguntas orientadoras

- ¿Qué problema concreto se desea resolver y cómo se evidencia?

- ¿Qué información necesita cada actor y para qué decisión?

- ¿Qué ocurre si un médico modifica su horario después de existir reservas?

- ¿Cómo se evita la doble reserva bajo solicitudes simultáneas?

- ¿Qué datos son necesarios y cuáles sería irresponsable recopilar?

- ¿Qué parte queda fuera del MVP?

## 6.3 Productos de la fase

| **Producto** | **Contenido mínimo** |
| --- | --- |
| Ficha del problema | Contexto, causas, efectos, actores, objetivo y límites. |
| Investigación | Comparación de dos soluciones con fuentes y hallazgos. |
| Modelo del proceso | AS IS y TO BE con explicación. |
| Matriz de actores | Actor, necesidad, responsabilidad, permiso y dato utilizado. |
| Riesgos | Probabilidad, impacto, prevención y respuesta. |

# 7 Fase 2 Especificación de requisitos

Los requisitos deben ser claros, verificables, consistentes, necesarios y trazables. Eviten expresiones ambiguas como “rápido”, “fácil” o “seguro” si no se define cómo se comprobarán.

## 7.1 Requisitos funcionales

Documenten al menos 15 requisitos funcionales identificados como RF-01, RF-02, etc. Cada requisito debe incluir descripción, actor, prioridad, fuente y criterio de aceptación.

| **ID** | **Requisito de ejemplo** | **Criterio de aceptación** |
| --- | --- | --- |
| RF-06 | El sistema permitirá al paciente reservar una cita en una franja disponible. | Dado un paciente autenticado y una franja libre, cuando confirma la reserva, se crea una sola cita y la franja deja de aparecer disponible. |
| RF-10 | El profesional consultará únicamente su agenda. | Al ingresar como profesional, la consulta no retorna citas asignadas a otro profesional. |

## 7.2 Requisitos no funcionales

Especifiquen al menos ocho requisitos no funcionales, incluyendo seguridad, usabilidad, rendimiento, compatibilidad, accesibilidad, mantenibilidad y disponibilidad. Deben ser medibles cuando sea posible.

| **ID** | **Categoría** | **Ejemplo verificable** |
| --- | --- | --- |
| RNF-01 | Seguridad | Las tablas con datos personales tendrán RLS habilitado y políticas por rol o propietario. |
| RNF-02 | Rendimiento | La agenda de un día cargará en máximo 3 segundos con 500 citas de prueba bajo una conexión estable. |
| RNF-03 | Usabilidad | Una persona podrá reservar en máximo cinco pasos después de iniciar sesión. |
| RNF-04 | Compatibilidad | La interfaz será usable en las dos últimas versiones de Chrome y Firefox y en una pantalla móvil de 360 px. |

## 7.3 Casos de uso o historias de usuario

Presenten un diagrama general de casos de uso y documenten como mínimo ocho casos de uso detallados. Como alternativa complementaria, pueden redactar historias de usuario, pero los flujos críticos deberán conservar precondiciones, flujo principal, alternativas, excepciones y postcondiciones.

| **Elemento** | **Ejemplo** |
| --- | --- |
| Historia | Como paciente, quiero consultar franjas disponibles por especialidad para reservar una cita compatible con mi horario. |
| Precondición | El paciente ha iniciado sesión y existen horarios publicados. |
| Excepción | Si otra persona reserva la franja antes de confirmar, el sistema informa el conflicto y actualiza la disponibilidad. |
| Aceptación | La reserva queda vinculada al usuario; no se duplica la franja; se muestra confirmación. |

# 8 Fase 3 Diseño de la solución

## 8.1 Arquitectura propuesta

La solución seguirá una arquitectura web cliente nube. GitHub Pages publicará el frontend estático. El navegador ejecutará HTML, CSS y JavaScript. Supabase suministrará autenticación, PostgreSQL, API y políticas de seguridad. El equipo deberá incluir un diagrama de arquitectura y explicar la responsabilidad de cada componente.

## 8.2 Diseño de interfaz

- Mapa de navegación por rol.

- Wireframes de las pantallas principales antes de programar.

- Diseño responsive para computador y móvil.

- Jerarquía visual, contraste, etiquetas claras, retroalimentación y prevención de errores.

- Estados de interfaz: cargando, vacío, error, acceso denegado y operación exitosa.

- No insertar valores provenientes de la base de datos con innerHTML; usar textContent y creación segura de nodos.

## 8.3 Pantallas mínimas

| **Módulo** | **Pantallas o vistas** |
| --- | --- |
| Acceso | Registro, inicio de sesión, recuperación o instrucción de recuperación, cierre de sesión. |
| Paciente | Inicio, buscar disponibilidad, confirmar reserva, mis citas, perfil. |
| Profesional | Agenda propia, detalle de cita, cambio de estado. |
| Administración | Resumen, especialidades, profesionales, horarios, citas e indicadores. |

# 9 Modelo relacional mínimo

El modelo podrá ajustarse si el equipo justifica la decisión. Debe entregarse el diagrama entidad relación, el diccionario de datos y el script SQL reproducible.

| **Tabla** | **Campos esenciales y propósito** |
| --- | --- |
| profiles | id UUID FK a auth.users, nombres, documento, teléfono, fecha_nacimiento, rol, activo, created_at. |
| specialties | id, nombre, descripción, activo. |
| professionals | id, profile_id, specialty_id, registro_profesional opcional, activo. |
| schedules | id, professional_id, fecha, hora_inicio, hora_fin, estado o disponibilidad. |
| appointments | id, patient_id, professional_id, schedule_id, motivo breve, estado, observaciones administrativas, created_at, cancelled_at. |
| status_history | id, appointment_id, estado_anterior, estado_nuevo, changed_by, changed_at. |

Relaciones esperadas: una especialidad agrupa muchos profesionales; un profesional publica muchos horarios; un paciente registra muchas citas; una cita ocupa una franja y puede tener múltiples cambios de estado. Definan claves primarias, foráneas, restricciones NOT NULL, UNIQUE, CHECK e índices pertinentes.

## 9.1 Decisiones obligatorias sobre integridad

- Impedir doble reserva con una restricción única o una operación atómica, no solo con una consulta previa en JavaScript.

- Definir si una franja se elimina, cambia de estado o se conserva al cancelarse una cita.

- Evitar valores libres para roles y estados mediante CHECK, tipos enumerados o tablas catálogo.

- Mantener auth.users separado de los datos públicos del perfil y enlazarlos mediante UUID.

- Documentar el tratamiento de borrado: restricción, cascada, borrado lógico o anonimización.

# 10 Seguridad y configuración de Supabase

El uso de Supabase no elimina la necesidad de diseñar la seguridad. La clave pública anon puede estar en el frontend, pero nunca debe publicarse una service_role key. Todas las tablas expuestas deberán tener Row Level Security habilitado.

| **Rol** | **Permisos esperados** |
| --- | --- |
| Paciente | Leer y actualizar su perfil; crear y consultar sus citas; cancelar únicamente citas propias válidas; consultar catálogos y disponibilidad pública. |
| Profesional | Leer su perfil, horarios y citas asignadas; actualizar solo estados permitidos de sus citas. |
| Administrador | Gestionar catálogos, profesionales, horarios y citas según el alcance aprobado. |

## 10.1 Evidencias de seguridad

- Script SQL con tablas, restricciones, índices, RLS y políticas.

- Matriz rol recurso operación que indique quién puede SELECT, INSERT, UPDATE y DELETE.

- Pruebas positivas y negativas: acceso permitido, acceso denegado y manipulación de identificadores.

- Archivo de configuración sin secretos. Si se usa un archivo de entorno local, incluirlo en .gitignore y entregar un .env.example sin valores sensibles.

- Datos ficticios. No utilizar historias clínicas, diagnósticos ni datos personales reales.

# 11 Construcción del MVP

## 11.1 Estructura sugerida del repositorio

- index.html y páginas o componentes por rol.

- assets/css con estilos organizados y responsive.

- assets/js con módulos de autenticación, acceso a datos, validación y UI.

- sql con esquema.sql, politicas_rls.sql y datos_prueba.sql.

- docs con diagramas, capturas, matriz de requisitos y manual.

- README.md con descripción, integrantes, instalación, credenciales de demostración, enlace publicado y decisiones técnicas.

## 11.2 Criterios de construcción

- Usar HTML semántico, etiquetas asociadas a controles y navegación por teclado.

- Separar presentación, lógica de interfaz y acceso a datos en archivos o módulos comprensibles.

- Validar entradas en el cliente y reforzar reglas en PostgreSQL o políticas.

- Evitar duplicación de código y nombres genéricos como dato1 o funcion2.

- Manejar promesas, errores de red y sesiones expiradas.

- No confiar en elementos ocultos de la interfaz como mecanismo de autorización.

- Registrar commits significativos de todos los integrantes; no realizar un único commit final.

# 12 Plan de pruebas

Diseñen y ejecuten al menos 15 casos de prueba. Deben incluir funcionalidad, reglas de negocio, seguridad, usabilidad básica y comportamiento responsive. Cada evidencia debe indicar requisito asociado, datos usados, resultado esperado, resultado obtenido y estado.

| **ID** | **Escenario** | **Resultado esperado** |
| --- | --- | --- |
| CP-01 | Paciente reserva una franja libre. | Se crea una única cita y desaparece la disponibilidad. |
| CP-02 | Dos sesiones intentan reservar la misma franja. | Solo una operación se confirma; la otra recibe conflicto controlado. |
| CP-03 | Paciente altera el ID para ver una cita ajena. | La política deniega el acceso y no retorna datos. |
| CP-04 | Profesional intenta actualizar una cita de otro profesional. | La operación es rechazada. |
| CP-05 | Pantalla móvil de 360 px. | No hay desplazamiento horizontal y los controles siguen siendo utilizables. |

## 12.1 Trazabilidad

Construyan una matriz que conecte necesidad, requisito, caso de uso o historia, pantalla, tabla o política y caso de prueba. Cada requisito de prioridad alta debe llegar hasta una evidencia de prueba.

| **Necesidad** | **Requisito** | **Diseño** | **Implementación** | **Prueba** |
| --- | --- | --- | --- | --- |
| Evitar cruces | RF-06 | CU Reservar cita | appointments + restricción única | CP-01 y CP-02 |

# 13 Uso responsable de investigación web e inteligencia artificial

Se permite y se recomienda investigar documentación técnica, ejemplos y patrones de diseño, así como utilizar asistentes de IA. El equipo conserva la responsabilidad académica y técnica sobre todo lo entregado.

- Verificar la información generada por IA contra documentación oficial o fuentes confiables.

- No pegar código que el equipo no pueda explicar, probar y modificar durante la sustentación.

- No ingresar datos personales reales, contraseñas, claves secretas ni información clínica en herramientas de IA.

- Registrar en una bitácora: herramienta, propósito, prompt o consulta relevante, resultado utilizado, modificación realizada y verificación aplicada.

- Citar las fuentes web y declarar el apoyo de IA en un anexo. La declaración no reduce la calificación; la falta de transparencia sí afecta la integridad de la entrega.

- Comparar alternativas y justificar decisiones. “La IA lo sugirió” no constituye una justificación técnica.

| **Fecha** | **Herramienta o fuente** | **Propósito** | **Qué se utilizó** | **Cómo se verificó** |
| --- | --- | --- | --- | --- |
| dd/mm | Ejemplo: documentación oficial de Supabase | Comprender RLS | Patrón de política por usuario | Prueba con dos cuentas |

# 14 Entregables

| **N.º** | **Entregable** | **Contenido** |
| --- | --- | --- |
| 1 | Documento de análisis y diseño | Problema, objetivos, alcance, investigación, procesos, actores, requisitos, casos de uso, arquitectura, interfaces, modelo ER, diccionario, seguridad, riesgos, pruebas y trazabilidad. |
| 2 | Repositorio GitHub | Código organizado, historial de commits, README, scripts SQL y documentación. |
| 3 | Aplicación publicada | URL funcional en GitHub Pages conectada al proyecto Supabase. |
| 4 | Base de datos reproducible | Scripts para esquema, restricciones, RLS, políticas y datos ficticios. |
| 5 | Evidencias | Capturas o breve video de los flujos y resultados de pruebas. |
| 6 | Sustentación | Demostración por roles, explicación técnica y respuestas de todos los integrantes. |
| 7 | Bitácora de fuentes e IA | Referencias consultadas, uso de IA y verificaciones realizadas. |

## 14.1 Reglas para la entrega

- La entrega debe incluir enlaces accesibles y credenciales de demostración para cada rol, usando datos ficticios.

- El docente debe poder reproducir la base de datos desde los scripts entregados.

- No compartir contraseñas personales ni claves con privilegios elevados.

- Si una función no está terminada, debe identificarse con honestidad en el README; no simular su funcionamiento mediante datos incrustados.

- Cada integrante debe estar preparado para explicar cualquier parte esencial del sistema.

# 15 Rúbrica de evaluación

| **Criterio** | **%** | **Desempeño esperado** |
| --- | --- | --- |
| Análisis del problema y proceso | 12 | Problema sustentado; objetivos, alcance, actores, AS IS y TO BE coherentes. |
| Requisitos y trazabilidad | 15 | Requisitos verificables, casos de uso completos y trazabilidad hasta pruebas. |
| Diseño de solución e interfaz | 12 | Arquitectura justificada, navegación clara, wireframes y diseño usable y responsive. |
| Modelo de datos | 15 | Modelo normalizado, relaciones, restricciones, diccionario y scripts reproducibles. |
| Seguridad y roles | 14 | Autenticación, RLS, políticas, mínimo privilegio y pruebas de acceso negativo. |
| Implementación funcional | 17 | Flujos principales completos, control de errores y reglas de negocio efectivas. |
| Pruebas y calidad | 8 | Plan ejecutado, evidencias, casos críticos y correcciones documentadas. |
| Repositorio y documentación | 4 | Código organizado, README útil y commits significativos. |
| Sustentación y uso responsable de IA | 3 | Dominio del equipo, fuentes, bitácora y capacidad de justificar decisiones. |

Total: 100 %. El docente podrá aplicar una valoración individual si un integrante no demuestra dominio del trabajo o si el historial de contribuciones evidencia participación insuficiente.

# 16 Hitos sugeridos y control de avance

| **Hito** | **Resultado para revisión** |
| --- | --- |
| Hito 1 Comprensión | Problema, objetivos, alcance, investigación, actores y proceso AS IS. |
| Hito 2 Especificación | Proceso TO BE, requisitos, casos de uso, reglas y prototipo. |
| Hito 3 Diseño técnico | Arquitectura, modelo ER, diccionario, matriz de permisos y scripts iniciales. |
| Hito 4 MVP | Autenticación, roles, reserva, agendas, administración y despliegue preliminar. |
| Hito 5 Validación | Pruebas, correcciones, trazabilidad, documentación, bitácora y sustentación. |

# 17 Lista de verificación final

☐ El problema y el alcance son comprensibles y coherentes con el MVP.

☐ Cada requisito importante tiene criterio de aceptación y prueba.

☐ Los diagramas coinciden con la aplicación construida.

☐ La base de datos impide citas duplicadas y conserva integridad referencial.

☐ RLS está habilitado y fue probado con cuentas de roles diferentes.

☐ Un paciente no puede leer ni modificar citas ajenas.

☐ Un profesional no puede actuar sobre citas no asignadas.

☐ La interfaz maneja errores, listas vacías, carga y confirmaciones.

☐ La aplicación funciona desde la URL de GitHub Pages.

☐ El repositorio no contiene service_role keys, contraseñas ni datos reales.

☐ Los scripts permiten reconstruir la solución.

☐ Todos los enlaces, fuentes y apoyos de IA están declarados.

☐ Todos los integrantes pueden explicar análisis, modelo, seguridad y código.

# 18 Preguntas para la sustentación

- ¿Qué evidencia demuestra que el sistema resuelve el problema planteado?

- ¿Qué requisito fue más difícil de implementar y por qué?

- ¿Cómo se impide una doble reserva?

- ¿Qué política RLS protege las citas de un paciente?

- ¿Qué ocurriría si una persona modifica un identificador desde el navegador?

- ¿Por qué eligieron ese modelo para horarios y disponibilidad?

- ¿Qué cambiarían para atender múltiples sedes o consultorios?

- ¿Qué recomendación de IA descartaron o modificaron y por qué?

- ¿Qué limitación permanece en el MVP y cuál sería el siguiente incremento?

# 19 Referencias técnicas recomendadas

- Documentación oficial de Supabase: autenticación, JavaScript, PostgreSQL y Row Level Security.

- Documentación de GitHub Pages para publicación de sitios estáticos.

- MDN Web Docs para HTML, CSS, JavaScript, formularios, accesibilidad y API DOM.

- OWASP Top 10 y OWASP Cheat Sheet Series para controles básicos de seguridad web.

- WCAG y recursos de WAI para accesibilidad de interfaces.

Cada equipo debe complementar estas referencias con fuentes pertinentes al dominio de citas médicas y presentar la bibliografía en un formato consistente.
