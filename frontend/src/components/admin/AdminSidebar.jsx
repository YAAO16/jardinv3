import React from 'react'
import { Users, Database, Shield, Settings, Key, TreePine, Package } from 'lucide-react'

const AdminSidebar = ({ activeSection, setActiveSection }) => {
  const sections = [
    { id: 'usuarios', icon: Users, label: 'Usuarios' },
    { id: 'columnas', icon: Database, label: 'Estructura DB' },
    { id: 'roles', icon: Shield, label: 'Roles y Permisos' },
    { id: 'especies', icon: Package, label: 'Especies' },
    { id: 'arboles', icon: TreePine, label: 'Árboles' },
  ]

  return (
    <aside className="w-56 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-forest-50">
        <h3 className="text-sm font-semibold text-forest-700 flex items-center gap-2">
          <Settings size={16} /> Administración
        </h3>
      </div>
      <nav className="p-2 space-y-1">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
              activeSection === section.id
                ? 'bg-forest-100 text-forest-700 font-medium shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-forest-600'
            }`}
          >
            <section.icon size={18} />
            <span>{section.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default AdminSidebar