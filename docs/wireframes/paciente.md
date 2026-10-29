# Wireframes: paciente (P-01 a P-05)

Ancho de referencia: 360 px. Todas estas pantallas tienen el encabezado con el menú del
paciente (ver A-04 en [`acceso.md`](acceso.md)) y exigen un perfil completo, salvo P-05.

---

## P-01 Inicio del paciente (`paciente/index.html`)

```
┌──────────────────────────────────────┐
│ ✚ San Rafael              [ Menú ▾ ] │
├──────────────────────────────────────┤
│ Hola, {Ana}                     (h1) │
│                                      │
│ [        Reservar cita          ]    │  primario: paso 1 de la reserva
│ [        Ver mis citas          ]    │  secundario
│                                      │
│ Tu próxima cita                 (h2) │
│ ┌──────────────────────────────────┐ │
│ │ mié 29 oct 2026 · 08:30          │ │
│ │ {Dra. Laura Gómez}               │ │
│ │ {Medicina general}               │ │
│ │ ( Programada )                   │ │  etiqueta de estado con texto
│ │ ▸ Ver en mis citas               │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**Estados:** *cargando* en la tarjeta mientras consulta. *Vacío*: "No tienes citas
próximas" con el botón "Reservar cita". *Error*: "No pudimos cargar tus citas" con el
botón "Reintentar".

---

## P-02 Buscar disponibilidad (`paciente/buscar.html`)

```
┌──────────────────────────────────────┐
│ ✚ San Rafael              [ Menú ▾ ] │
├──────────────────────────────────────┤
│ Buscar disponibilidad           (h1) │
│ ┌ form ────────────────────────────┐ │
│ │ Especialidad *                   │ │
│ │ [ Medicina general          ▾ ]  │ │  <select>, desde specialties
│ │ Profesional (opcional)           │ │
│ │ [ Cualquier profesional     ▾ ]  │ │  se filtra según la especialidad
│ │ Fecha *                          │ │
│ │ [ 29/10/2026               📅 ]  │ │  <input type=date min=hoy>
│ │ [           Buscar           ]   │ │  paso 2
│ └──────────────────────────────────┘ │
│                                      │
│ 6 horas disponibles el mié 29 oct    │  aria-live="polite"
│                                 (h2) │
│ ┌──────────────────────────────────┐ │
│ │ Dra. Laura Gómez            (h3) │ │
│ │ Medicina general                 │ │
│ │ [08:00] [08:30] [09:00]          │ │  botones = paso 3
│ │ [10:30]                          │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Dr. Andrés Ruiz             (h3) │ │
│ │ Medicina general                 │ │
│ │ [14:00] [14:30]                  │ │
│ └──────────────────────────────────┘ │
│ [ ◂ Día anterior ] [ Día siguiente ▸]│
└──────────────────────────────────────┘
```

**Comportamiento**

- Los datos vienen de la RPC `franjas_disponibles(p_especialidad, p_profesional,
  p_fecha)`, que solo devuelve franjas futuras sin cita activa (plan, P8). La pantalla
  **no** calcula la disponibilidad: no puede, porque la RLS le oculta las citas ajenas.
- Los resultados se agrupan por profesional. Cada hora es un `<button>` con un nombre
  accesible completo: `aria-label="Reservar 08:30 con Dra. Laura Gómez"`.
- La búsqueda se refleja en la URL (`?especialidad=2&fecha=2026-10-29`). Así funcionan
  "Atrás" y la recarga después de un conflicto.
- No se puede elegir una fecha pasada (`min` en el campo y validación en
  `validacion.js`). La base de datos también lo impide (`FRANJA_PASADA`).

**Estados:** *cargando* ("Buscando horas disponibles…"). *Vacío*: "No hay horas
disponibles para esa fecha" con el botón "Ver el día siguiente". *Error* de red con
"Reintentar". *Éxito informativo* tras un conflicto (ver P-03).

---

## P-03 Confirmar reserva (`paciente/reservar.html`)

```
┌──────────────────────────────────────┐
│ ✚ San Rafael              [ Menú ▾ ] │
├──────────────────────────────────────┤
│ Confirma tu cita                (h1) │
│ ┌ resumen (dl) ────────────────────┐ │
│ │ Fecha         mié 29 oct 2026    │ │
│ │ Hora          08:30 – 09:00      │ │
│ │ Profesional   Dra. Laura Gómez   │ │
│ │ Especialidad  Medicina general   │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Motivo de la consulta (opcional)     │
│ [______________________________]     │  <textarea maxlength=200>
│ [______________________________]     │
│ No escribas diagnósticos ni datos    │  ayuda
│ clínicos. 0/200                      │  contador, aria-live
│                                      │
│ [       Confirmar reserva       ]    │  paso 4
│ [        Cambiar hora           ]    │  vuelve a P-02 con los filtros
└──────────────────────────────────────┘
```

**Éxito (P-03b)**, que reemplaza el contenido de `main`. El foco se mueve al título:

```
│ ✔ ¡Cita reservada!              (h1) │
│ Tu cita quedó registrada con estado  │
│ Programada.                          │
│ mié 29 oct 2026 · 08:30              │
│ Dra. Laura Gómez · Medicina general  │
│ Puedes cancelarla hasta 2 horas      │
│ antes desde Mis citas.               │
│ [         Ver mis citas         ]    │
│ ▸ Volver al inicio                   │
```

**Errores de `reservar_cita`** (los traduce `mensajes.js`):

| Código | Qué ve el paciente | Qué hace la pantalla |
| --- | --- | --- |
| `FRANJA_OCUPADA` | "Otra persona acaba de reservar esa hora. Te mostramos las horas que siguen libres." | Vuelve a P-02 con los mismos filtros y **recarga la disponibilidad**. |
| `FRANJA_PASADA` | "Esa hora ya pasó. Elige una hora futura." | Vuelve a P-02 y recarga. |
| `FRANJA_NO_EXISTE` | "Esa hora ya no está disponible." | Vuelve a P-02 y recarga. |
| `PERFIL_INCOMPLETO` | "Completa tu perfil antes de reservar." | Lleva a P-05. |
| `SOLO_PACIENTES` | "Solo los pacientes pueden reservar citas." | Muestra el estado de acceso denegado. |
| Red o desconocido | "No pudimos completar la reserva. Revisa tu conexión e inténtalo de nuevo." | Se queda en P-03 con el botón habilitado. |

- Mientras espera la respuesta, el botón dice "Reservando…" y está deshabilitado, para
  evitar el doble clic. Aun así, la base de datos es la que impide la doble reserva.

---

## P-04 Mis citas (`paciente/mis-citas.html`)

```
┌──────────────────────────────────────┐
│ ✚ San Rafael              [ Menú ▾ ] │
├──────────────────────────────────────┤
│ Mis citas                       (h1) │
│ [ Próximas | Historial ]             │  pestañas (role=tablist)
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ mié 29 oct 2026 · 08:30     (h2) │ │
│ │ Dra. Laura Gómez                 │ │
│ │ Medicina general                 │ │
│ │ ( Programada )                   │ │
│ │ Motivo: {texto}                  │ │  textContent
│ │ [ Cancelar cita ]                │ │  peligro, solo si faltan > 2 h
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ jue 30 oct 2026 · 07:00          │ │
│ │ Dr. Andrés Ruiz · Pediatría      │ │
│ │ ( Confirmada )                   │ │
│ │ Ya no se puede cancelar en línea │ │  faltan < 2 h
│ │ (faltan menos de 2 horas).       │ │
│ └──────────────────────────────────┘ │
│ [       Reservar otra cita      ]    │
└──────────────────────────────────────┘
```

Diálogo de confirmación (`<dialog>` modal, foco atrapado y Esc para cerrar):

```
┌────────────────────────────────┐
│ ¿Cancelar esta cita?      (h2) │
│ mié 29 oct · 08:30             │
│ Dra. Laura Gómez               │
│ La hora quedará libre para     │
│ otra persona.                  │
│ [ Sí, cancelar ] [ No, volver ]│  el foco inicial va a "No, volver"
└────────────────────────────────┘
```

**Comportamiento**

- "Próximas": citas futuras en estado programada o confirmada. "Historial": todo lo
  demás. Se ordenan por fecha.
- El botón "Cancelar" se oculta a menos de 2 h **solo por usabilidad**. Si alguien llama a
  la RPC igual, `cancelar_cita` responde `FUERA_DE_PLAZO` y se muestra "Ya no puedes
  cancelar esta cita: faltan menos de 2 horas. Comunícate con la clínica".
- Éxito: aviso "Cita cancelada. La hora quedó libre" y la lista se recarga.
- Una cita que canceló la institución se muestra como "Cancelada por la institución"
  (plan, P12), si el contrato expone quién canceló.

**Estados:** *cargando*. *Vacío*: "Aún no tienes citas" con "Reservar cita". *Error* con
"Reintentar".

---

## P-05 Perfil (`paciente/perfil.html`)

```
┌──────────────────────────────────────┐
│ ✚ San Rafael              [ Menú ▾ ] │
├──────────────────────────────────────┤
│ ┌ aviso ───────────────────────────┐ │  solo con ?completar=1
│ │ Completa tu perfil para poder    │ │
│ │ reservar citas.                  │ │
│ └──────────────────────────────────┘ │
│ Mi perfil                       (h1) │
│ Correo: {ana@demo.test}              │  solo lectura (viene de Auth)
│                                      │
│ Nombres y apellidos *                │
│ [______________________________]     │
│ Documento de identidad *             │
│ [______________________________]     │
│ Teléfono *                           │
│ [______________________________]     │  type=tel, inputmode=tel
│ Fecha de nacimiento *                │
│ [____________________________📅]     │  type=date max=hoy
│                                      │
│ [         Guardar cambios       ]    │
└──────────────────────────────────────┘
```

**Comportamiento**

- Solo se editan las columnas que la base permite (`nombres`, `documento`, `telefono` y
  `fecha_nacimiento`, plan P4). El rol **no aparece** como campo editable.
- Si se llegó por `?completar=1`, al guardar se redirige al destino original
  (`?volver=`), o a P-01 si no hay uno.
- Documento repetido (si P2 define `UNIQUE`): "Ese documento ya está registrado en otra
  cuenta".
- Éxito: "Perfil actualizado".
