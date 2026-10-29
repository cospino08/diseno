// Gestión de pacientes: desactivar, reactivar y anonimizar (RF-21, CU-12, CP-27). Responsable: P4.
//
// Desactivar: rol_actual() devuelve null para esa cuenta y todas las RPC la rechazan.
// Anonimizar: atiende una solicitud de baja (plan P13). Reemplaza los datos personales,
// desactiva la cuenta y cancela sus citas futuras; las citas se conservan para la
// trazabilidad. No se puede deshacer, por eso pide confirmación explícita.
import { protegerPagina, manejarSesionExpirada } from '../assets/js/auth.js';
import { listarPerfiles, cambiarActivoPerfil, anonimizarPaciente } from '../assets/js/datos/perfiles.js';
import { mostrarCargando, mostrarError, mostrarVacio, limpiar, avisar } from '../assets/js/ui/estados.js';
import { confirmar } from '../assets/js/ui/dialogo.js';
import { mensajeDeError } from '../assets/js/ui/mensajes.js';
import { crearTabla, crearBoton, etiquetaActivo, grupoAcciones } from './componentes.js';

// Texto que deja anonimizar_paciente en `nombres` (contrato 3.13).
const NOMBRE_ANONIMIZADO = 'Paciente anonimizado';

const acceso = await protegerPagina({ roles: ['admin'] });

if (acceso) {
  const formulario = document.getElementById('form-buscar');
  const resumen = document.getElementById('resumen-pacientes');
  const zona = document.getElementById('zona-pacientes');

  async function buscar() {
    mostrarCargando(zona, 'Buscando pacientes…');
    resumen.textContent = '';
    const { data, error } = await listarPerfiles({ rol: 'paciente', busqueda: formulario.elements.busqueda.value });
    if (error) {
      if (manejarSesionExpirada(error)) return;
      mostrarError(zona, error, { reintentar: buscar });
      return;
    }
    if (data.length === 0) {
      mostrarVacio(zona, 'Ningún paciente coincide con la búsqueda.');
      return;
    }
    resumen.textContent = data.length === 50
      ? 'Se muestran los primeros 50 pacientes. Escribe un nombre, documento o correo para afinar.'
      : `${data.length} ${data.length === 1 ? 'paciente' : 'pacientes'}.`;
    limpiar(zona);
    zona.append(crearTabla({
      titulo: 'Pacientes',
      columnas: [
        { titulo: 'Nombre', valor: (p) => p.nombres || '(sin nombre)' },
        { titulo: 'Documento', valor: (p) => p.documento ?? '—' },
        { titulo: 'Correo', valor: (p) => p.email ?? '—' },
        { titulo: 'Teléfono', valor: (p) => p.telefono ?? '—' },
        { titulo: 'Cuenta', valor: (p) => etiquetaActivo(p.activo, { si: 'Activa', no: 'Inactiva' }) },
        { titulo: 'Acciones', valor: (p) => acciones(p) },
      ],
      filas: data,
    }));
  }

  function acciones(paciente) {
    const nombre = paciente.nombres || paciente.email || 'paciente';
    if (paciente.nombres === NOMBRE_ANONIMIZADO && !paciente.activo) return 'Anonimizado';
    const alternar = crearBoton(paciente.activo ? 'Desactivar' : 'Reactivar', () => alternarActivo(paciente),
      paciente.activo ? 'peligro' : 'secundario');
    alternar.setAttribute('aria-label', `${paciente.activo ? 'Desactivar' : 'Reactivar'} la cuenta de ${nombre}`);
    const botonAnonimizar = crearBoton('Anonimizar', () => anonimizar(paciente), 'peligro');
    botonAnonimizar.setAttribute('aria-label', `Anonimizar a ${nombre}`);
    return grupoAcciones(alternar, botonAnonimizar);
  }

  async function alternarActivo(paciente) {
    const nombre = paciente.nombres || paciente.email;
    if (paciente.activo) {
      const ok = await confirmar({
        titulo: `¿Desactivar la cuenta de ${nombre}?`,
        mensaje: 'No podrá reservar ni consultar sus citas hasta que la reactives. Sus citas actuales se conservan.',
        textoAceptar: 'Sí, desactivar',
        textoCancelar: 'No, volver',
        peligro: true,
      });
      if (!ok) return;
    }
    const { error } = await cambiarActivoPerfil(paciente.id, !paciente.activo);
    if (error) {
      if (manejarSesionExpirada(error)) return;
      avisar(mensajeDeError(error), 'error');
      return;
    }
    avisar(`Cuenta de ${nombre} ${paciente.activo ? 'desactivada' : 'reactivada'}.`);
    buscar();
  }

  async function anonimizar(paciente) {
    const ok = await confirmar({
      titulo: `¿Anonimizar a ${paciente.nombres || paciente.email}?`,
      detalles: [`Documento: ${paciente.documento ?? '—'}`, `Correo: ${paciente.email ?? '—'}`],
      mensaje: 'Se borran sus datos personales, se desactiva la cuenta y se cancelan sus citas futuras. '
        + 'Las citas pasadas se conservan sin datos personales. Esta acción NO se puede deshacer.',
      textoAceptar: 'Sí, anonimizar',
      textoCancelar: 'No, volver',
      peligro: true,
    });
    if (!ok) return;
    const { error } = await anonimizarPaciente(paciente.id);
    if (error) {
      if (manejarSesionExpirada(error)) return;
      avisar(mensajeDeError(error), 'error');
      return;
    }
    avisar('Paciente anonimizado. Sus citas futuras quedaron canceladas.');
    buscar();
  }

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    buscar();
  });

  buscar();
}
