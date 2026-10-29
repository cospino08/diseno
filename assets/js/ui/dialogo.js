// =============================================================================
// ui/dialogo.js: diálogo de confirmación accesible para acciones relevantes
// (cancelar una cita, desactivar una especialidad…). Enunciado 5.2: "confirmación
// de acciones relevantes".
// Dueño: P3. Lo usan P3 y P4.
//
// Usa el <dialog> nativo con showModal(), que ya trae lo difícil de accesibilidad:
// atrapa el foco dentro del diálogo, se cierra con Esc y devuelve el foco al
// elemento que lo abrió. No hace falta reimplementarlo.
//
// API:
//   const ok = await confirmar({
//     titulo: '¿Cancelar esta cita?',
//     mensaje: 'La hora quedará libre para otra persona.',
//     detalles: ['jue 29 oct · 08:30', 'Dra. Laura Gómez'],  // opcional, se muestran como texto
//     textoAceptar: 'Sí, cancelar',                          // opcional
//     textoCancelar: 'No, volver',                           // opcional
//     peligro: true,                                         // botón rojo (acción destructiva)
//   });
//   if (ok) { …llamar a la RPC… }
// =============================================================================

let contador = 0; // para generar ids únicos (aria-labelledby)

/** Muestra el diálogo y resuelve true si el usuario acepta y false en cualquier otro caso. */
export function confirmar({
  titulo,
  mensaje = '',
  detalles = [],
  textoAceptar = 'Aceptar',
  textoCancelar = 'Cancelar',
  peligro = false,
}) {
  return new Promise((resolver) => {
    contador += 1;
    const idTitulo = `dialogo-titulo-${contador}`;

    const dialogo = document.createElement('dialog');
    dialogo.className = 'dialogo';
    dialogo.setAttribute('aria-labelledby', idTitulo);

    const h2 = document.createElement('h2');
    h2.id = idTitulo;
    h2.textContent = titulo;
    dialogo.append(h2);

    // Detalles: datos de la base (fecha, profesional…), siempre con textContent.
    for (const linea of detalles) {
      const p = document.createElement('p');
      p.className = 'texto-suave';
      p.textContent = linea;
      dialogo.append(p);
    }
    if (mensaje) {
      const p = document.createElement('p');
      p.textContent = mensaje;
      dialogo.append(p);
    }

    const acciones = document.createElement('div');
    acciones.className = 'acciones';
    const aceptar = document.createElement('button');
    aceptar.type = 'button';
    aceptar.className = `boton ${peligro ? 'boton--peligro' : 'boton--primario'}`;
    aceptar.textContent = textoAceptar;
    const cancelar = document.createElement('button');
    cancelar.type = 'button';
    cancelar.className = 'boton boton--secundario';
    cancelar.textContent = textoCancelar;
    acciones.append(aceptar, cancelar);
    dialogo.append(acciones);

    let aceptado = false;
    aceptar.addEventListener('click', () => {
      aceptado = true;
      dialogo.close();
    });
    cancelar.addEventListener('click', () => dialogo.close());
    // 'close' se dispara al aceptar, al cancelar y al pulsar Esc.
    dialogo.addEventListener('close', () => {
      dialogo.remove();
      resolver(aceptado);
    });

    document.body.append(dialogo);
    dialogo.showModal();
    // En acciones destructivas, el foco empieza en "Cancelar" para que un Enter
    // apresurado no borre nada.
    (peligro ? cancelar : aceptar).focus();
  });
}
