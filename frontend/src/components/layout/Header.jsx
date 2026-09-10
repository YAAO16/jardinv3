import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { User, Bell } from 'lucide-react'

const Header = () => {
  const { user } = useAuth()

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">
          Bienvenido, <span className="text-forest-600">{user?.usuario || 'Usuario'}</span>
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-gray-100 transition">
          <Bell size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center">
            <User size={18} className="text-forest-700" />
          </div>
          <span className="text-sm text-gray-700">{user?.usuario}</span>
        </div>
      </div>
    </header>
  )
}

export default Header