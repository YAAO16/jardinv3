import React, { useState, useEffect } from 'react'
import { arbolesApi } from '../api/arbolesApi'
import { especiesApi } from '../api/especiesApi'
import { useAuth } from '../hooks/useAuth'
import ArbolList from '../components/inventario/ArbolList'
import ArbolForm from '../components/inventario/ArbolForm'
import ArbolMap from '../components/inventario/ArbolMap'
import { Plus, List, Map, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const InventarioPage = () => {
  const { isAuthenticated } = useAuth()
  const [arboles, setArboles] = useState([])
  const [especies, setEspecies] = useState([])
  const [loading, setLoading] = useState(true)
  const [modoVista, setModoVista] = useState('list') // 'list' | 'map'
  const [showForm, setShowForm] = useState(false)
  const [editingArbol, setEditingArbol] = useState(null)
  const [selectedArbol, setSelectedArbol] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [arbolesData, especiesData] = await Promise.all([
        arbolesApi.getAll(),
        especiesApi.getAll()
      ])
      setArboles(arbolesData || [])
      setEspecies(especiesData || [])
    } catch (error) {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Corregido: ya no ejecuta llamadas a la API (se procesaron en ArbolForm)
  const handleSuccess = async () => {
    await cargarDatos()
    setShowForm(false)
    setEditingArbol(null)
  }

  const handleEdit = (arbol) => {
    setEditingArbol(arbol)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este árbol?')) {
      try {
        await arbolesApi.delete(id)
        toast.success('Árbol eliminado')
        await cargarDatos()
      } catch (error) {
        toast.error('Error al eliminar')
      }
    }
  }

  const handleSelect = (arbol) => {
    setSelectedArbol(arbol)
    setModoVista('map')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-forest-700">🌳 Inventario Forestal</h1>
          <p className="text-gray-500 mt-1">Gestión de árboles y servicios ecosistémicos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setModoVista('list')}
            className={`px-4 py-2 rounded-lg transition ${modoVista === 'list' ? 'bg-forest-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <List size={18} className="inline mr-1" /> Lista
          </button>
          <button
            onClick={() => setModoVista('map')}
            className={`px-4 py-2 rounded-lg transition ${modoVista === 'map' ? 'bg-forest-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <Map size={18} className="inline mr-1" /> Mapa
          </button>
          <button onClick={cargarDatos} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition" title="Refrescar">
            <RefreshCw size={18} className="text-gray-600" />
          </button>
          {isAuthenticated && (
            <button onClick={() => { setShowForm(!showForm); setEditingArbol(null) }} className="btn-primary">
              <Plus size={18} className="inline mr-1" /> {showForm ? 'Cancelar' : 'Nuevo Árbol'}
            </button>
          )}
        </div>
      </div>

      {/* Formulario */}
      {isAuthenticated && showForm && (
        <div className="card">
          <ArbolForm
            especies={especies}
            editArbol={editingArbol}
            onSuccess={handleSuccess}
            onCancel={() => { setShowForm(false); setEditingArbol(null) }}
          />
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-forest-600 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {modoVista === 'list' && (
            <ArbolList
              arboles={arboles}
              especies={especies}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSelect={handleSelect}
              isAuthenticated={isAuthenticated}
            />
          )}
          {modoVista === 'map' && (
            <ArbolMap
              arboles={arboles}
              especies={especies}
              selectedArbol={selectedArbol}
              onSelect={setSelectedArbol}
            />
          )}
        </>
      )}
    </div>
  )
}

export default InventarioPage