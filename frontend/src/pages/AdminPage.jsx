import React, { useState } from 'react'
import UsuariosAdmin from '../components/admin/UsuariosAdmin'
import RolesPermisosAdmin from '../components/admin/RolesPermisosAdmin'
import GestionColumnas from '../components/admin/GestionColumnas'
import { Users, Shield, Database } from 'lucide-react'

const AdminPage = () => {
  const [seccion, setSeccion] = useState('usuarios')

  const opciones = [
    { id: 'usuarios', icon: Users, label: 'Usuarios' },
    { id: 'roles', icon: Shield, label: 'Roles y Permisos' },
    { id: 'columnas', icon: Database, label: 'Columnas' },
  ]

  return (
    <div className="flex h-full gap-6">
      <aside className="w-56 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 h-fit sticky top-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Administración</h3>
        <nav className="space-y-1">
          {opciones.map((op) => (
            <button
              key={op.id}
              onClick={() => setSeccion(op.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                seccion === op.id
                  ? 'bg-forest-50 text-forest-700 font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <op.icon size={18} />
              <span className="text-sm">{op.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        {seccion === 'usuarios' && <UsuariosAdmin />}
        {seccion === 'roles' && <RolesPermisosAdmin />}
        {seccion === 'columnas' && <GestionColumnas tabla="Info_arboles" />}
      </div>
    </div>
  )
}

export default AdminPage