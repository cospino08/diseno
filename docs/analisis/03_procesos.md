# 3. Modelo del proceso: AS IS y TO BE

Responde a la sección 6.1 del enunciado. Los diagramas son flujogramas tipo BPMN
simplificado escritos en **Mermaid**: GitHub los dibuja automáticamente al abrir este archivo.
Para el documento final se pueden exportar como imagen desde <https://mermaid.live>.

## 3.1 AS IS: proceso actual de asignación de citas

```mermaid
flowchart TD
    subgraph PAC[Paciente]
        A1([Necesita una cita]) --> A2[Llama, escribe por WhatsApp o va a la clínica]
        A9[Recibe fecha y hora de palabra]
        A10{¿Recibió confirmación?}
        A10 -- No --> A11[Llama de nuevo para preguntar]
        A10 -- Sí --> A12([Asiste a la cita])
    end
    subgraph REC[Recepción]
        A3[Recibe la solicitud] --> A4[Abre SU hoja de cálculo]
        A4 --> A5{¿Hay hueco en su hoja?}
        A5 -- No --> A6[Propone otra fecha]
        A6 --> A4
        A5 -- Sí --> A7[Anota la cita por nombre del paciente]
        A7 --> A8[Avisa al médico cuando puede]
        A11 --> A4
    end
    subgraph MED[Profesional]
        M1[Recibe la lista del día al llegar] --> M2{¿Hay cruces?}
        M2 -- Sí --> M3[Atiende como puede o reprograma]
        M2 -- No --> M4[Atiende]
    end
    A2 --> A3
    A7 --> A9
    A9 --> A10
    A8 --> M1
```

**Problemas visibles en el AS IS:**

1. **Paso A4:** cada recepcionista consulta una hoja distinta; dos pueden asignar la misma
   franja (causa C1, efecto E1).
2. **Paso A7:** el paciente se identifica por nombre; aparecen duplicados (C3, E2).
3. **Pasos A9–A11:** no hay confirmación escrita; el paciente vuelve a llamar (E3).
4. **Pasos A8 y M1:** el médico conoce su agenda tarde (C4, E4).
5. No hay estados ni historial: cancelaciones e inasistencias no se registran (C5, E5).

## 3.2 TO BE: proceso propuesto con el sistema

```mermaid
flowchart TD
    subgraph PAC[Paciente]
        B1([Necesita una cita]) --> B2[Inicia sesión]
        B2 --> B3{¿Perfil completo?}
        B3 -- No --> B4[Completa el perfil]
        B4 --> B5
        B3 -- Sí --> B5[Busca disponibilidad por especialidad, profesional y fecha]
        B5 --> B6[Elige una franja libre y escribe un motivo breve]
        B6 --> B7[Confirma la reserva]
        B10["Ve la cita en Mis citas con estado programada"]
        B11[Ve el aviso de conflicto y la disponibilidad actualizada]
        B11 --> B5
    end
    subgraph SIS["Sistema (Supabase)"]
        B8{"RPC reservar_cita ¿franja activa, futura y libre?"}
        B8 -- Sí --> B9[Crea la cita en una transacción atómica]
        B8 -- No --> B12[Devuelve FRANJA_OCUPADA o FRANJA_PASADA]
        B9 --> B13[Registra el historial de estados]
    end
    subgraph MED[Profesional]
        C1[Consulta su agenda en línea] --> C2[Confirma la cita]
        C2 --> C3{¿El paciente asistió?}
        C3 -- Sí --> C4[Marca atendida]
        C3 -- No --> C5[Marca no asistió]
    end
    subgraph ADM[Administrador]
        D1[Gestiona especialidades y profesionales] --> D2[Genera franjas en bloque]
        D3[Consulta indicadores por estado, especialidad y periodo]
    end
    B7 --> B8
    B9 --> B10
    B12 --> B11
    D2 -.franjas publicadas.-> B5
    B13 -.cita visible.-> C1
    C4 -.datos.-> D3
    C5 -.datos.-> D3
```

**Cómo el TO BE resuelve cada problema del AS IS:**

| Problema AS IS | Cambio en el TO BE | Mecanismo técnico |
| --- | --- | --- |
| Hojas de cálculo separadas (A4) | Una sola agenda en PostgreSQL. | Tablas `schedules` y `appointments`. |
| Doble asignación de franja | La base rechaza la segunda reserva. | Índice único parcial y RPC atómica `reservar_cita` (P2, P7 del plan). |
| Paciente identificado por nombre (A7) | Cada paciente tiene una cuenta y un documento. | `auth.users` + `profiles` enlazados por UUID. |
| Sin confirmación (A9–A11) | La cita aparece de inmediato en "Mis citas" con su estado. | Lectura de `appointments` filtrada por RLS. |
| Médico conoce la agenda tarde (A8, M1) | Agenda en línea, siempre actualizada. | RPC `mi_agenda`. |
| Sin estados ni historial | Estados cerrados con transiciones válidas e historial automático. | Tipo `estado_cita`, trigger y `status_history`. |
| Sin datos para decidir | Panel de indicadores. | RPC `indicadores_citas`. |

## 3.3 Subproceso: ciclo de vida de una cita

Diagrama de estados que resume la tabla de transiciones P6 del plan.

```mermaid
stateDiagram-v2
    [*] --> programada: reservar_cita (paciente)
    programada --> confirmada: profesional / admin
    programada --> cancelada: paciente (≥ 2 h antes) / profesional / admin
    confirmada --> atendida: profesional / admin (después de la hora de inicio)
    confirmada --> no_asistio: profesional / admin (después de la hora de inicio)
    confirmada --> cancelada: paciente (≥ 2 h antes) / profesional / admin
    atendida --> [*]
    no_asistio --> [*]
    cancelada --> [*]
```

Al pasar a `cancelada`, la franja **se conserva** y vuelve a estar disponible porque ya no
tiene una cita activa.
