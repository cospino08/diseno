// Acceso a datos de perfiles (tabla profiles). Responsable: P4; lo usan P3 y P4.
//
// Todas las funciones devuelven { data, error } (ver respuesta.js).
//
// Seguridad (contrato 2.1): cada usuario solo puede actualizar sus datos personales; el
// admin, los de cualquiera. La columna `rol` NO se envía nunca desde aquí; aunque alguien
// la añadiera desde la consola del navegador, los permisos por columna la rechazan con
// 42501 (CP-06). Los roles solo cambian con asignarRol().
// Iniciar o cerrar sesión y leer el perfil propio para las guardas es de auth.js (P3).
import { supabase } from './cliente.js';
import { ejecutar } from './respuesta.js';

const COLUMNAS_PERFIL = 'id, email, nombres, documento, telefono, fecha_nacimiento, rol, activo, created_at';

/** Campos que se pueden editar (coinciden con el GRANT por columna de P2). */
export const CAMPOS_EDITABLES = ['nombres', 'documento', 'telefono', 'fecha_nacimiento'];

/** Roles posibles (enum rol_usuario). */
export const ROLES = ['paciente', 'profesional', 'admin'];

/**
 * Actualiza datos personales de un perfil: el propio, o cualquiera si quien llama es admin.
 * Ignora todo campo fuera de CAMPOS_EDITABLES (por ejemplo `rol`), aunque la base también
 * lo bloquearía. Errores: DATO_DUPLICADO (documento repetido), DATO_INVALIDO (formato).
 */
export function actualizarPerfil(idUsuario, cambios) {
  const permitidos = {};
  for (const campo of CAMPOS_EDITABLES) {
    if (campo in cambios) permitidos[campo] = cambios[campo];
  }
  return ejecutar(() => supabase
    .from('profiles')
    .update(permitidos)
    .eq('id', idUsuario)
    .select(COLUMNAS_PERFIL)
    .single());
}

// ---------------------------------------------------------------------------------------
// Administración (P4)
// ---------------------------------------------------------------------------------------

/**
 * Lista perfiles (solo el admin recibe filas ajenas; la RLS lo garantiza). Máximo 50.
 * @param {{ rol?: string|null, busqueda?: string }} filtros
 *        busqueda: parte del nombre, del documento o del correo.
 */
export function listarPerfiles({ rol = null, busqueda = '' } = {}) {
  return ejecutar(() => {
    let consulta = supabase
      .from('profiles')
      .select(COLUMNAS_PERFIL)
      .order('nombres')
      .limit(50);
    if (rol) consulta = consulta.eq('rol', rol);
    // Se quitan los caracteres que tienen significado en la sintaxis de filtros de
    // PostgREST (coma, paréntesis, asterisco, porcentaje, comillas y barra invertida):
    // si no, el texto del usuario podría alterar el filtro `or`.
    const texto = busqueda.replace(/[,()*%"\\]/g, ' ').trim();
    if (texto) {
      consulta = consulta.or(`nombres.ilike.*${texto}*,documento.ilike.*${texto}*,email.ilike.*${texto}*`);
    }
    return consulta;
  });
}

/**
 * Cambia el rol de un usuario (contrato 3.11, solo admin). Con rol 'profesional' crea (o
 * reactiva) su fila en `professionals`; con otro rol, la desactiva. Un admin no puede
 * cambiar su propio rol.
 * Errores: NO_AUTORIZADO, DATOS_INVALIDOS.
 * @param {string} idUsuario  UUID del perfil.
 * @param {'paciente'|'profesional'|'admin'} rol
 * @param {{ especialidad?: number|null, nombrePublico?: string|null }} datosProfesional
 *        obligatorio `especialidad` si rol = 'profesional'; sin nombre público se usan los nombres.
 */
export function asignarRol(idUsuario, rol, { especialidad = null, nombrePublico = null } = {}) {
  return ejecutar(() => supabase.rpc('asignar_rol', {
    p_usuario: idUsuario,
    p_rol: rol,
    p_especialidad: especialidad,
    p_nombre_publico: nombrePublico,
  }));
}

/**
 * Activa o desactiva una cuenta (contrato 3.12). Una cuenta desactivada no puede usar
 * ninguna RPC. Un admin no puede desactivarse a sí mismo.
 * Errores: NO_AUTORIZADO, DATOS_INVALIDOS.
 */
export function cambiarActivoPerfil(idUsuario, activo) {
  return ejecutar(() => supabase.rpc('cambiar_activo_perfil', { p_usuario: idUsuario, p_activo: activo }));
}

/**
 * Atiende una solicitud de baja de un paciente (contrato 3.13): reemplaza sus datos
 * personales, lo desactiva y cancela sus citas futuras. No se puede deshacer.
 * Errores: NO_AUTORIZADO, DATOS_INVALIDOS.
 */
export function anonimizarPaciente(idUsuario) {
  return ejecutar(() => supabase.rpc('anonimizar_paciente', { p_usuario: idUsuario }));
}
