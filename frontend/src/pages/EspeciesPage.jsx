import React, { useState, useEffect, useCallback } from 'react'
import { especiesApi } from '../api/especiesApi'
import EspecieList from '../components/especies/EspecieList'
import toast from 'react-hot-toast'

const EspeciesPage = ({ isAuthenticated }) => {
  const [especies, setEspecies] = useState([])
  const [loading, setLoading] = useState(false)

  const loadEspecies = useCallback(async () => {
    setLoading(true)
    try {
      const data = await especiesApi.getAll()
      setEspecies(data)
    } catch (error) {
      toast.error('Error al cargar las especies')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEspecies()
  }, [loadEspecies])

  const handleDelete = async (id) => {
    try {
      await especiesApi.delete(id)
      toast.success('Especie eliminada')
      await loadEspecies() // Refresca la lista
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al eliminar la especie')
    }
  }

  // Función que se pasa al hijo para refrescar después de crear o actualizar
  const handleRefresh = async () => {
    await loadEspecies()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🌿 Módulo de Especies</h1>
      
      {loading ? (
        <p className="text-center py-10 text-gray-500">Cargando especies...</p>
      ) : (
        <EspecieList 
          especies={especies} 
          onDelete={handleDelete}
          onRefresh={handleRefresh} // <--- ¡Esta es la clave!
          isAuthenticated={isAuthenticated}
        />
      )}
    </div>
  )
}

export default EspeciesPage