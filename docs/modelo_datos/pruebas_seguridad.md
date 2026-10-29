# Pruebas de seguridad (CP-02, CP-03, CP-04, CP-06, CP-09, CP-13, CP-19, CP-23)

Dueño: P2. Hay dos formas de ejecutarlas y conviene hacer **las dos** para la evidencia:

1. **En SQL** (`sql/pruebas_seguridad.sql`): automática, repetible y no deja cambios.
2. **Desde el navegador** (consola de DevTools): demuestra que la protección funciona por la
   misma vía que usaría un atacante real (la API pública con la clave `anon`).

Además del resultado, cada evidencia debe registrar: requisito, datos usados, resultado
esperado, resultado obtenido, estado y captura (plan, sección 8).

---

## 1. Pruebas en SQL

### En Supabase

1. Haber ejecutado `esquema.sql`, `politicas_rls.sql` y `datos_prueba.sql`.
2. SQL Editor → pegar `sql/pruebas_seguridad.sql` completo → **Run**.
3. El resultado es una tabla con columnas `caso`, `prueba`, `esperado`, `obtenido` y
   `estado`. Todas las filas deben decir **PASA**. Tomar captura.

El script simula a cada usuario como lo hace Supabase en cada petición:

```sql
set local role authenticated;                        -- permisos de un usuario con sesión
select set_config('request.jwt.claims',
  '{"sub": "<uuid del usuario>", "role": "authenticated"}', true);  -- lo que lee auth.uid()
```

Cada prueba se deshace al terminar, así que se puede ejecutar cuantas veces se quiera.

### En PostgreSQL local (sin Supabase)

Con Docker:

```bash
docker run -d --name citas-pg -e POSTGRES_PASSWORD=local postgres:15-alpine
docker exec citas-pg psql -U postgres -c "create database citas"
for f in sql/local/simular_supabase.sql sql/esquema.sql sql/politicas_rls.sql \
         sql/local/crear_cuentas_demo.sql sql/datos_prueba.sql sql/pruebas_seguridad.sql; do
  docker exec -i citas-pg psql -U postgres -d citas -v ON_ERROR_STOP=1 -q < "$f" || break
done
```

`sql/local/` simula lo mínimo de Supabase (roles `anon`/`authenticated`, `auth.users`,
`auth.uid()`). **No se ejecuta en Supabase.**

### Resultados

| Fecha | Dónde | Resultado |
| --- | --- | --- |
| 28/10/2026 | PostgreSQL 15.19 local (Docker), base vacía | 62/62 PASA. Ciclo `reiniciar → esquema → políticas → datos → pruebas` también 62/62. |
| 28/10/2026 | **Supabase (proyecto real)**, ejecutado por el coordinador | 62/62 PASA. |
| 29/10/2026 | PostgreSQL 15.19 local, con CP-19 y CP-23 añadidos y `datos_pruebas_especiales.sql` cargado | **72/72 PASA**, dos ejecuciones seguidas sin dejar cambios. |

**Pendiente:** volver a ejecutar en Supabase la versión de 72 comprobaciones.

### Verificación a través de la API (PostgREST)

El 29/10/2026 se levantó en local PostgREST v12.2.3 (la API REST que usa Supabase) sobre la
misma base y se llamó por HTTP con JWT de cada usuario, como lo hace `supabase-js`:

| Petición | Resultado |
| --- | --- |
| Paciente: `GET /appointments?select=id,franja:schedules(...),profesional:professionals(...)` | 200, solo sus 4 citas, embebidos sin ambigüedad |
| Paciente: `POST /rpc/reservar_cita` con franja inexistente | 400, `{"code":"P0001","message":"FRANJA_NO_EXISTE","details":"..."}` |
| Paciente: `PATCH /profiles` con `{"rol":"admin"}` | 403, `code 42501` |
| Paciente: `POST /status_history` (CP-23) | 403, `code 42501` |
| Paciente: `PATCH /profiles` con documento de otro | 409, `code 23505`, mensaje con `uq_profiles_documento` |
| Sin sesión: `POST /rpc/franjas_disponibles`, `GET /appointments` | 401, `code 42501` |
| Admin: `POST /rpc/indicadores_citas` | 200, JSON con `total`, `por_estado`, `por_especialidad`, `por_periodo` |

