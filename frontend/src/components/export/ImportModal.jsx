import React, { useState, useRef } from 'react'
import { FiUpload, FiX, FiDownload, FiCheckCircle, FiAlertTriangle, FiFile } from 'react-icons/fi'
import { importApi } from '../../api/importApi'
import toast from 'react-hot-toast'

const ImportModal = ({ tipo, onClose, onSuccess }) => {
  const [archivo, setArchivo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState(null)
  const fileInputRef = useRef(null)

  const esArboles = tipo === 'arboles'

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const ext = file.name.toLowerCase().split('.').pop()
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      toast.error('Solo se permiten archivos CSV o XLSX')
      return
    }
    setArchivo(file)
    setResultado(null)
  }

  const handleDescargarPlantilla = () => {
    if (esArboles) {
      importApi.descargarPlantillaArboles()
    } else {
      importApi.descargarPlantillaEspecies()
    }
    toast.success('Plantilla descargada')
  }

  const handleSubir = async () => {
    if (!archivo) {
      toast.error('Primero selecciona un archivo')
      return
    }
    setLoading(true)
    try {
      const res = esArboles 
        ? await importApi.importarArboles(archivo)
        : await importApi.importarEspecies(archivo)
      
      setResultado(res)
      
      if (res.insertados > 0) {
        toast.success(`${res.insertados} registros importados correctamente`)
        if (onSuccess) onSuccess()
      }
      if (res.errores && res.errores.length > 0) {
        toast.error(`${res.errores.length} filas con errores`)
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al importar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b bg-gray-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-800">
            📤 Carga Masiva de {esArboles ? 'Árboles' : 'Especies'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Paso 1: Descargar plantilla */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold flex-shrink-0">1</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">Descarga la plantilla</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Usa esta plantilla con las columnas correctas para evitar errores.
                </p>
                <button
                  onClick={handleDescargarPlantilla}
                  className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
                >
                  <FiDownload /> Descargar Plantilla CSV
                </button>
              </div>
            </div>
          </div>

          {/* Paso 2: Subir archivo */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold flex-shrink-0">2</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">Sube el archivo completado</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Formatos permitidos: <strong>CSV, XLSX, XLS</strong>
                </p>
                
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                />
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 border-2 border-dashed border-green-300 hover:border-green-500 bg-white rounded-lg p-6 text-center cursor-pointer transition"
                >
                  {archivo ? (
                    <div className="flex items-center justify-center gap-3">
                      <FiFile size={32} className="text-green-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-800">{archivo.name}</p>
                        <p className="text-xs text-gray-500">{(archivo.size / 1024).toFixed(2)} KB</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setArchivo(null); setResultado(null) }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiX size={20} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <FiUpload size={32} className="text-green-600 mx-auto mb-2" />
                      <p className="text-gray-700 font-medium">Haz clic para seleccionar un archivo</p>
                      <p className="text-xs text-gray-500 mt-1">o arrastra y suelta aquí</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Paso 3: Resultado */}
          {resultado && (
            <div className={`border rounded-lg p-4 ${resultado.errores?.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                {resultado.errores?.length > 0 ? (
                  <><FiAlertTriangle className="text-yellow-600" /> Resultado de la importación</>
                ) : (
                  <><FiCheckCircle className="text-green-600" /> ¡Importación exitosa!</>
                )}
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white rounded p-2 text-center">
                  <p className="text-xs text-gray-500">Insertados</p>
                  <p className="text-xl font-bold text-green-600">{resultado.insertados}</p>
                </div>
                <div className="bg-white rounded p-2 text-center">
                  <p className="text-xs text-gray-500">Con errores</p>
                  <p className="text-xl font-bold text-red-600">{resultado.errores?.length || 0}</p>
                </div>
              </div>
              {resultado.errores?.length > 0 && (
                <div className="bg-white rounded p-3 max-h-40 overflow-y-auto">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Detalle de errores:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {resultado.errores.map((err, i) => (
                      <li key={i} className="border-l-2 border-red-400 pl-2">{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={onClose} className="btn-secondary">
              {resultado ? 'Cerrar' : 'Cancelar'}
            </button>
            {!resultado && (
              <button
                onClick={handleSubir}
                disabled={!archivo || loading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Importando...
                  </>
                ) : (
                  <>
                    <FiUpload /> Importar Datos
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImportModal