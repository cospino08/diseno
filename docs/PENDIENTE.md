# Lo que falta del proyecto

Corte: **28/10/2026**. Avance estimado: **≈ 70 %** según los pesos de la rúbrica (sección 15 del
enunciado). Lo que más pesa de lo que falta es la **implementación de las pantallas** (17 %).

Este documento sirve para **reiniciar a los agentes P1, P2, P3 y P4** en sesiones nuevas.
Se complementa con:

- `docs/prompts_agentes.md`, sección 4: el texto completo de cada rol (pegarlo primero).
- `docs/ESTADO.md`: el tablero con lo hecho y los pedidos entre agentes.
- `docs/contrato_api.md` (v1.1): tablas, RPC y códigos de error de la base de datos.

---

## 1. Situación actual

| Área | Estado |
| --- | --- |
| Análisis, requisitos, casos de uso, plan de pruebas, trazabilidad (P1) | ✅ En `main`. Falta verificarlo contra lo construido y armar el documento final. |
| Contrato, esquema, RLS, RPC, datos de prueba, pruebas de seguridad (P2) | ✅ En `main` **y cargado en Supabase**: 62/62 pruebas PASA en el proyecto real. |
| CSS, wireframes, módulos `ui/`, `auth.js`, `validacion.js`, `index.html`, `registro.html` (P3) | ✅ En `main`. |
| Esqueleto, `cliente.js`, capa `datos/`, arquitectura, README (P4) | ✅ En `main`. La capa `datos/` se escribió **antes** del contrato: hay que ajustarla. |
| Vistas `paciente/`, `profesional/`, `admin/` | ❌ **Vacías.** |
| Pruebas de interfaz con evidencias (`docs/pruebas/CP-*.md`) | ❌ No hay ninguna. |
| GitHub Pages | ✅ Activo: `https://cospino08.github.io/diseno/` |
| Supabase Auth (Redirect URLs y contraseña mínima de 8) | ✅ Configurado por el coordinador. |
| Cuentas demo (`admin@`, `profesional1@`, `profesional2@`, `paciente1@`, `paciente2@demo.test`) | ✅ Creadas y confirmadas. Las contraseñas las tiene el coordinador, **fuera del repo**. Pídeselas para probar. |

**Ojo:** muchos "Pedidos" que aparecen en `docs/ESTADO.md` se escribieron **antes** de que
existiera el contrato v1.1, y probablemente ya están resueltos ahí. Cada agente debe revisar
sus pedidos contra `docs/contrato_api.md`, marcar con ✅ los resueltos y dejar solo los que
siguen abiertos.

---

## 2. Ronda 2: construir las pantallas

### P1: Análisis y documentación

1. Integrar `docs/investigacion_plataformas.md` (de P3) en el análisis.
2. Revisar la trazabilidad (`docs/trazabilidad.md`) contra `docs/contrato_api.md` v1.1 y
   `sql/`, y llenar la columna "Verificado" de lo que ya existe.
3. Verificar la fuente WCAG de RNF-07 (marcada `[POR VERIFICAR]`).
4. Empezar `docs/documento_final.md` (entregable 1) con todas las secciones del entregable 1
   del enunciado (sección 14): problema, objetivos, alcance, investigación, procesos, actores,
   requisitos, casos de uso, arquitectura, interfaces, modelo ER, diccionario, seguridad,
   riesgos, pruebas y trazabilidad. Enlaza o resume los documentos de los demás.
5. Preparar `docs/pruebas/plantilla_evidencia.md` con el formato que deben seguir todos:
   requisito, datos usados, resultado esperado, resultado obtenido, estado y captura.

### P2: Base de datos y seguridad

1. Responder los pedidos de P3 y P4 en `docs/ESTADO.md`: marcar los resueltos por el contrato
   v1.1 y atender los que falten.
2. Si cambias algo del SQL, súbelo como **script nuevo y aditivo** (por ejemplo
   `sql/cambios/001_<descripcion>.sql`) y avisa al coordinador para ejecutarlo en Supabase.
   La base real **ya tiene datos**: no vuelvas a pedir que se ejecute `esquema.sql` desde cero
   sin avisar que hace falta `reiniciar.sql`.
3. Si cambias `pruebas_seguridad.sql`, debe seguir dando todo PASA.
4. Cuando P3 y P4 tengan pantallas publicadas: pruebas desde el navegador
   (`docs/modelo_datos/pruebas_seguridad.md`, sección 2) con evidencias de CP-02, 03, 04, 06,
   09, 13, 19 y 23 en `docs/pruebas/`.
5. Trabaja en `/home/carlos/Documents/GitHub/diseno-p2`, **no** en `diseno`.

### P3: Interfaz, acceso y paciente

1. Quitar el cliente temporal de `auth.js` e importar `supabase` desde
   `assets/js/datos/cliente.js`.
2. Revisar que `ui/mensajes.js` traduzca todos los códigos de la sección 4 del contrato y los
   técnicos de `datos/respuesta.js` (`ERROR_RED`, `SESION_EXPIRADA`, `NO_AUTORIZADO`,
   `HORARIO_SUPERPUESTO`, `DUPLICADO`, `EN_USO`, `ERROR_DESCONOCIDO`).
