# Wireframes: profesional y administración (baja fidelidad)

Estas pantallas las **construye P4**. Aquí quedan en baja fidelidad para completar el mapa
de navegación y fijar las convenciones comunes. P4 puede detallarlas o ajustarlas. Usan el
mismo CSS (`assets/css/`) y los mismos estados (`assets/js/ui/estados.js`).

---

## R-01 Agenda propia (`profesional/agenda.html`)

```
┌──────────────────────────────────────┐
│ ✚ San Rafael              [ Menú ▾ ] │
├──────────────────────────────────────┤
│ Mi agenda                       (h1) │
│ [◂] [ 29/10/2026 📅 ] [▸]  [ Hoy ]   │
│ Filtrar estado [ Todos         ▾ ]   │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 08:00 – 08:30                    │ │
│ │ {Ana Pérez} · {300 000 0001}     │ │  de mi_agenda (solo nombre y tel.)
│ │ ( Programada )   ▸ Ver detalle   │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ 08:30 – 09:00   (Libre)          │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

En pantallas de 768 px o más, la lista se ve como tabla (Hora | Paciente | Estado |
Acción).

## R-02 Detalle de cita y cambio de estado (`profesional/cita.html?id=`)

```
│ Cita del mié 29 oct · 08:00     (h1) │
│ Paciente     Ana Pérez               │
│ Teléfono     300 000 0001            │
│ Motivo       {texto}                 │
│ Estado       ( Confirmada )          │
│                                      │
│ Cambiar estado                  (h2) │
│ [ Marcar atendida ]                  │  solo las transiciones válidas
│ [ Marcar no asistió ]                │  (tabla P6 del plan)
│ [ Cancelar cita ]          (peligro) │
│ Historial de estados            (h2) │
│ · 28/10 10:02 programada → confirmada│
```

`ANTES_DE_HORA` → "Solo puedes marcar atendida o no asistió después de la hora de inicio".

---

## D-01 Resumen (`admin/resumen.html`)

```
│ Resumen                         (h1) │
│ ┌────────┐ ┌────────┐ ┌────────┐     │  tarjetas: citas hoy, programadas,
│ │ 24     │ │ 18     │ │ 3      │     │  canceladas (de indicadores_citas)
│ │ hoy    │ │ prog.  │ │ canc.  │     │
│ └────────┘ └────────┘ └────────┘     │
│ ▸ Especialidades  ▸ Profesionales    │
│ ▸ Horarios ▸ Citas ▸ Indicadores     │
```

## D-02 Especialidades · D-03 Profesionales (mismo patrón CRUD)

```
│ Especialidades                  (h1) │
│ [ + Nueva especialidad ]             │
│ ┌──────────────────────────────────┐ │
│ │ Medicina general   ( Activa )    │ │
│ │ [ Editar ] [ Desactivar ]        │ │  desactivar pide confirmación
│ └──────────────────────────────────┘ │
│ Formulario (en <dialog>):            │
│ Nombre * [__________]                │
│ Descripción [__________]             │
│ [ Guardar ] [ Cancelar ]             │
```

D-03 agrega "Promover usuario": correo o documento del usuario registrado, especialidad
y nombre público → `asignar_rol`.

## D-04 Horarios (`admin/horarios.html`)

```
│ Generar franjas                 (h1) │
│ Profesional * [ Dra. Gómez ▾ ]       │
│ Fecha * [ 30/10/2026 ]               │
│ Desde * [08:00]  Hasta * [12:00]     │
│ Duración (min) * [ 30 ▾ ]            │
│ [ Generar ]  → "Se crearon 8 franjas"│
│ Franjas del día                 (h2) │
│ 08:00 ( Libre )   [ Desactivar ]     │
│ 08:30 ( Con cita ) — bloqueada       │  P12: no se mueve si tiene cita
```

`HORARIO_SUPERPUESTO` → "Ese rango se cruza con franjas existentes del profesional".

## D-05 Citas · D-06 Indicadores

```
│ Citas                           (h1) │
│ Desde [__] Hasta [__] Estado [▾]     │
│ Especialidad [▾]   [ Filtrar ]       │
│ (lista de tarjetas o tabla, como R-01)│
├──────────────────────────────────────┤
│ Indicadores                     (h1) │
│ Periodo: Desde [__] Hasta [__]       │
│ Citas por estado          (h2)       │
│ Programada  ████████ 18              │  barras CSS con el número en texto
│ Cancelada   ██ 3                     │  (no depender solo del gráfico)
│ Citas por especialidad    (h2)       │
│ tabla: Especialidad | Total          │
```
