import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Trees, Package, BarChart3, Download, Shield, LogOut, Satellite } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const Sidebar = () => {
  const { user, logout } = useAuth()

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/arboles', icon: Trees, label: 'Inventario' },
    { to: '/especies', icon: Package, label: 'Especies' },
    { to: '/reportes', icon: BarChart3, label: 'Reportes' },
    { to: '/analisis-ndvi', icon: Satellite, label: 'Análisis NDVI' }, // ✅ Nuevo
    { to: '/export', icon: Download, label: 'Exportar' },
  ]

  // Solo si es administrador, agregar enlace a Administración
  if (user?.Rol === 'Administrador') {
    navItems.push({ to: '/admin', icon: Shield, label: 'Administración' })
  }

  return (
    <aside className="w-64 bg-forest-700 text-white flex flex-col shadow-xl">
      <div className="p-6 border-b border-forest-600">
        <h1 className="text-2xl font-bold tracking-tight">🌳 JBV2</h1>
        <p className="text-sm text-forest-300">Inventario Forestal</p>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
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