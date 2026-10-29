# Bitácora de fuentes e IA

Registro exigido por la sección 13 del enunciado. Cada integrante o agente agrega sus
entradas al final de la tabla.

| Fecha | Quién | Herramienta o fuente | Propósito | Qué se utilizó | Modificación realizada | Cómo se verificó |
| --- | --- | --- | --- | --- | --- | --- |
| 28/10/2026 | Coordinación | Claude Code (Claude Opus 5.5) | Leer el enunciado, proponer el plan de trabajo para 4 integrantes y anticipar problemas técnicos | `docs/plan_trabajo.md` y `docs/prompts_agentes.md` | Pendiente de revisión por el equipo | Pendiente: revisar el SQL de referencia contra la documentación oficial de Supabase y PostgreSQL |
| 28/10/2026 | P4 | Claude Code (Claude Opus 5.5) | Crear el esqueleto del repositorio, el cliente de Supabase y la capa de acceso a datos | `.gitignore`, `assets/js/config.example.js`, `assets/js/datos/*.js` | Se corrigió durante la sesión: el patrón que extrae el código de error confundía "JWT expired" con un código del contrato; y `.order()` con `referencedTable` no ordena las citas, así que el orden por fecha se hace en el navegador | `node --check` en cada módulo (solo verificación local, Node no es parte del proyecto) y 8 casos de prueba de `codigoDeError` (8/8). Pendiente: probar contra la base real cuando P2 publique el SQL |
| 28/10/2026 | P4 | Claude Code (Claude Opus 5.5) | Redactar la arquitectura cliente-nube y el README | `docs/arquitectura/arquitectura.md`, `README.md` | Las contraseñas de demo no se escriben en el repo; se dejan para que el equipo las entregue al docente | Revisión contra las secciones 8.1, 10 y 11.1 del enunciado. Pendiente: comprobar que GitHub renderiza los diagramas Mermaid |
