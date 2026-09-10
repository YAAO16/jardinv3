import React, { useState } from 'react'
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi'
import EspecieForm from './EspecieForm'
import toast from 'react-hot-toast'

// Añadimos onRefresh a las props
const EspecieList = ({ especies, onDelete, onRefresh }) => {
  const [showModal, setShowModal] = useState(false)
  const [editEspecie, setEditEspecie] = useState(null)

  const handleNew = () => {
    setEditEspecie(null)
    setShowModal(true)
  }

  const handleEdit = (esp) => {
    setEditEspecie(esp)
    setShowModal(true)
  }

  const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Seguro que deseas eliminar la especie "${nombre}"?`)) {
      await onDelete(id) // El padre maneja la eliminación y refresca la lista
    }
  }

  // Se ejecuta cuando el formulario crea o actualiza correctamente
  const handleFormSuccess = async () => {
    setShowModal(false)
    setEditEspecie(null)
    await onRefresh() // ¡Refresca la lista inmediatamente!
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">🌿 Lista de Especies</h2>
        <button onClick={handleNew} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
          <FiPlus /> Nueva Especie
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-3">ID</th>
              <th className="text-left py-3 px-3">Nombre Común</th>
              <th className="text-left py-3 px-3">Nombre Científico</th>
              <th className="text-left py-3 px-3">Familia</th>
              <th className="text-left py-3 px-3">Categoría</th>
              <th className="text-left py-3 px-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {especies.map((esp) => (
              <tr key={esp.EspecieID} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-3 font-medium">{esp.EspecieID}</td>
                <td className="py-2 px-3">{esp.NombreComun}</td>
                <td className="py-2 px-3 italic text-gray-600">{esp.NombreCientifico}</td>
                <td className="py-2 px-3">{esp.Familia || '-'}</td>
                <td className="py-2 px-3">
                  {esp.Categoria && (
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                      {esp.Categoria}
                    </span>
                  )}
                </td>
                <td className="py-2 px-3">
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(esp)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Editar">
                      <FiEdit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(esp.EspecieID, esp.NombreComun)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Eliminar">
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-xl">
               <h2 className="text-xl font-bold text-gray-800">{editEspecie ? 'Editar Especie' : 'Nueva Especie'}</h2>
               <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-red-500"><FiX size={24} /></button>
             </div>
             <div className="p-6">
               <EspecieForm 
                 editEspecie={editEspecie} 
                 onSuccess={handleFormSuccess} // Ahora llama a la función que actualiza
                 onCancel={() => {
                   setShowModal(false)
                   setEditEspecie(null)
                 }}
               />
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EspecieList