### CP-17: rendimiento de la agenda

Con `datos_pruebas_especiales.sql`, la Dra. Gómez (profesional1) tiene un día con 500 citas
(fecha = hoy + 90 días; el script la muestra al terminar). En la base local,
`mi_agenda` para ese día devolvió las 500 filas en **7 ms** (`explain analyze`). La medición
de CP-17 (≤ 3 s, promedio de 3) la hace P4 en el navegador, porque incluye la red y el
dibujado de la tabla.

### CP-02 con concurrencia real (dos sesiones a la vez)

El script SQL prueba las reservas una tras otra. Para demostrar que funciona con peticiones
**simultáneas**, se abrieron dos sesiones de `psql` en paralelo sobre la misma franja:

```text
[A] A inicia 03:57:05.448
[A] A reserva -> cita 850 a las 03:57:05.455      (A mantiene la transacción abierta 3 s)
[B] B inicia 03:57:05.971                          (B queda esperando el bloqueo "for update")
[B] ERROR:  FRANJA_OCUPADA                         (cuando A confirma, B recibe el conflicto)
[B] DETAIL:  Otra persona reservó esta franja primero.
→ La franja quedó con exactamente 1 cita activa.
```

Desde el navegador se repite con `Promise.all` (sección 2, CP-02).

---

## 2. Pruebas desde el navegador

Requisitos: aplicación publicada (o abierta en local), las 5 cuentas demo creadas y
`datos_prueba.sql` ejecutado.

1. Abrir la página de inicio publicada (por ejemplo `https://cospino08.github.io/diseno/`).
2. Abrir DevTools (F12) → pestaña **Console**.
3. Pegar el bloque de preparación. Pide las contraseñas con `prompt()` para que **no queden
   escritas** en ningún archivo ni en el historial.

```js
// --- Preparación ---------------------------------------------------------------
const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = await import('./assets/js/config.js');

// Un cliente por usuario, cada uno con su propia sesión (storageKey distinto).
async function sesion(email) {
  const cliente = createClient(SUPABASE_URL, SUPABASE_ANON_KEY,
    { auth: { storageKey: 'prueba-' + email, persistSession: false } });
  const { error } = await cliente.auth.signInWithPassword(
    { email, password: prompt('Contraseña de ' + email) });
  if (error) throw error;
  return cliente;
}
const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const p1   = await sesion('paciente1@demo.test');
const p2   = await sesion('paciente2@demo.test');
const pro2 = await sesion('profesional2@demo.test');
```

### CP-03: paciente cambia el ID para ver una cita ajena

```js
// 1. paciente2 mira el id de su propia cita
const { data: citasP2 } = await p2.rpc('mis_citas');
const idAjeno = citasP2.find(c => c.estado === 'programada').cita_id;

// 2. paciente1 intenta leerla, cancelarla y modificarla con ese id
console.log('select:', await p1.from('appointments').select('*').eq('id', idAjeno));
//   esperado: data = []  (la RLS la oculta, sin error)
console.log('rpc:', await p1.rpc('cancelar_cita', { p_cita_id: idAjeno }));
//   esperado: error.message = 'NO_AUTORIZADO'
console.log('update:', await p1.from('appointments').update({ estado: 'cancelada' }).eq('id', idAjeno));
//   esperado: error.code = '42501'
```

### CP-04: profesional cambia una cita de otro profesional

```js
// La cita de paciente2 es de la Dra. Gómez (profesional1); lo intenta el Dr. Ruiz.
console.log(await pro2.rpc('cambiar_estado_cita', { p_cita_id: idAjeno, p_estado: 'confirmada' }));
//   esperado: error.message = 'NO_AUTORIZADO'
console.log(await pro2.from('appointments').select('*').eq('id', idAjeno));
//   esperado: data = []
```

### CP-06: paciente intenta volverse admin

