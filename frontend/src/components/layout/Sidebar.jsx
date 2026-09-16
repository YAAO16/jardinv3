import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Trees,
  Package,
  BarChart3,
  Download,
  Shield,
  LogOut,
  Satellite,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { usePermission } from '../../hooks/usePermission'

const Sidebar = () => {
  const { user, logout } = useAuth()
  const { can, isAdmin } = usePermission()

  // Cada item declara qué permiso requiere para mostrarse.
  // Si no tiene 'permiso', siempre se muestra (para usuarios logueados).
  const navItems = [
    { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard',    permiso: null },
    { to: '/arboles',     icon: Trees,           label: 'Inventario',   permiso: 'arboles_ver' },
    { to: '/especies',    icon: Package,         label: 'Especies',     permiso: 'especies_ver' },
    { to: '/reportes',    icon: BarChart3,       label: 'Reportes',     permiso: 'reportes_ver' },
    { to: '/analisis-ndvi', icon: Satellite,     label: 'Análisis NDVI', permiso: 'arboles_ver' },
    { to: '/export',      icon: Download,        label: 'Exportar',     permiso: 'reportes_exportar_excel' },
  ]

  // Filtrar los que el usuario no puede ver
  const visibleItems = navItems.filter(
    (item) => !item.permiso || can(item.permiso)
  )

  return (
    <aside className="w-64 bg-forest-700 text-white flex flex-col shadow-xl">
      <div className="p-6 border-b border-forest-600">
        <h1 className="text-2xl font-bold tracking-tight">🌳 JARBOTAV3</h1>
        <p className="text-sm text-forest-300">Inventario Forestal</p>
        {user && (
          <p className="text-xs text-forest-200 mt-2">
            {user.usuario} · <span className="italic">{user.Rol}</span>
          </p>
        )}
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition duration-200 ${
                isActive
                  ? 'bg-forest-600 text-white shadow-md'
                  : 'text-forest-100 hover:bg-forest-600/50 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}

        {/* Administración: solo visible para Administrador */}
        {isAdmin() && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition duration-200 ${
                isActive
                  ? 'bg-forest-600 text-white shadow-md'
                  : 'text-forest-100 hover:bg-forest-600/50 hover:text-white'
              }`
            }
          >
            <Shield size={20} />
            <span className="font-medium">Administración</span>
          </NavLink>
        )}
      </nav>

      <div className="p-4 border-t border-forest-600">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-forest-200 hover:bg-forest-600 hover:text-white transition duration-200"
        >
          <LogOut size={20} />
          <span className="font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar