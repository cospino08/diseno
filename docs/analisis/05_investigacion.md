# 5. Investigación: síntesis para el análisis

Responde a la sección 6.1 del enunciado ("Comparar dos plataformas de citas disponibles en
la web"). La investigación completa la hizo **P3** y está en
[`docs/investigacion_plataformas.md`](../investigacion_plataformas.md), con 5 fuentes
enlazadas (F1 a F5), consultadas el 28/10/2026. Aquí P1 la conecta con el problema, los
requisitos y el alcance. No se agregan fuentes nuevas.

## 5.1 Plataformas comparadas

| Plataforma | Por qué se eligió |
| --- | --- |
| Doctoralia (doctoralia.co) | Referente en español con operación en Colombia, el contexto más cercano a la clínica ficticia. |
| Zocdoc (zocdoc.com) | Referente internacional que publica sus políticas de cancelación, inasistencia y recordatorios. |

## 5.2 Patrón común encontrado

Las dos plataformas siguen el mismo flujo: **buscar → elegir un hueco libre → confirmar →
recibir confirmación inmediata → poder cancelar sin llamar**. Ese patrón es el que adopta
nuestro proceso TO BE (`03_procesos.md`, 3.2).

## 5.3 De los hallazgos a nuestro análisis

| Hallazgo (P3) | Problema del AS IS que atiende | Requisito o decisión | Prueba |
| --- | --- | --- | --- |
| H1 Disponibilidad como huecos concretos | C1, E1 (cruces) | Franjas concretas (plan C2); RF-07, RF-16 | CP-01, CP-11 |
| H2 El hueco se libera al cancelar | E1 | RF-12 (la franja vuelve a estar disponible) | CP-09 |
| H3 Anticipación mínima configurable (Zocdoc, 2 h por defecto **para reservar**) | — | Ver la aclaración de 5.4 | CP-08 |
| H4 Cancelar sin llamar | E3 | RF-12, CU-05 | CP-08 |
| H5 Confirmación inmediata | E3 (pacientes sin confirmación) | RF-06, RF-09 | CP-01 |
| H6 Buscador de texto libre que mezcla enfermedades | Riesgo de recopilar datos clínicos | RNF-11, R10; búsqueda solo con listas y fecha | Revisión del diccionario |
| H7 Precios, opiniones e insignias pagadas | — | Exclusión (1.9: pagos) | — |
| H8 Recordatorios por correo y SMS | E3 | Exclusión (1.9: notificaciones); siguiente incremento | — |
| H9 Sanciones por inasistencia | E5 | Exclusión; el estado `no_asistio` sí se registra y se cuenta en RF-19 | CP-15 |
| H10 Visita presencial / en línea | — | Exclusión (1.9: telemedicina) | — |

## 5.4 Aclaración sobre H3 (revisión de P1)

El documento de P3 dice, en H3, que la anticipación de 2 h de Zocdoc "coincide con nuestra
regla de cancelar hasta 2 h antes". Según su propia tabla comparativa (fila "Anticipación
mínima para reservar", fuente F5), ese valor de Zocdoc es la anticipación mínima **para
reservar**, no para cancelar. Por eso, en este análisis:

- La regla de **cancelar hasta 2 h antes** (plan C4) sigue siendo una **decisión del equipo**.
  Su justificación es operativa: deja tiempo a recepción para ofrecer la franja a otro
  paciente. No se presenta como copiada de una plataforma.
- El hallazgo H3 se usa solo como evidencia de que un plazo de horas, configurable por la
  institución, es una práctica habitual.
- Nuestro sistema **no** exige anticipación mínima para reservar: cualquier franja futura se
  puede reservar. Agregar ese mínimo es una mejora posible para un siguiente incremento.

Se le pidió a P3 en `docs/ESTADO.md` que ajuste la redacción de H3.

## 5.5 Limitaciones de la investigación

Las declara P3 en su documento:

- La página de inicio de Zocdoc respondió HTTP 403 a la herramienta automática. Lo que se
  afirma de Zocdoc sale solo de F4 y F5, y lo demás está marcado "no verificado".
- No se completó ninguna reserva real (no se crearon cuentas, para no registrar datos
  personales).
- **Pendiente humano:** antes de la sustentación, un integrante debe abrir ambos sitios en el
  navegador y confirmar los puntos marcados "no verificado".
