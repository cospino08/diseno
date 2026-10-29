# 6. Requisitos no funcionales

Responde a la sección 7.2 del enunciado (mínimo 8, medibles cuando sea posible, cubriendo
seguridad, usabilidad, rendimiento, compatibilidad, accesibilidad, mantenibilidad y
disponibilidad).

| ID | Categoría | Requisito | Métrica o forma de verificación | Prueba |
| --- | --- | --- | --- | --- |
| RNF-01 | Seguridad | Todas las tablas del esquema `public` tendrán Row Level Security habilitado, con políticas por rol o propietario. | Consulta a `pg_tables` con `rowsecurity = false` en `public` devuelve 0 filas. Las pruebas negativas con 3 cuentas (paciente, profesional, admin) son rechazadas en el 100 % de los casos. | CP-03, CP-04, CP-06, CP-13 |
| RNF-02 | Rendimiento | La agenda de un día cargará en máximo 3 segundos con 500 citas de prueba bajo una conexión estable. | Tiempo medido en la pestaña Red del navegador desde la solicitud hasta el dibujado de la lista; promedio de 3 mediciones ≤ 3 s. | CP-17 |
| RNF-03 | Usabilidad | Una persona podrá reservar en máximo 5 pasos después de iniciar sesión (con perfil completo). | Conteo de acciones del usuario (clic o envío): elegir especialidad, elegir fecha, buscar, elegir franja, confirmar. | CP-16 |
| RNF-04 | Compatibilidad | La interfaz será usable en las dos últimas versiones de Chrome y Firefox y en una pantalla de 360 px de ancho. | En 360 px no hay desplazamiento horizontal (`document.documentElement.scrollWidth <= 360`) y todos los controles se pueden activar. | CP-05 |
| RNF-05 | Seguridad | Ningún secreto se publicará: el repositorio solo contiene la URL del proyecto y la clave `anon`/publishable. Ninguna RPC es ejecutable por `anon`. | Búsqueda de `service_role` y de contraseñas en el repositorio sin resultados. Llamada a cada RPC sin sesión es rechazada. | CP-13 |
| RNF-06 | Seguridad | Los datos provenientes de la base nunca se insertarán con `innerHTML`; se usan `textContent` y creación de nodos. | Búsqueda de `innerHTML` en `assets/js` sin usos con datos de la base. Un nombre con `<img src=x onerror=alert(1)>` se muestra como texto. | CP-18 |
| RNF-07 | Accesibilidad | Los formularios tendrán etiquetas asociadas, todo será operable con teclado y el texto tendrá contraste mínimo de 4.5:1 (WCAG 2.1 nivel AA, criterio 1.4.3). | Cada `input` tiene `label` con `for` o `aria-label`. Recorrido completo de la reserva solo con Tab, Enter y Espacio. Revisión de contraste con las herramientas del navegador. | CP-16 (recorrido con teclado) |
| RNF-08 | Integridad | Las reglas de negocio críticas (doble reserva, superposición, transiciones, plazo de cancelación, propiedad de la cita) se validarán en PostgreSQL, no solo en JavaScript. | Cada regla se prueba llamando a la base desde la consola del navegador, saltando la interfaz, y es rechazada. | CP-02, CP-07, CP-08, CP-10, CP-11, CP-12 |
| RNF-09 | Mantenibilidad | El código separará presentación (HTML/CSS), lógica de interfaz y acceso a datos en módulos ES distintos, y la base se reconstruirá solo con los scripts de `sql/`. | Ninguna llamada a `supabase` fuera de `assets/js/datos/`. Ejecutar `esquema.sql`, `politicas_rls.sql` y `datos_prueba.sql` en un proyecto nuevo deja el sistema operativo sin pasos manuales adicionales (salvo asignar el primer admin). | Revisión de código; reconstrucción en Hito 5 |
| RNF-10 | Disponibilidad | La aplicación estará publicada en GitHub Pages y manejará la sesión expirada y los errores de red sin quedar en blanco. | La URL pública responde. Con la red desactivada, cada vista muestra el estado de error. Con la sesión expirada, redirige al inicio de sesión con un mensaje. | CP-14 |
| RNF-11 | Privacidad | El sistema no recopilará datos clínicos. El motivo de la cita se limita a 200 caracteres y la interfaz advierte que no se escriban diagnósticos. | El modelo no tiene campos de diagnóstico, historia clínica ni aseguradora. Un motivo de 250 caracteres se guarda truncado o se rechaza. | Revisión del diccionario de datos |

## Nota sobre fuentes

El umbral de contraste 4.5:1 corresponde al criterio de éxito 1.4.3 de WCAG 2.1.
Fuente: W3C, *Understanding Success Criterion 1.4.3: Contrast (Minimum)*,
<https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html> — **[POR VERIFICAR]**: el
enlace y el valor no se han consultado en esta sesión; el equipo debe abrirlo y registrar la
fecha de consulta en la bitácora.
