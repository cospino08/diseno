// Acceso a datos de perfiles (tabla profiles). Responsable: P4; lo usan P3 y P4.
//
// Todas las funciones devuelven { data, error } (ver respuesta.js).
//
// Seguridad (plan, sección 4, P4): el usuario solo puede actualizar sus datos personales.
// La columna `rol` NO se envía nunca desde aquí; aunque alguien la añadiera desde la consola
// del navegador, los permisos por columna de la base la rechazan (CP-06).
// Iniciar o cerrar sesión es responsabilidad de assets/js/auth.js (P3).
import { supabase } from './cliente.js';
import { ejecutar, SESION_EXPIRADA } from './respuesta.js';

const COLUMNAS_PERFIL = 'id, nombres, documento, telefono, fecha_nacimiento, rol, activo, created_at';

/** Campos que el propio usuario puede editar (coinciden con el GRANT por columna de P2). */
export const CAMPOS_EDITABLES = ['nombres', 'documento', 'telefono', 'fecha_nacimiento'];

/** Roles posibles (enum rol_usuario de la base). */
export const ROLES = ['paciente', 'profesional', 'admin'];

/** Perfil del usuario con sesión iniciada. */
export async function obtenerMiPerfil() {
  const { data: sesion } = await supabase.auth.getSession();
  const idUsuario = sesion?.session?.user?.id;
  if (!idUsuario) return { data: null, error: { codigo: SESION_EXPIRADA, detalle: 'Sin sesión' } };

  return ejecutar(() => supabase
    .from('profiles')
    .select(COLUMNAS_PERFIL)
    .eq('id', idUsuario)
    .maybeSingle());
}

/**
 * Actualiza los datos personales del usuario actual. Ignora cualquier campo que no esté en
 * CAMPOS_EDITABLES (por ejemplo `rol`), aunque la base también lo bloquearía.
 */
export async function actualizarMiPerfil(cambios) {
  const { data: sesion } = await supabase.auth.getSession();
  const idUsuario = sesion?.session?.user?.id;
  if (!idUsuario) return { data: null, error: { codigo: SESION_EXPIRADA, detalle: 'Sin sesión' } };

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
 * Lista perfiles (solo un admin recibe filas ajenas; la RLS lo garantiza).
 * @param {{ rol?: string|null, busqueda?: string }} filtros  busqueda: parte del nombre o documento.
 */
export function listarPerfiles({ rol = null, busqueda = '' } = {}) {
  return ejecutar(() => {
    let consulta = supabase
      .from('profiles')
      .select(COLUMNAS_PERFIL)
      .order('nombres')
      .limit(200);
    if (rol) consulta = consulta.eq('rol', rol);
    const texto = busqueda.trim();
    if (texto) {
      // Se quitan comas, paréntesis, asteriscos y porcentajes: tienen significado en la
      // sintaxis de filtros de PostgREST y romperían el `or`.
      const limpio = texto.replace(/[,()*%]/g, ' ');
      consulta = consulta.or(`nombres.ilike.*${limpio}*,documento.ilike.*${limpio}*`);
    }
    return consulta;
  });
}

/**
 * Cambia el rol de un usuario (solo admin). Si el rol es 'profesional', la RPC también crea
 * su fila en `professionals` con la especialidad indicada (plan P10).
 * Errores: NO_AUTORIZADO.
 * @param {string} idUsuario  UUID del perfil.
 * @param {'paciente'|'profesional'|'admin'} rol
 * @param {number|null} especialidad  obligatorio si rol = 'profesional'.
 */
export function asignarRol(idUsuario, rol, especialidad = null) {
  return ejecutar(() => supabase.rpc('asignar_rol', {
    p_usuario: idUsuario,
    p_rol: rol,
    p_especialidad: especialidad,
  }));
}
