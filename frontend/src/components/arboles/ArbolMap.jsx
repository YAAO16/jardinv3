import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, WMSTileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ========== ICONOS DE LEAFLET ==========
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ========== INSTANCE ID DE COPERNICUS ==========
const SENTINEL_INSTANCE_ID = '4026ee33-4f70-40cb-a4d1-cdd6e6a12814'

// ========== CAPAS BASE ==========
const capas = {
  satelite: {
    name: '🛰️ Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© ESRI',
  },
  callejero: {
    name: '🗺️ Mapa',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© CartoDB, © OpenStreetMap',
  },
  hibrido: {
    name: '🌍 Híbrido',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    attribution: '© CartoDB, © OpenStreetMap',
  },
}

const FitBounds = ({ positions }) => {
  const map = useMap()
  useEffect(() => {
    if (positions && positions.length > 0) {
      const bounds = L.latLngBounds(positions)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [map, positions])
  return null
}

const formatNumber = (value, decimals = 2) => {
  if (!value && value !== 0) return 'N/A'
  const num = parseFloat(value)
  if (isNaN(num)) return 'N/A'
  return num.toFixed(decimals)
}

const formatCO2e = (value) => {
  if (!value && value !== 0) return 'N/A'
  const num = parseFloat(value)
  if (isNaN(num)) return 'N/A'
  return num >= 1000 ? `${(num / 1000).toFixed(2)} t` : `${num.toFixed(2)} kg`
}

const ArbolMap = ({ arboles = [], especies = [], selectedArbol, onSelect }) => {
  const [capaActiva, setCapaActiva] = useState('satelite')
  const [mapCenter, setMapCenter] = useState([1.0878, -76.6314]) // JARBOTA - Mocoa, Putumayo
  const [mostrarNDVI, setMostrarNDVI] = useState(false)

  const getEspecieNombre = (id) => {
    if (!especies.length) return 'Desconocido'
    const esp = especies.find(e => e.EspecieID === id)
    return esp ? esp.NombreComun : 'Desconocido'
  }

  const puntos = useMemo(() => {
    if (!arboles.length) return []
    return arboles
      .filter(a => a.Latitud && a.Longitud)
      .map(a => ({
        id: a.MedicionArbolID,
        lat: parseFloat(a.Latitud),
        lng: parseFloat(a.Longitud),
        nombre: getEspecieNombre(a.EspecieID),
        dap: parseFloat(a.DAP_M) || 0,
        altura: parseFloat(a.AlturaTotal_Mts) || 0,
        estado: a.EstadoSanitario,
        biomasa: parseFloat(a.BiomasaAerea_kg) || 0,
        co2e: parseFloat(a.CO2e_kg) || 0,
        ndvi: a.NDVI,
        ndviFecha: a.NDVI_fecha,
        arbol: a
      }))
  }, [arboles, especies])

  useEffect(() => {
    if (selectedArbol && selectedArbol.Latitud && selectedArbol.Longitud) {
      setMapCenter([parseFloat(selectedArbol.Latitud), parseFloat(selectedArbol.Longitud)])
    } else if (puntos.length > 0) {
      setMapCenter([puntos[0].lat, puntos[0].lng])
    }
  }, [selectedArbol, puntos])

  if (puntos.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">No hay árboles con coordenadas para mostrar en el mapa</p>
      </div>
    )
  }

  // Color del marcador según NDVI (o Estado Sanitario como fallback)
  const getColorMarcador = (p) => {
    if (p.ndvi !== null && p.ndvi !== undefined) {
      const ndvi = parseFloat(p.ndvi)
      if (ndvi >= 0.6) return 'green'
      if (ndvi >= 0.4) return '#9acd32'
      if (ndvi >= 0.2) return 'orange'
      return 'red'
    }
    if (p.estado === 'BUENO') return 'green'
    if (p.estado === 'REGULAR') return 'orange'
    return 'red'
  }

  return (
    <div className="card p-2">
      {/* ========== CONTROLES DE CAPAS ========== */}
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        {Object.entries(capas).map(([key, capa]) => (
          <button
            key={key}
            onClick={() => setCapaActiva(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              capaActiva === key ? 'bg-forest-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {capa.name}
          </button>
        ))}

        {/* Toggle de capa NDVI */}
        <div className="ml-auto flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={mostrarNDVI}
              onChange={(e) => setMostrarNDVI(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <span className="font-semibold text-purple-700">🛰️ Capa NDVI (Sentinel-2)</span>
          </label>
        </div>
      </div>

      {/* ========== LEYENDA NDVI ========== */}
      {mostrarNDVI && (
        <div className="mb-3 bg-white border border-purple-200 rounded-lg p-3 flex flex-wrap items-center gap-4 text-xs">
          <span className="font-semibold text-gray-700">Leyenda NDVI:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#B33A1F' }}></div>
            <span>Suelo (&lt;0.2)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#E6B333' }}></div>
            <span>Vegetación baja (0.2-0.4)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#99CC4D' }}></div>
            <span>Vegetación media (0.4-0.6)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#1A801A' }}></div>
            <span>Vegetación densa (&gt;0.6)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded border" style={{ backgroundColor: 'transparent' }}></div>
            <span>Nubes/Agua</span>
          </div>
        </div>
      )}

      {/* ========== MAPA ========== */}
      <MapContainer
        key={capaActiva}
        center={mapCenter}
        zoom={16}
        style={{ height: '600px', width: '100%', borderRadius: '12px' }}
      >
        {/* Capa base */}
        <TileLayer attribution={capas[capaActiva].attribution} url={capas[capaActiva].url} />

        {/* Capa NDVI de Sentinel-2 */}
        {mostrarNDVI && (
          <WMSTileLayer
            url={`https://sh.dataspace.copernicus.eu/ogc/wms/${SENTINEL_INSTANCE_ID}`}
            layers="NDVI"
            format="image/png"
            transparent={true}
            version="1.3.0"
            opacity={0.75}
            attribution="Sentinel-2 © Copernicus Data Space"
            time="2024-06-01/2024-09-30"
          />
        )}

        {/* Marcadores de árboles */}
        {puntos.map(p => {
          const co2eFormatted = formatCO2e(p.co2e)
          const color = getColorMarcador(p)
          const isSelected = selectedArbol && selectedArbol.MedicionArbolID === p.id

          const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="
              background-color:${isSelected ? '#2d6a4f' : color};
              width:${isSelected ? 22 : 14}px;
              height:${isSelected ? 22 : 14}px;
              border-radius:50%;
              border:3px solid white;
              box-shadow:0 2px 6px rgba(0,0,0,0.4);
            "></div>`,
            iconSize: isSelected ? [22, 22] : [14, 14],
            iconAnchor: isSelected ? [11, 11] : [7, 7],
          })

          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={icon}
              eventHandlers={{ click: () => onSelect && onSelect(p.arbol) }}
            >
              <Popup>
                <div className="text-sm max-w-xs">
                  <h4 className="font-bold text-forest-700 text-base mb-1">
                    🌳 Árbol #{p.arbol.NumeroArbol}
                  </h4>
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium">Especie:</span> {p.nombre}
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <p><span className="font-medium">DAP:</span> {formatNumber(p.dap, 3)} m</p>
                    <p><span className="font-medium">Altura:</span> {formatNumber(p.altura, 2)} m</p>
                    <p><span className="font-medium">Biomasa:</span> {formatNumber(p.biomasa, 2)} kg</p>
                    <p><span className="font-medium">CO₂e:</span> <strong className="text-forest-700">{co2eFormatted}</strong></p>
                  </div>
                  {p.ndvi !== null && p.ndvi !== undefined && (
                    <div className="mt-2 bg-purple-50 rounded p-2 border border-purple-200">
                      <p className="text-xs">
                        <span className="font-medium">🛰️ NDVI:</span>{' '}
                        <strong className="text-purple-700">{formatNumber(p.ndvi, 4)}</strong>
                      </p>
                      {p.ndviFecha && (
                        <p className="text-[10px] text-gray-500">
                          Fecha: {new Date(p.ndviFecha).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                  <p className="mt-2">
                    <span className="font-medium">Estado:</span>{' '}
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      p.estado === 'BUENO' ? 'bg-green-100 text-green-700' :
                      p.estado === 'REGULAR' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {p.estado || 'N/A'}
                    </span>
                  </p>
                </div>
              </Popup>
            </Marker>
          )
        })}

        <FitBounds positions={puntos.map(p => [p.lat, p.lng])} />
      </MapContainer>
    </div>
  )
}

export default ArbolMap