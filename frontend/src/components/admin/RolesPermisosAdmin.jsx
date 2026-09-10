import React, { useState, useEffect } from 'react'
import { rolesApi } from '@/api/rolesApi'
import { permisosApi } from '@/api/permisosApi'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'

const RolesPermisosAdmin = () => {
  const [roles, setRoles] = useState([])
  const [permisos, setPermisos] = useState([])
  const [rolSeleccionado, setRolSeleccionado] = useState(null)
  const [permisosAsignados, setPermisosAsignados] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [rolesData, permisosData] = await Promise.all([
        rolesApi.getAll(),
        permisosApi.getAll()
      ])
      setRoles(rolesData)
      setPermisos(permisosData)
      if (rolesData.length > 0) {
        setRolSeleccionado(rolesData[0])
        await cargarPermisosRol(rolesData[0].RolID)
      }
    } catch (error) {
      toast.error('Error al cargar datos')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const cargarPermisosRol = async (rolId) => {
    try {
      const data = await permisosApi.getByRol(rolId)
      setPermisosAsignados(data.map(p => p.PermisoID))
    } catch (error) {
      toast.error('Error al cargar permisos del rol')
    }
  }

  const handleRolChange = (rol) => {
    setRolSeleccionado(rol)
    cargarPermisosRol(rol.RolID)
    setEditando(false)
  }

  const togglePermiso = (permisoId) => {
    if (!editando) setEditando(true)
    setPermisosAsignados(prev =>
      prev.includes(permisoId)
        ? prev.filter(id => id !== permisoId)
        : [...prev, permisoId]
    )
  }

  const guardarCambios = async () => {
    try {
      await permisosApi.updateRol(rolSeleccionado.RolID, permisosAsignados)
      toast.success('Permisos actualizados')
      setEditando(false)
    } catch (error) {
      toast.error('Error al guardar')
    }
  }

  const cancelarCambios = () => {
    setEditando(false)
    cargarPermisosRol(rolSeleccionado.RolID)
  }

  const permisosPorCategoria = permisos.reduce((acc, p) => {
    const cat = p.Categoria || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  if (loading) return <div className="animate-pulse">Cargando permisos...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Roles y Permisos</h2>
        {editando && (
          <div className="flex gap-2">
            <button onClick={guardarCambios} className="btn-primary text-sm flex items-center gap-1">
              <Save size={16} /> Guardar
            </button>
            <button onClick={cancelarCambios} className="btn-secondary text-sm">
              Cancelar
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {roles.map((rol) => (
          <button
            key={rol.RolID}
            onClick={() => handleRolChange(rol)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              rolSeleccionado?.RolID === rol.RolID
                ? 'bg-forest-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {rol.NombreRol}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Permisos para <span className="text-forest-600">{rolSeleccionado?.NombreRol}</span>
        </h3>
        <div className="space-y-6">
          {Object.entries(permisosPorCategoria).map(([categoria, lista]) => (
            <div key={categoria}>
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {categoria}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {lista.map((permiso) => {
                  const asignado = permisosAsignados.includes(permiso.PermisoID)
                  return (
                    <label
                      key={permiso.PermisoID}
                      className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition ${
                        asignado
                          ? 'border-forest-200 bg-forest-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={asignado}
                        onChange={() => togglePermiso(permiso.PermisoID)}
                        className="w-4 h-4 text-forest-600 rounded focus:ring-forest-500"
                      />
                      <span className="text-sm text-gray-700">{permiso.NombrePermiso}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RolesPermisosAdmin