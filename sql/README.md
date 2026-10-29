# Scripts SQL

Dueño: P2. Reconstruyen la base de datos completa en un proyecto Supabase vacío.

## Orden de ejecución (SQL Editor de Supabase)

| Paso | Archivo | Qué hace |
| --- | --- | --- |
| 0 | *(manual)* | Crear las 5 cuentas demo en **Authentication → Users → Add user** con "Auto Confirm User": `admin@`, `profesional1@`, `profesional2@`, `paciente1@`, `paciente2@demo.test`. La contraseña la elige el equipo y **no se escribe en el repositorio**. |
| 1 | `esquema.sql` | Tipos, tablas, restricciones, índices y triggers. |
| 2 | `politicas_rls.sql` | Permisos, RLS en todas las tablas y funciones RPC. **Ejecutarlo siempre justo después del paso 1**: sin él, las tablas quedan expuestas con los permisos por defecto de Supabase. |
| 3 | `datos_prueba.sql` | Datos ficticios (más de 500 citas) y nombramiento del **primer admin** (sección 2 del archivo). |
| 4 | `pruebas_seguridad.sql` | Pruebas CP-02, 03, 04, 06, 09, 13 (y 07, 10, 11, 12). No deja cambios. Todas deben decir PASA. |

Cada archivo corre en una transacción: si falla, no queda nada a medias.

Para reconstruir desde cero: `reiniciar.sql` y luego los pasos 1 a 3. Conserva las cuentas
demo de Authentication.

## Pruebas locales

`local/` contiene lo mínimo para simular Supabase en un PostgreSQL normal (roles, esquema
`auth`, cuentas demo sin contraseña). **No se ejecuta en Supabase.** Instrucciones en
`docs/modelo_datos/pruebas_seguridad.md`.

## Documentación relacionada

- Contrato con el frontend: `docs/contrato_api.md`
- Diagrama ER, diccionario de datos, matriz de permisos y pruebas: `docs/modelo_datos/`
