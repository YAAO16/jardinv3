import { useAuth } from './useAuth'

/**
 * Hook para verificar permisos del usuario autenticado.
 *
 * Uso:
 *   const { can, isAdmin, role } = usePermission()
 *   if (can('especies_crear')) { ... }
 */
export const usePermission = () => {
  const { user, hasPermission, isAdmin } = useAuth()
  return {
    can: hasPermission,
    isAdmin,
    role: user?.Rol,
    user,
  }
}