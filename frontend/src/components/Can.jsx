import { usePermission } from '../hooks/usePermission'

/**
 * Componente que renderiza sus hijos solo si el usuario tiene el permiso.
 *
 * Uso:
 *   <Can permiso="especies_crear">
 *     <button>Nueva especie</button>
 *   </Can>
 *
 *   <Can permiso="especies_editar" fallback={<span>Sin permiso</span>}>
 *     <button>Editar</button>
 *   </Can>
 */
export const Can = ({ permiso, children, fallback = null }) => {
  const { can } = usePermission()
  return can(permiso) ? children : fallback
}

/**
 * Igual que <Can> pero verifica que el usuario sea Administrador.
 *
 * Uso:
 *   <IsAdmin>
 *     <NavLink to="/admin">Administración</NavLink>
 *   </IsAdmin>
 */
export const IsAdmin = ({ children, fallback = null }) => {
  const { isAdmin } = usePermission()
  return isAdmin() ? children : fallback
}