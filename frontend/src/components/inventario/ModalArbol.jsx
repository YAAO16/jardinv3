import React, { useState, useEffect } from 'react'
import { FiX, FiMapPin, FiActivity, FiTag, FiFileText, FiImage, FiInfo, FiBox } from 'react-icons/fi'

const ModalArbol = ({ arbol, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [imagenError, setImagenError] = useState(false)

  useEffect(() => {
    if (arbol) {
      setIsVisible(true)
      document.body.style.overflow = 'hidden'
      setImagenError(false)
    }
    return () => { document.body.style.overflow = 'auto' }
  }, [arbol])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 200)
  }

  if (!arbol) return null

  const estadoInfo = {
    'BUENO': { bg: '#d4edda', color: '#155724', icon: '🟢', label: 'Bueno' },
    'REGULAR': { bg: '#fff3cd', color: '#856404', icon: '🟡', label: 'Regular' },
    'MALO': { bg: '#f8d7da', color: '#721c24', icon: '🔴', label: 'Malo' },
  }[arbol.EstadoSanitario] || { bg: '#e9ecef', color: '#6c757d', icon: '⚪', label: 'N/A' }

  const imagenUrl = arbol.ImagenURL ? `http://localhost:8001${arbol.ImagenURL}` : null

  const formatCO2e = (v) => {
    if (!v) return 'No calculado'
    const num = parseFloat(v)
    if (isNaN(num)) return 'No calculado'
    return num >= 1000 ? `${(num/1000).toFixed(2)} t` : `${num.toFixed(2)} kg`
  }

  const formatNumber = (v, decimals = 2) => {
    if (v === null || v === undefined || v === '') return '—'
    const num = parseFloat(v)
    if (isNaN(num)) return '—'
    return num.toFixed(decimals)
  }

  // Sección de información general
  const infoGeneral = [
    { label: 'Especie', value: arbol.NombreComun || '—', sub: arbol.NombreCientifico || '—' },
    { label: 'Familia', value: arbol.Familia || '—' },
    { label: 'Categoría', value: arbol.Categoria || '—' },
  ]

  // Medidas dendrométricas
  const medidas = [
    { label: 'DAP', value: arbol.DAP_M ? `${formatNumber(arbol.DAP_M, 3)} m` : '—' },
    { label: 'CAP', value: arbol.CAP_Cm ? `${formatNumber(arbol.CAP_Cm, 1)} cm` : '—' },
    { label: 'Altura total', value: arbol.AlturaTotal_Mts ? `${formatNumber(arbol.AlturaTotal_Mts, 2)} m` : '—' },
    { label: 'Altura comercial', value: arbol.AlturaComercial_Mts ? `${formatNumber(arbol.AlturaComercial_Mts, 2)} m` : '—' },
    { label: 'Área basal', value: arbol.AreaBasal_M2 ? `${formatNumber(arbol.AreaBasal_M2, 4)} m²` : '—' },
    { label: 'Volumen total', value: arbol.VolumenTotal_M3 ? `${formatNumber(arbol.VolumenTotal_M3, 3)} m³` : '—' },
  ]

  // Ubicación
  const ubicacion = [
    { label: 'Latitud', value: arbol.Latitud ? formatNumber(arbol.Latitud, 6) : '—' },
    { label: 'Longitud', value: arbol.Longitud ? formatNumber(arbol.Longitud, 6) : '—' },
    { label: 'Punto GPS', value: arbol.PuntoGPS || '—' },
    { label: 'Transecto', value: arbol.Transecto || '—' },
  ]

  // Características (booleanos)
  const caracteristicas = [
    { label: 'Proyección Copa X', value: arbol.ProyeccionCopa_X },
    { label: 'Proyección Copa Y', value: arbol.ProyeccionCopa_Y },
    { label: 'Epífitas', value: arbol.PresenciaEpifitas },
    { label: 'Nidos', value: arbol.PresenciaNidos },
    { label: 'Otra fauna', value: arbol.PresenciaOtraFauna },
  ]

  return (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto transition-transform duration-300 ${isVisible ? 'scale-100' : 'scale-95'}`}
        onClick={(e) => e.stopPropagation()}
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm rounded-t-2xl border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌳</span>
              <h3 className="text-xl font-bold text-gray-800">
                Árbol #{arbol.NumeroArbol || '?'}
              </h3>
            </div>
            <span 
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium`}
              style={{ background: estadoInfo.bg, color: estadoInfo.color }}
            >
              {estadoInfo.icon} {estadoInfo.label}
            </span>
          </div>
          <button 
            onClick={handleClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna Izquierda */}
            <div className="space-y-6">
              {/* Información General */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <FiInfo size={16} /> Información general
                </h4>
                <dl className="space-y-2">
                  {infoGeneral.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-200/60 last:border-0">
                      <dt className="text-sm text-gray-600">{item.label}</dt>
                      <dd className="text-sm font-medium text-gray-800 text-right">
                        {item.value}
                        {item.sub && item.sub !== '—' && (
                          <span className="block text-xs text-gray-400 italic">{item.sub}</span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Medidas Dendrométricas */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <FiActivity size={16} /> Medidas dendrométricas
                </h4>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {medidas.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-200/60 last:border-0 col-span-1">
                      <dt className="text-sm text-gray-600">{item.label}</dt>
                      <dd className="text-sm font-mono text-gray-800">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Ubicación */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <FiMapPin size={16} /> Ubicación
                </h4>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {ubicacion.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-200/60 last:border-0 col-span-1">
                      <dt className="text-sm text-gray-600">{item.label}</dt>
                      <dd className="text-sm font-mono text-gray-800">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-6">
              {/* Características */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <FiTag size={16} /> Características
                </h4>
                <div className="grid grid-cols-2 gap-1">
                  {caracteristicas.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-200/60 last:border-0">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <span className={`text-sm font-medium ${item.value ? 'text-green-600' : 'text-gray-400'}`}>
                        {item.value ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Servicios Ecosistémicos */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <h4 className="text-sm font-semibold text-green-700 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <FiBox size={16} /> Servicios ecosistémicos
                </h4>
                <dl className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-green-200/60">
                    <dt className="text-sm text-green-700">Densidad de la madera</dt>
                    <dd className="text-sm font-mono text-green-800">
                      {arbol.DensidadMadera ? `${formatNumber(arbol.DensidadMadera, 4)} g/cm³` : 'No registrada'}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-green-200/60">
                    <dt className="text-sm text-green-700">Biomasa aérea (AGB)</dt>
                    <dd className="text-sm font-mono text-green-800">
                      {arbol.BiomasaAerea_kg ? `${formatNumber(arbol.BiomasaAerea_kg, 2)} kg` : 'No calculado'}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-green-200/60">
                    <dt className="text-sm text-green-700">Carbono almacenado</dt>
                    <dd className="text-sm font-mono text-green-800">
                      {arbol.Carbono_kg ? `${formatNumber(arbol.Carbono_kg, 2)} kg` : 'No calculado'}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <dt className="text-sm font-semibold text-green-800">CO₂ equivalente</dt>
                    <dd className="text-sm font-bold text-green-900">
                      {formatCO2e(arbol.CO2e_kg)}
                    </dd>
                  </div>
                </dl>
                <p className="text-xs text-green-600/70 mt-2 italic">* Estimado con modelo de Chave et al. (2014)</p>
              </div>

              {/* Observaciones */}
              {arbol.Observaciones && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                    <FiFileText size={16} /> Observaciones
                  </h4>
                  <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200 whitespace-pre-wrap">
                    {arbol.Observaciones}
                  </p>
                </div>
              )}

              {/* Imagen */}
              {imagenUrl && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                    <FiImage size={16} /> Imagen
                  </h4>
                  <div className="flex justify-center">
                    <img
                      src={imagenUrl}
                      alt={`Árbol ${arbol.NumeroArbol}`}
                      className="max-h-56 w-auto rounded-lg border border-gray-200 object-cover shadow-sm"
                      onError={() => setImagenError(true)}
                    />
                    {imagenError && (
                      <p className="text-sm text-red-500 mt-2 text-center">No se pudo cargar la imagen</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 rounded-b-2xl flex justify-end">
          <button 
            onClick={handleClose} 
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalArbol