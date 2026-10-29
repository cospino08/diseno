# Estados de interfaz

La sección 8.2 del enunciado exige cinco estados: **cargando, vacío, error, acceso
denegado y operación exitosa**. Todos los pinta el módulo `assets/js/ui/estados.js` con las
clases de `assets/css/componentes.css`, así que se ven igual en las pantallas de P3 y de
P4.

| Estado | Aspecto (360 px) | Accesibilidad | Cuándo se usa |
| --- | --- | --- | --- |
| **Cargando** | `◌ Buscando horas disponibles…` (indicador giratorio + texto) | `role="status"`. El contenedor lleva `aria-busy="true"`. Sin animación si el sistema pide `prefers-reduced-motion`. | Mientras espera una consulta o RPC. |
| **Vacío** | Caja punteada: "No hay horas disponibles para esa fecha" + botón de acción | `role="status"` | La consulta funcionó pero no devolvió filas. |
| **Error** | Caja roja con ⚠: "No pudimos cargar tus citas. Revisa tu conexión." + `[ Reintentar ]` | `role="alert"` | Error de red, de RPC o desconocido. El texto sale de `mensajes.js`. |
| **Acceso denegado** | Caja gris con 🔒: "No tienes permiso para ver esta página." + `▸ Ir a mi inicio` | `role="alert"`. El `h1` cambia a "Acceso denegado". | El rol no corresponde a la página o la base respondió `NO_AUTORIZADO`. |
| **Éxito** | Caja verde con ✔: "Cita reservada" | `role="status"`. El foco pasa al título si reemplaza el contenido. | Una operación terminó bien. |

Además existe el **aviso flotante** (`avisar()`): un mensaje breve en una región
`aria-live` fija, para confirmaciones que no reemplazan el contenido, como "Perfil
actualizado". Desaparece a los 6 s, salvo los errores, que se cierran a mano.

Los íconos son caracteres de texto (`aria-hidden="true"`), no imágenes, y **siempre** van
acompañados de texto: el color y el ícono nunca son el único indicador.
