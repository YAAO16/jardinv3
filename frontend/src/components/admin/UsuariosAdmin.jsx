import React, { useState, useEffect } from 'react'
import { usuariosApi } from '@/api/usuariosApi'
import { rolesApi } from '@/api/rolesApi'
import { useAuth } from '@/hooks/useAuth'
import { UserPlus, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const UsuariosAdmin = () => {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    Usuario: '',
    Contrasena: '',
    RolID: 1
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [usuariosData, rolesData] = await Promise.all([
        usuariosApi.getAll(),
        rolesApi.getAll()
      ])
      setUsuarios(usuariosData)
      setRoles(rolesData)
    } catch (error) {
      toast.error('Error al cargar datos')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await usuariosApi.update(editingUser.UsuarioID, formData)
        toast.success('Usuario actualizado')
      } else {
        await usuariosApi.create(formData)
        toast.success('Usuario creado')
      }
      setShowModal(false)
      setEditingUser(null)
      setFormData({ Usuario: '', Contrasena: '', RolID: 1 })
      cargarDatos()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este usuario?')) {
      try {
        await usuariosApi.delete(id)
        toast.success('Usuario eliminado')
        cargarDatos()
      } catch (error) {
        toast.error('Error al eliminar')
      }
    }
  }

  const openModal = (usuario = null) => {
    if (usuario) {
      setEditingUser(usuario)
      setFormData({
        Usuario: usuario.Usuario,
        Contrasena: '',
        RolID: usuario.RolID || 1
      })
    } else {
      setEditingUser(null)
      setFormData({ Usuario: '', Contrasena: '', RolID: 1 })
    }
    setShowModal(true)
  }

  const getRolNombre = (rolId) => {
    const rol = roles.find(r => r.RolID === rolId)
    return rol ? rol.NombreRol : 'Desconocido'
  }

  if (loading) return <div className="animate-pulse">Cargando usuarios...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">👥 Usuarios</h2>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <UserPlus size={18} /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Usuario</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Rol</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.UsuarioID} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{usuario.UsuarioID}</td>
                  <td className="py-3 px-4 font-medium">{usuario.Usuario}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      usuario.RolID === 1 ? 'bg-forest-100 text-forest-700' :
                      usuario.RolID === 2 ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {getRolNombre(usuario.RolID)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => openModal(usuario)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition">
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(usuario.UsuarioID)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                        disabled={usuario.UsuarioID === user?.UsuarioID}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Usuario</label>
                <input
                  type="text"
                  value={formData.Usuario}
                  onChange={(e) => setFormData({ ...formData, Usuario: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">
                  {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                </label>
                <input
                  type="password"
                  value={formData.Contrasena}
                  onChange={(e) => setFormData({ ...formData, Contrasena: e.target.value })}
                  className="input-field"
                  required={!editingUser}
                  placeholder={editingUser ? 'Dejar vacío para mantener' : '••••••••'}
                />
              </div>
              <div>
                <label className="label">Rol</label>
                <select
                  value={formData.RolID}
                  onChange={(e) => setFormData({ ...formData, RolID: parseInt(e.target.value) })}
                  className="input-field"
                >
                  {roles.map((rol) => (
                    <option key={rol.RolID} value={rol.RolID}>{rol.NombreRol}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingUser(null)
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsuariosAdmin