// =============================================================================
// ui/formularios.js: comportamientos pequeños que repiten todos los formularios.
// Dueño: P3. Lo usan P3 y P4.
//
// API:
//   conBotonOcupado(formulario, textoOcupado, tarea)
//     Deshabilita el botón de envío y cambia su texto mientras corre `tarea`
//     (una función async). Evita el doble envío y muestra el estado "cargando"
//     en el propio botón. Ojo: es solo usabilidad; la doble reserva la impide
//     la base de datos (índice único parcial, plan P2).
//
//   activarMostrarContrasena(boton)
//     <button data-mostrar="id-del-campo" aria-pressed="false">Mostrar</button>
//     Alterna el campo entre password y text.
//
//   contadorDeCaracteres(control, salida)
//     Escribe "12/200" en `salida` mientras se escribe (usa el maxlength del control).
// =============================================================================

export async function conBotonOcupado(formulario, textoOcupado, tarea) {
  const boton = formulario.querySelector('[type="submit"]');
  const textoOriginal = boton.textContent;
  boton.disabled = true;
  boton.textContent = textoOcupado;
  formulario.setAttribute('aria-busy', 'true');
  try {
    await tarea();
  } finally {
    // Si la tarea redirigió a otra página, esto ya no importa; si falló, el
    // botón vuelve a estar disponible para intentar de nuevo.
    boton.disabled = false;
    boton.textContent = textoOriginal;
    formulario.removeAttribute('aria-busy');
  }
}

// Patrón de botón de alternancia: el nombre ("Mostrar contraseña") no cambia y
// el estado lo comunica aria-pressed. Si se cambiara el texto visible a
// "Ocultar" y el nombre accesible no, se rompería WCAG 2.5.3 (la etiqueta
// visible debe estar contenida en el nombre accesible).
export function activarMostrarContrasena(boton) {
  const campo = document.getElementById(boton.dataset.mostrar);
  if (!campo) return;
  boton.addEventListener('click', () => {
    const mostrar = campo.type === 'password';
    campo.type = mostrar ? 'text' : 'password';
    boton.setAttribute('aria-pressed', String(mostrar));
  });
}

export function contadorDeCaracteres(control, salida) {
  const maximo = Number(control.getAttribute('maxlength')) || null;
  const actualizar = () => {
    salida.textContent = maximo ? `${control.value.length}/${maximo}` : String(control.value.length);
  };
  control.addEventListener('input', actualizar);
  actualizar();
}
