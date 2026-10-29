# Plantilla de evidencia de prueba

Formato que siguen **todos** los integrantes para documentar un caso de prueba (sección 12
del enunciado: "requisito asociado, datos usados, resultado esperado, resultado obtenido y
estado").

**Cómo usarla:**

1. Copia este archivo como `docs/pruebas/CP-XX.md` (por ejemplo, `CP-01.md`).
2. Guarda las capturas en `docs/pruebas/capturas/` con el nombre `CP-XX-N.png` (N = 1, 2…).
3. Copia el escenario, el requisito y el resultado esperado tal como están en
   `docs/pruebas/plan_pruebas.md`, tabla 8.2. Si el resultado esperado tiene que cambiar,
   pídeselo a P1 en `docs/ESTADO.md` en lugar de editarlo aquí.
4. Abre un PR. P1 copia el resultado y el estado a la tabla 8.2 del plan.

**Reglas:**

- Solo datos ficticios (`*@demo.test`, documentos `TEST-…`). **Nunca** escribas
  contraseñas, tokens ni claves, ni las dejes visibles en una captura: tapa los campos de
  contraseña y la pestaña Application del navegador.
- Las pruebas de seguridad se ejecutan **saltando la interfaz** (consola del navegador con
  el cliente `supabase` ya autenticado) para demostrar que quien bloquea es la base de datos.
- Si la prueba falla, no la borres: deja el estado **Fallido**, enlaza el issue o PR de la
  corrección y, cuando esté corregida, agrega una ejecución nueva debajo de la anterior.

---

<!-- Desde aquí, copia y completa. -->

# CP-XX: <escenario corto>

| Campo | Valor |
| --- | --- |
| Caso | CP-XX |
| Tipo | Funcional / Regla de negocio / Seguridad / Usabilidad / Responsive / Rendimiento |
| Requisito(s) | RF-XX, RNF-XX |
| Caso de uso | CU-XX |
| Pantalla | Ej.: P-03 `paciente/reservar.html` |
| Responsable | P1 / P2 / P3 / P4 |

## Precondiciones

- Ej.: `paciente1@demo.test` con perfil completo y sesión iniciada.
- Ej.: existe una franja futura libre de `profesional1`.

## Datos usados

| Dato | Valor |
| --- | --- |
| Cuenta | `paciente1@demo.test` |
| Otros | Ej.: `schedule_id = 123`, fecha 2026-11-03 08:00 |

## Pasos

1. …
2. …
3. …

Si la prueba se hace desde la consola, pega aquí el código exacto que se ejecutó (sin
claves ni contraseñas):

```js
// Ejemplo
const { data, error } = await supabase.rpc('reservar_cita', { p_schedule_id: 123 });
console.log(data, error);
```

## Resultado esperado

Copiado de `plan_pruebas.md`, tabla 8.2.

## Ejecuciones

| # | Fecha | Entorno | Resultado obtenido | Estado | Captura |
| --- | --- | --- | --- | --- | --- |
| 1 | dd/mm/aaaa | URL publicada `https://cospino08.github.io/diseno/`, navegador y versión | Lo que pasó realmente, con el mensaje o el código de error exacto. | Aprobado / Fallido / Bloqueado | `capturas/CP-XX-1.png` |

## Observaciones

- Diferencias con lo esperado, causa encontrada y enlace al issue o PR de la corrección.