```js
const { data: { user } } = await p1.auth.getUser();
console.log(await p1.from('profiles').update({ rol: 'admin' }).eq('id', user.id));
//   esperado: error.code = '42501' (permission denied for table profiles)
console.log(await p1.rpc('asignar_rol', { p_usuario: user.id, p_rol: 'admin' }));
//   esperado: error.message = 'NO_AUTORIZADO'
console.log(await p1.rpc('rol_actual'));
//   esperado: data = 'paciente'

// Variante: registrarse enviando el rol en los metadatos (usar un correo nuevo de prueba).
// await anon.auth.signUp({ email: 'atacante@demo.test', password: '...',
//                          options: { data: { nombres: 'X', rol: 'admin' } } });
// → el perfil queda con rol 'paciente' (el trigger ignora "rol").
```

### CP-02: dos sesiones reservan la misma franja al mismo tiempo

```js
const { data: libres } = await p1.rpc('franjas_disponibles');
const franja = libres[libres.length - 1].schedule_id;     // una franja lejana
const [r1, r2] = await Promise.all([
  p1.rpc('reservar_cita', { p_schedule_id: franja, p_motivo: 'Prueba CP-02' }),
  p2.rpc('reservar_cita', { p_schedule_id: franja, p_motivo: 'Prueba CP-02' }),
]);
console.log(r1, r2);
//   esperado: una trae data = <id de cita> y la otra error.message = 'FRANJA_OCUPADA'
```

### CP-09: cancelar y volver a reservar la misma franja

Continúa CP-02 (la franja quedó reservada por p1 o p2):

```js
const ganador  = r1.data ? p1 : p2;
const perdedor = r1.data ? p2 : p1;
const idCita   = r1.data ?? r2.data;
console.log(await ganador.rpc('cancelar_cita', { p_cita_id: idCita }));          // esperado: sin error
console.log(await perdedor.rpc('reservar_cita', { p_schedule_id: franja }));     // esperado: data = nuevo id
// Limpieza: cancelar también esa cita para dejar la franja libre.
```

### CP-23: historial automático y escritura directa

```js
// Usar una sesión de profesional1 (crearla con sesion('profesional1@demo.test')).
const pro1 = await sesion('profesional1@demo.test');
const { data: agenda } = await pro1.rpc('mi_agenda', { p_desde: '2026-11-02', p_hasta: '2026-11-06' });
const cita = agenda.find(c => c.estado === 'programada');
console.log(await pro1.rpc('cambiar_estado_cita', { p_cita_id: cita.cita_id, p_estado: 'confirmada' }));
console.log(await pro1.from('status_history').select('*').eq('appointment_id', cita.cita_id));
//   esperado: una fila programada → confirmada con changed_by = id de profesional1
console.log(await p1.from('status_history').insert({ appointment_id: cita.cita_id, estado_nuevo: 'atendida' }));
//   esperado: error.code = '42501'
```

### CP-19: registro con rol falso

Se prueba en la página de registro (P3) o en la consola con un correo nuevo, por ejemplo
`nuevo1@demo.test` (requiere que en Supabase la confirmación de correo esté desactivada o
que el usuario se confirme desde el panel):

```js
const { data } = await anon.auth.signUp({ email: 'nuevo1@demo.test', password: prompt('Contraseña nueva'),
  options: { data: { nombres: 'Nuevo Uno', rol: 'admin' } } });
// Iniciar sesión con esa cuenta y comprobar:
// await nuevo.rpc('rol_actual')                         → 'paciente'
// await nuevo.rpc('reservar_cita', { p_schedule_id })   → 'PERFIL_INCOMPLETO' (CP-21)
```

### CP-13: sin sesión

```js
console.log(await anon.rpc('franjas_disponibles'));      // esperado: error.code = '42501'
console.log(await anon.rpc('reservar_cita', { p_schedule_id: 1 }));   // esperado: error.code = '42501'
console.log(await anon.from('appointments').select('*'));             // esperado: error.code = '42501'
console.log(await anon.from('profiles').select('*'));                 // esperado: error.code = '42501'
```

> Nota: según la versión de PostgREST, una tabla sin permiso para `anon` puede responder con
> `42501` o con `401`. Ambos son un rechazo correcto; lo que **no** debe pasar es recibir
> filas.

Al terminar: `await p1.auth.signOut(); await p2.auth.signOut(); await pro2.auth.signOut();`
