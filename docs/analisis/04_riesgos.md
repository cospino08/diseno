# 4. Matriz de riesgos

Responde a las secciones 6.1 y 6.3 del enunciado (mínimo 3 riesgos con probabilidad,
impacto, prevención y respuesta). Amplía la sección 9 del plan de trabajo.

**Escala:** probabilidad e impacto en Baja (1), Media (2), Alta (3). Nivel = P × I:
1–2 bajo, 3–4 medio, 6–9 alto.

| ID | Riesgo | Prob. | Impacto | Nivel | Prevención | Respuesta si ocurre | Dueño |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | Las RPC de la base se retrasan y bloquean el frontend. | Alta (3) | Alto (3) | 9 | P2 publica `docs/contrato_api.md` al inicio del Hito 3. | El frontend avanza con datos de prueba según el contrato. | P2 |
| R2 | Una política RLS mal escrita expone datos de otros pacientes. | Media (2) | Alto (3) | 6 | Pruebas negativas con 3 cuentas (CP-03, CP-04, CP-06, CP-13) en cada cambio de políticas. | Corregir la política y repetir todas las pruebas de seguridad. | P2 |
| R3 | Doble reserva bajo solicitudes simultáneas. | Media (2) | Alto (3) | 6 | Índice único parcial + RPC atómica; prueba concurrente CP-02. | Revisar la transacción y el índice; repetir CP-02. | P2 |
| R4 | Un integrante no domina el código ajeno en la sustentación. | Media (2) | Alto (3) | 6 | Revisión cruzada de PR y ronda de explicaciones antes de la sustentación. | Sesión extra de explicación del módulo. | P1 |
| R5 | El docente no autoriza 4 integrantes. | Media (2) | Alto (3) | 6 | Pedir autorización en el Hito 1. | Dividir en 2 equipos según 0.1 del plan. | P1 |
| R6 | El plan gratuito de Supabase pausa el proyecto por inactividad. | Media (2) | Medio (2) | 4 | Entrar al proyecto cada semana y reactivarlo antes de la sustentación. | Reconstruir la base desde los scripts de `sql/`. | P4 |
| R7 | Se publica una clave secreta en el repositorio. | Baja (1) | Alto (3) | 3 | Solo la clave `anon` en `config.js`; revisión en cada PR. | Rotar la clave en Supabase de inmediato. | P4 |
| R8 | Los requisitos documentados no coinciden con lo construido. | Media (2) | Medio (2) | 4 | P1 revisa el contrato y el código antes de cerrar la trazabilidad. | Actualizar requisitos o registrar la diferencia como limitación en el README. | P1 |
| R9 | Inyección de HTML (XSS) con datos de la base. | Media (2) | Alto (3) | 6 | Prohibido `innerHTML` con datos de la base; revisión en PR; prueba CP-18. | Reemplazar por `textContent` y repetir CP-18. | P3, P4 |
| R10 | Se registran datos clínicos sensibles en el campo motivo. | Media (2) | Medio (2) | 4 | Motivo limitado a 200 caracteres y aviso en la interfaz; datos de prueba ficticios. | Eliminar o anonimizar el dato y reforzar el aviso. | P3 |
| R11 | Errores por zona horaria (franjas mal clasificadas como pasadas o futuras). | Media (2) | Medio (2) | 4 | Todas las comparaciones en America/Bogota dentro de la base (C8). | Corregir la función y repetir CP-07 y CP-08. | P2 |
