// D-03 Profesionales (RF-15, CP-25). Responsable: P4.
//
// Alta de profesionales (plan P10): crear cuentas de otras personas exigiría la
// service_role, que está prohibida en el navegador. Por eso la persona se registra sola
// (queda como paciente) y aquí el admin la busca y la promueve con asignar_rol. La RPC
// verifica en la base que quien llama es admin y que no se cambia su propio rol.
import { protegerPagina, manejarSesionExpirada } from '../assets/js/auth.js';
import {
  listarEspecialidades, listarProfesionales, actualizarProfesional, cambiarActivoProfesional,
} from '../assets/js/datos/catalogos.js';
import { listarPerfiles, asignarRol } from '../assets/js/datos/perfiles.js';
import { mostrarCargando, mostrarError, mostrarVacio, limpiar, avisar } from '../assets/js/ui/estados.js';
import { confirmar } from '../assets/js/ui/dialogo.js';
import { mensajeDeError } from '../assets/js/ui/mensajes.js';
import { conBotonOcupado } from '../assets/js/ui/formularios.js';
import { validarFormulario, limpiarErrores, mostrarErrorCampo, requerido } from '../assets/js/validacion.js';
import {
  crearTabla, crearBoton, etiquetaActivo, grupoAcciones, prepararDialogo, llenarSelect,
} from './componentes.js';

const NOMBRE_ROL = { paciente: 'Paciente', profesional: 'Profesional', admin: 'Administración' };

const acceso = await protegerPagina({ roles: ['admin'] });

