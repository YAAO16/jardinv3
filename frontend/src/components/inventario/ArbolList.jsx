import React, { useState, useMemo } from 'react'
import { FiEdit2, FiTrash2, FiEye, FiMapPin } from 'react-icons/fi'
import { arbolesApi } from '../../api/arbolesApi'
import ModalArbol from './ModalArbol'
import toast from 'react-hot-toast'

const ArbolList = ({ arboles, especies, onEdit, onDelete, onSelect, isAuthenticated }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedArbol, setSelectedArbol] = useState(null)
  const [loadingModal, setLoadingModal] = useState(false)

  const memoSelectedArbol = useMemo(() => selectedArbol, [selectedArbol])

  const getEspecieNombre = (id) => {
    const esp = especies.find(e => e.EspecieID === id)
    return esp ? esp.NombreComun : 'Desconocido'
  }

  const getEspecieCientifico = (id) => {
    const esp = especies.find(e => e.EspecieID === id)
    return esp ? esp.NombreCientifico : 'N/A'
  }

  const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined || value === '') return '-'
    const num = parseFloat(value)
    if (isNaN(num)) return '-'
    return num.toFixed(decimals)
  }

  const formatCO2e = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A'
    const num = parseFloat(value)
    if (isNaN(num)) return 'N/A'
    if (num >= 1000) return `${(num / 1000).toFixed(2)} t`
    return `${num.toFixed(2)} kg`
  }

  const handleView = async (arbol) => {
    try {
      setLoadingModal(true)
      const response = await arbolesApi.getById(arbol.MedicionArbolID)
      setSelectedArbol(response)
    } catch (error) {
      toast.error('Error al cargar los detalles')
      setSelectedArbol(arbol)
    } finally {
      setLoadingModal(false)
    }
  }

  const totalItems = arboles.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const start = (currentPage - 1) * itemsPerPage
  const currentItems = arboles.slice(start, start + itemsPerPage)

  if (arboles.length === 0) {
    return <div className="card text-center py-12"><p className="text-gray-500">No hay árboles registrados</p></div>
  }

  return (
    <div className="card">
      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-3">N°</th>
              <th className="text-left py-3 px-3">Especie</th>
              <th className="text-left py-3 px-3">DAP (m)</th>
              <th className="text-left py-3 px-3">Altura (m)</th>
              <th className="text-left py-3 px-3">Biomasa (kg)</th>
              <th className="text-left py-3 px-3">CO₂e</th>
              <th className="text-left py-3 px-3">Estado</th>
              <th className="text-left py-3 px-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((arbol) => (
              <tr key={arbol.MedicionArbolID} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-3 font-medium">{arbol.NumeroArbol || '-'}</td>
                <td className="py-2 px-3">
                  <div className="font-medium">{getEspecieNombre(arbol.EspecieID)}</div>
                  <div className="text-xs text-gray-400 italic">{getEspecieCientifico(arbol.EspecieID)}</div>
                </td>
                <td className="py-2 px-3">{formatNumber(arbol.DAP_M, 3)}</td>
                <td className="py-2 px-3">{formatNumber(arbol.AlturaTotal_Mts, 2)}</td>
                <td className="py-2 px-3">{formatNumber(arbol.BiomasaAerea_kg, 2)}</td>
                <td className="py-2 px-3 font-semibold text-forest-600">{formatCO2e(arbol.CO2e_kg)}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${arbol.EstadoSanitario === 'BUENO' ? 'bg-green-100 text-green-700' : arbol.EstadoSanitario === 'REGULAR' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {arbol.EstadoSanitario || 'N/A'}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <div className="flex gap-1">
                    <button onClick={() => handleView(arbol)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Ver detalle"><FiEye size={16} /></button>
                    <button onClick={() => onSelect && onSelect(arbol)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="Ver en mapa"><FiMapPin size={16} /></button>
                    {isAuthenticated && (
                      <>
                        <button onClick={() => onEdit(arbol)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Editar"><FiEdit2 size={16} /></button>
                        <button onClick={() => onDelete(arbol.MedicionArbolID)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Eliminar"><FiTrash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">Mostrando {start+1}-{Math.min(start+itemsPerPage, totalItems)} de {totalItems}</span>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-3 py-1 rounded border border-gray-200 disabled:opacity-50 hover:bg-gray-50">Anterior</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded border border-gray-200 disabled:opacity-50 hover:bg-gray-50">Siguiente</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {memoSelectedArbol && (
        <ModalArbol
          arbol={memoSelectedArbol}
          onClose={() => { setSelectedArbol(null); setLoadingModal(false) }}
          onEdit={(a) => { onEdit(a); setSelectedArbol(null) }}
        />
      )}
    </div>
  )
}

export default ArbolList