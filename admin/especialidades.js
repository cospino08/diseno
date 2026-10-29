// D-02 Especialidades: crear, editar, activar y desactivar (RF-14, CP-24). Responsable: P4.
//
// Escribe directo en la tabla specialties: la RLS solo deja hacerlo al admin. Si un
// paciente intentara el mismo insert desde la consola, la base lo rechaza con 42501.
// No hay borrado: desactivar es el borrado lógico (plan P13).
import { protegerPagina, manejarSesionExpirada } from '../assets/js/auth.js';
import {
  listarEspecialidades, crearEspecialidad, actualizarEspecialidad, cambiarActivoEspecialidad,
} from '../assets/js/datos/catalogos.js';
import { mostrarCargando, mostrarError, mostrarVacio, limpiar, avisar } from '../assets/js/ui/estados.js';
import { confirmar } from '../assets/js/ui/dialogo.js';
import { mensajeDeError } from '../assets/js/ui/mensajes.js';
import { conBotonOcupado, contadorDeCaracteres } from '../assets/js/ui/formularios.js';
import { validarFormulario, limpiarErrores, mostrarErrorCampo } from '../assets/js/validacion.js';
import {
  crearTabla, crearBoton, etiquetaActivo, grupoAcciones, prepararDialogo,
} from './componentes.js';

const acceso = await protegerPagina({ roles: ['admin'] });

if (acceso) {
  const zona = document.getElementById('zona-lista');
  const dialogo = prepararDialogo(document.getElementById('dialogo-especialidad'));
  const tituloDialogo = document.getElementById('titulo-dialogo');
  const formulario = document.getElementById('form-especialidad');
  const resultadoForm = document.getElementById('resultado-form');
  const { nombre, descripcion } = formulario.elements;
  contadorDeCaracteres(descripcion, document.getElementById('descripcion-contador'));

  /** Especialidad que se está editando, o null si se está creando una nueva. */
  let enEdicion = null;

  async function cargar() {
    mostrarCargando(zona, 'Cargando especialidades…');
    const { data, error } = await listarEspecialidades({ incluirInactivas: true });
    if (error) {
      if (manejarSesionExpirada(error)) return;
      mostrarError(zona, error, { reintentar: cargar });
      return;
    }
    if (data.length === 0) {
      mostrarVacio(zona, 'Todavía no hay especialidades.', { texto: 'Crear la primera', alPulsar: () => abrir(null) });
      return;
    }
    limpiar(zona);
    zona.append(crearTabla({
      titulo: 'Especialidades',
      columnas: [
        { titulo: 'Nombre', valor: (e) => e.nombre },
        { titulo: 'Descripción', valor: (e) => e.descripcion || '—' },
        { titulo: 'Estado', valor: (e) => etiquetaActivo(e.activo, { si: 'Activa', no: 'Inactiva' }) },
        {
          titulo: 'Acciones',
          valor: (e) => {
            const editar = crearBoton('Editar', () => abrir(e));
            editar.setAttribute('aria-label', `Editar ${e.nombre}`);
            const alternar = crearBoton(e.activo ? 'Desactivar' : 'Activar', () => alternarActivo(e),
              e.activo ? 'peligro' : 'secundario');
            alternar.setAttribute('aria-label', `${e.activo ? 'Desactivar' : 'Activar'} ${e.nombre}`);
            return grupoAcciones(editar, alternar);
          },
        },
      ],
      filas: data,
    }));
  }

  function abrir(especialidad) {
    enEdicion = especialidad;
    tituloDialogo.textContent = especialidad ? 'Editar especialidad' : 'Nueva especialidad';
    limpiar(resultadoForm);
    limpiarErrores(formulario);
    nombre.value = especialidad?.nombre ?? '';
    descripcion.value = especialidad?.descripcion ?? '';
    descripcion.dispatchEvent(new Event('input'));
    dialogo.abrir();
  }

  async function alternarActivo(especialidad) {
    if (especialidad.activo) {
      const ok = await confirmar({
        titulo: `¿Desactivar ${especialidad.nombre}?`,
        mensaje: 'Dejará de aparecer en la búsqueda de los pacientes. Las citas ya reservadas se conservan. Puedes volver a activarla.',
        textoAceptar: 'Sí, desactivar',
        textoCancelar: 'No, volver',
        peligro: true,
      });
      if (!ok) return;
    }
    const { error } = await cambiarActivoEspecialidad(especialidad.id, !especialidad.activo);
    if (error) {
      if (manejarSesionExpirada(error)) return;
      avisar(mensajeDeError(error), 'error');
      return;
    }
    avisar(`${especialidad.nombre}: ${especialidad.activo ? 'desactivada' : 'activada'}.`);
    cargar();
  }

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limpiar(resultadoForm);
    const valido = validarFormulario(formulario, {
      nombre: (valor) => {
        const texto = valor.trim();
        if (texto.length < 2 || texto.length > 80) return 'El nombre debe tener entre 2 y 80 caracteres.';
        return '';
      },
      descripcion: (valor) => (valor.length > 300 ? 'La descripción tiene máximo 300 caracteres.' : ''),
    });
    if (!valido) return;

    const datos = { nombre: nombre.value.trim(), descripcion: descripcion.value.trim() || null };
    await conBotonOcupado(formulario, 'Guardando…', async () => {
      const { error } = enEdicion
        ? await actualizarEspecialidad(enEdicion.id, datos)
        : await crearEspecialidad(datos);
      if (error) {
        if (manejarSesionExpirada(error)) return;
        // El nombre es único sin distinguir mayúsculas (uq_specialties_nombre).
        if (error.codigo === 'DATO_DUPLICADO') {
          mostrarErrorCampo(nombre, 'Ya existe una especialidad con ese nombre.');
          return;
        }
        mostrarError(resultadoForm, error);
        return;
      }
      dialogo.cerrar();
      avisar(enEdicion ? 'Especialidad actualizada.' : 'Especialidad creada.');
      cargar();
    });
  });

  document.getElementById('nueva').addEventListener('click', () => abrir(null));
  cargar();
}