if (acceso) {
  const zonaLista = document.getElementById('zona-lista');
  const zonaUsuarios = document.getElementById('zona-usuarios');
  const formBuscar = document.getElementById('form-buscar');

  const dialogoProfesional = prepararDialogo(document.getElementById('dialogo-profesional'));
  const formProfesional = document.getElementById('form-profesional');
  const resultadoProfesional = document.getElementById('resultado-profesional');

  const dialogoRol = prepararDialogo(document.getElementById('dialogo-rol'));
  const formRol = document.getElementById('form-rol');
  const resultadoRol = document.getElementById('resultado-rol');
  const camposProfesional = document.getElementById('campos-profesional');

  let profesionalEnEdicion = null;
  let usuarioEnEdicion = null;

  // ---------- Catálogo de especialidades activas para los dos formularios ----------

  async function cargarEspecialidades() {
    const { data, error } = await listarEspecialidades();
    if (error) return error;
    const opciones = data.map((e) => ({ valor: e.id, texto: e.nombre }));
    llenarSelect(formProfesional.elements.especialidad, opciones, 'Elige una especialidad');
    llenarSelect(formRol.elements.especialidad, opciones, 'Elige una especialidad');
    return null;
  }

  // ---------- Lista de profesionales ----------

  async function cargarProfesionales() {
    mostrarCargando(zonaLista, 'Cargando profesionales…');
    const { data, error } = await listarProfesionales({ incluirInactivos: true });
    if (error) {
      if (manejarSesionExpirada(error)) return;
      mostrarError(zonaLista, error, { reintentar: cargarProfesionales });
      return;
    }
    if (data.length === 0) {
      mostrarVacio(zonaLista, 'Aún no hay profesionales. Promueve un usuario registrado con el formulario de abajo.');
      return;
    }
    limpiar(zonaLista);
    zonaLista.append(crearTabla({
      titulo: 'Profesionales registrados',
      columnas: [
        { titulo: 'Nombre público', valor: (p) => p.nombre_publico },
        { titulo: 'Especialidad', valor: (p) => p.especialidad?.nombre ?? '—' },
        { titulo: 'Registro', valor: (p) => p.registro_profesional || '—' },
        { titulo: 'Estado', valor: (p) => etiquetaActivo(p.activo) },
        {
          titulo: 'Acciones',
          valor: (p) => {
            const editar = crearBoton('Editar', () => abrirProfesional(p));
            editar.setAttribute('aria-label', `Editar ${p.nombre_publico}`);
            const alternar = crearBoton(p.activo ? 'Desactivar' : 'Activar', () => alternarProfesional(p),
              p.activo ? 'peligro' : 'secundario');
            alternar.setAttribute('aria-label', `${p.activo ? 'Desactivar' : 'Activar'} ${p.nombre_publico}`);
            return grupoAcciones(editar, alternar);
          },
        },
      ],
      filas: data,
    }));
  }

  function abrirProfesional(profesional) {
    profesionalEnEdicion = profesional;
    limpiar(resultadoProfesional);
    limpiarErrores(formProfesional);
    formProfesional.elements.nombrePublico.value = profesional.nombre_publico;
    formProfesional.elements.especialidad.value = String(profesional.specialty_id);
    formProfesional.elements.registro.value = profesional.registro_profesional ?? '';
    dialogoProfesional.abrir();
  }

  async function alternarProfesional(profesional) {
    if (profesional.activo) {
      const ok = await confirmar({
        titulo: `¿Desactivar a ${profesional.nombre_publico}?`,
        mensaje: 'Dejará de aparecer para los pacientes y no podrá usar su agenda. Sus citas se conservan.',
        textoAceptar: 'Sí, desactivar',
        textoCancelar: 'No, volver',
        peligro: true,
      });
      if (!ok) return;
    }
    const { error } = await cambiarActivoProfesional(profesional.id, !profesional.activo);
    if (error) {
      if (manejarSesionExpirada(error)) return;
      avisar(mensajeDeError(error), 'error');
      return;
    }
    avisar(`${profesional.nombre_publico}: ${profesional.activo ? 'desactivado' : 'activado'}.`);
    cargarProfesionales();
  }

  formProfesional.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limpiar(resultadoProfesional);
    const valido = validarFormulario(formProfesional, {
      nombrePublico: requerido('Escribe el nombre que verán los pacientes.'),
      especialidad: requerido('Elige una especialidad.'),
    });
    if (!valido) return;
    const { nombrePublico, especialidad, registro } = formProfesional.elements;
    await conBotonOcupado(formProfesional, 'Guardando…', async () => {
      const { error } = await actualizarProfesional(profesionalEnEdicion.id, {
        nombrePublico: nombrePublico.value.trim(),
        especialidad: Number(especialidad.value),
        registroProfesional: registro.value.trim() || null,
      });
      if (error) {
        if (manejarSesionExpirada(error)) return;
        if (error.codigo === 'DATO_DUPLICADO') {
          mostrarErrorCampo(registro, 'Ese registro profesional ya está asignado a otra persona.');
          return;
        }
        mostrarError(resultadoProfesional, error);
        return;
      }
      dialogoProfesional.cerrar();
      avisar('Profesional actualizado.');
      cargarProfesionales();
    });
  });

  // ---------- Buscar usuarios y cambiar su rol ----------

  async function buscarUsuarios() {
    const texto = formBuscar.elements.busqueda.value;
    mostrarCargando(zonaUsuarios, 'Buscando usuarios…');
    const { data, error } = await listarPerfiles({ busqueda: texto });
    if (error) {
      if (manejarSesionExpirada(error)) return;
      mostrarError(zonaUsuarios, error, { reintentar: buscarUsuarios });
      return;
    }
    if (data.length === 0) {
      mostrarVacio(zonaUsuarios, 'Ningún usuario coincide. La persona debe registrarse primero en la página de registro.');
      return;
    }
    limpiar(zonaUsuarios);
    zonaUsuarios.append(crearTabla({
      titulo: 'Usuarios encontrados',
      columnas: [
        { titulo: 'Nombre', valor: (u) => u.nombres || '(sin nombre)' },
        { titulo: 'Correo', valor: (u) => u.email ?? '—' },
        { titulo: 'Documento', valor: (u) => u.documento ?? '—' },
        { titulo: 'Rol', valor: (u) => NOMBRE_ROL[u.rol] ?? u.rol },
        { titulo: 'Cuenta', valor: (u) => etiquetaActivo(u.activo, { si: 'Activa', no: 'Inactiva' }) },
        {
          titulo: 'Acción',
          valor: (u) => {
            // Un admin no puede cambiar su propio rol (la RPC también lo impide).
            if (u.id === acceso.perfil.id) return 'Tu cuenta';
            const boton = crearBoton('Cambiar rol', () => abrirRol(u));
            boton.setAttribute('aria-label', `Cambiar el rol de ${u.nombres || u.email}`);
            return boton;
          },
        },
      ],
      filas: data,
    }));
  }

  function abrirRol(usuario) {
    usuarioEnEdicion = usuario;
    limpiar(resultadoRol);
    limpiarErrores(formRol);
    document.getElementById('rol-usuario').textContent =
      `${usuario.nombres || '(sin nombre)'} · ${usuario.email ?? ''} · rol actual: ${NOMBRE_ROL[usuario.rol] ?? usuario.rol}`;
    formRol.elements.rol.value = usuario.rol === 'profesional' ? 'admin' : 'profesional';
    formRol.elements.especialidad.value = '';
    formRol.elements.nombrePublico.value = '';
    mostrarCamposProfesional();
    dialogoRol.abrir();
  }

  function mostrarCamposProfesional() {
    camposProfesional.hidden = formRol.elements.rol.value !== 'profesional';
  }
  formRol.elements.rol.addEventListener('change', mostrarCamposProfesional);

  formRol.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limpiar(resultadoRol);
    const rol = formRol.elements.rol.value;
    const valido = validarFormulario(formRol, {
      especialidad: (valor) => (rol === 'profesional' && !valor ? 'Elige la especialidad del profesional.' : ''),
    });
    if (!valido) return;

    const ok = await confirmar({
      titulo: `¿Asignar el rol ${NOMBRE_ROL[rol]}?`,
      detalles: [usuarioEnEdicion.nombres || usuarioEnEdicion.email || ''],
      mensaje: rol === 'paciente'
        ? 'Perderá el acceso a su panel actual. Si era profesional, su ficha queda desactivada.'
        : 'Tendrá acceso al panel de ese rol desde su próximo inicio de sesión.',
      textoAceptar: 'Sí, asignar',
      textoCancelar: 'No, volver',
    });
    if (!ok) return;

    await conBotonOcupado(formRol, 'Asignando…', async () => {
      const { error } = await asignarRol(usuarioEnEdicion.id, rol, rol === 'profesional'
        ? {
          especialidad: Number(formRol.elements.especialidad.value),
          nombrePublico: formRol.elements.nombrePublico.value.trim() || null,
        }
        : {});
      if (error) {
        if (manejarSesionExpirada(error)) return;
        mostrarError(resultadoRol, error);
        return;
      }
      dialogoRol.cerrar();
      avisar(`Rol asignado: ${NOMBRE_ROL[rol]}.`);
      buscarUsuarios();
      cargarProfesionales();
    });
  });

  formBuscar.addEventListener('submit', (evento) => {
    evento.preventDefault();
    buscarUsuarios();
  });

  const errorCatalogo = await cargarEspecialidades();
  const redirigido = errorCatalogo !== null && manejarSesionExpirada(errorCatalogo);
  if (!redirigido) {
    if (errorCatalogo) avisar(mensajeDeError(errorCatalogo), 'error');
    cargarProfesionales();
  }
}
