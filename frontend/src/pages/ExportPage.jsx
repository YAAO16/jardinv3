import React, { useState } from 'react'
import { FiDownload, FiUpload, FiFileText, FiTable, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { exportApi } from '../api/exportApi'
import ImportModal from '../components/export/ImportModal'
import toast from 'react-hot-toast'

const ExportPage = () => {
  const [expandido, setExpandido] = useState('arboles')
  const [showImport, setShowImport] = useState(false)
  const [importTipo, setImportTipo] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleExport = (tipo, formato) => {
    try {
      if (tipo === 'arboles' && formato === 'csv') exportApi.exportarArbolesCSV()
      else if (tipo === 'arboles' && formato === 'xlsx') exportApi.exportarArbolesXLSX()
      else if (tipo === 'especies' && formato === 'csv') exportApi.exportarEspeciesCSV()
      else if (tipo === 'especies' && formato === 'xlsx') exportApi.exportarEspeciesXLSX()
      toast.success(`Descargando ${tipo} en ${formato.toUpperCase()}...`)
    } catch (error) {
      toast.error('Error al exportar')
    }
  }

  const handleAbrirImport = (tipo) => {
    setImportTipo(tipo)
    setShowImport(true)
  }

  const secciones = [
    {
      id: 'arboles',
      titulo: '🌳 Inventario de Árboles',
      descripcion: 'Exporta o importa todos los datos de los árboles registrados.',
      color: 'bg-green-50 border-green-200'
    },
    {
      id: 'especies',
      titulo: '🌿 Catálogo de Especies',
      descripcion: 'Exporta o importa el catálogo completo de especies.',
      color: 'bg-blue-50 border-blue-200'
    }
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-forest-700">🔄 Importar / Exportar Datos</h1>
        <p className="text-gray-500 mt-1">Descarga o carga información masiva en formato CSV o Excel (XLSX)</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {secciones.map((seccion) => (
          <div key={seccion.id} className={`border rounded-xl overflow-hidden ${seccion.color}`}>
            <div 
              className="p-5 cursor-pointer hover:bg-black/5 transition flex justify-between items-center"
              onClick={() => setExpandido(expandido === seccion.id ? null : seccion.id)}
            >
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{seccion.titulo}</h3>
                  <p className="text-sm text-gray-600 mt-1">{seccion.descripcion}</p>
                </div>
              </div>
              {expandido === seccion.id ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
            </div>

            {expandido === seccion.id && (
              <div className="bg-white p-5 border-t border-gray-200 space-y-4">
                
                {/* Exportar */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FiDownload /> Exportar datos
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleExport(seccion.id, 'csv')}
                      className="flex items-center justify-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-forest-500 rounded-lg transition group"
                    >
                      <FiFileText size={24} className="text-gray-600 group-hover:text-forest-600" />
                      <div className="text-left">
                        <p className="font-bold text-gray-800">Descargar CSV</p>
                        <p className="text-xs text-gray-500">Compatible con Excel y Google Sheets</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleExport(seccion.id, 'xlsx')}
                      className="flex items-center justify-center gap-3 p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-500 rounded-lg transition group"
                    >
                      <FiTable size={24} className="text-green-600" />
                      <div className="text-left">
                        <p className="font-bold text-gray-800">Descargar Excel (XLSX)</p>
                        <p className="text-xs text-gray-500">Formato profesional con estilos</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Importar */}
                <div className="pt-3 border-t">
                  <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FiUpload /> Carga masiva
                  </p>
                  <button
                    onClick={() => handleAbrirImport(seccion.id)}
                    className="w-full flex items-center justify-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 hover:border-purple-500 rounded-lg transition group"
                  >
                    <FiUpload size={24} className="text-purple-600" />
                    <div className="text-left">
                      <p className="font-bold text-gray-800">Subir archivo CSV o XLSX</p>
                      <p className="text-xs text-gray-500">Importa múltiples registros de una sola vez</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-sm text-gray-700">
          <strong>💡 Información:</strong> Para la carga masiva, descarga primero la plantilla de cada sección 
          y llénala con los datos. Luego súbela al sistema. Los registros con errores se reportarán al final.
        </p>
      </div>

      {/* Modal de Importación */}
      {showImport && (
        <ImportModal
          tipo={importTipo}
          onClose={() => { setShowImport(false); setImportTipo(null) }}
          onSuccess={() => setRefreshKey(k => k + 1)}
        />
      )}
    </div>
  )
}

export default ExportPage