3. Construir `paciente/` según `docs/wireframes/paciente.md` y la sección 5 del contrato
   ("Recetas por pantalla"):
   - inicio;
   - buscar disponibilidad (`franjas_disponibles`);
   - confirmar reserva (`reservar_cita`; si llega `FRANJA_OCUPADA`, avisar y recargar);
   - mis citas (`mis_citas`) con cancelación (`cancelar_cita`, regla de 2 horas);
   - perfil (completar o editar).
4. Probar de punta a punta contra Supabase con `paciente1@demo.test`: registro de una cuenta
   nueva, perfil incompleto, reserva, cancelación y recuperación de contraseña.
5. Documentar en `docs/pruebas/` las pruebas CP-01, 05, 07, 08, 14, 16, 18, 20, 21 y 26.

### P4: Profesional, administración y despliegue

1. Ajustar `assets/js/datos/` a `docs/contrato_api.md` v1.1: nombres de RPC, parámetros,
   columnas devueltas (`mis_citas`, `citas_admin`, `mi_agenda`, `indicadores_citas`) y códigos
   de error.
2. Construir `profesional/` según `docs/wireframes/profesional_admin.md`:
   - agenda propia (`mi_agenda`);
   - detalle de cita y cambio de estado (`cambiar_estado_cita`), mostrando solo las
     transiciones válidas.
3. Construir `admin/`:
   - resumen;
   - especialidades (crear, editar, activar y desactivar);
   - profesionales (promover con `asignar_rol`);
   - horarios (`generar_franjas`; avisar `HORARIO_SUPERPUESTO` y `FRANJA_CON_CITA`);
   - citas (`citas_admin`);
   - pacientes (`cambiar_activo_perfil`, `anonimizar_paciente`), en el archivo
     `admin/pacientes.html` (nombre que espera P1);
   - indicadores (`indicadores_citas`) por estado, especialidad y periodo.
4. Usar `protegerPagina({ roles: [...] })` de `auth.js`, los módulos de `ui/` y el CSS de P3.
   No crear otro sistema de estilos.
5. Probar contra Supabase con `profesional1@demo.test` y `admin@demo.test`.
6. Documentar en `docs/pruebas/` las pruebas CP-10, 11, 12, 15, 17, 22, 24, 25 y 27.
7. Confirmarle a P1 las rutas reales de las pantallas y del diagrama de arquitectura.

**La ronda 2 termina cuando** los PR de P3 y P4 con todas las pantallas estén en `main`, y
`https://cospino08.github.io/diseno/` permita completar los flujos de los 3 roles.

---

## 3. Ronda 3: validación y entrega

| Quién | Tarea |
| --- | --- |
| Todos | Ejecutar sus casos de prueba **en la URL publicada** y guardar las evidencias. Corregir lo que falle y documentar la corrección. |
| P1 | Consolidar los resultados en `docs/pruebas/plan_pruebas.md`, cerrar la trazabilidad (todo RF de prioridad alta llega a una prueba con evidencia), terminar `docs/documento_final.md` y la bibliografía. |
| P2 | Comprobar que la base se reconstruye desde cero con los scripts, idealmente en un proyecto Supabase de prueba aparte. Evidencias de seguridad desde el navegador. |
| P3 | Revisar accesibilidad (teclado, contraste, `label`) y responsive a 360 px en **todas** las pantallas, incluidas las de P4. |
| P4 | Terminar el README: integrantes, URL publicada, credenciales demo **sin contraseñas** y funciones pendientes con honestidad. Revisar que el repo no tenga secretos. |
| Todos | Completar sus entradas en `docs/bitacora_ia.md`. Escribir en `docs/sustentacion.md` las respuestas a las preguntas de la sección 18 del enunciado que les toquen (ver la sección 13 de `docs/plan_trabajo.md`). |

**La ronda 3 termina cuando** se cumple toda la lista de verificación (sección 12 de
`docs/plan_trabajo.md`).

---

## 4. Lo que solo puede hacer el humano

- Ejecutar en Supabase los scripts SQL nuevos de P2 (o pedírselo al coordinador).
- Pasar las contraseñas demo a quien las necesite, sin escribirlas en el repo.
- Grabar el video de evidencias de los flujos (entregable 5).
- Pedir al docente autorización para 4 integrantes, si aún no se hizo.
- Estudiar el sistema completo para la sustentación: cada integrante debe poder explicar
  cualquier parte.

---

## 5. Texto para reiniciar a cada agente

En una sesión nueva, primero pega el bloque completo del rol desde `docs/prompts_agentes.md`
(sección 4) y luego esto, cambiando `Px` por el rol:

```text
Retomas como Px en la ronda 2. Antes de nada:
1. Ve a tu carpeta (/home/carlos/Documents/GitHub/diseno-p1, -p2, -p3 o -p4), haz
   git fetch y crea una rama nueva desde origin/main (por ejemplo px/ronda2).
2. Lee completos docs/PENDIENTE.md, docs/ESTADO.md y docs/contrato_api.md.
3. Revisa los pedidos para ti en ESTADO.md: marca con ✅ los ya resueltos y atiende los
   abiertos.
4. Sigue con tu lista de la sección 2 de PENDIENTE.md, en orden.
Al terminar cada bloque: commit, push, PR, y actualiza tu sección de ESTADO.md y la bitácora.
```
