import React, { useState, useEffect } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ZAxis,
  BarChart, Bar, Cell, LabelList,
  LineChart, Line
} from 'recharts'
import { FiRefreshCw, FiDownload, FiActivity, FiTrendingUp, FiAward } from 'react-icons/fi'
import { ndviApi } from '../api/ndviApi'
import toast from 'react-hot-toast'

// Colores por estado sanitario
const COLORES_ESTADO = {
  BUENO: '#16a34a',
  REGULAR: '#eab308',
  MALO: '#dc2626',
}

const AnalisisNDVIPage = () => {
  const [loading, setLoading] = useState(true)
  const [calculando, setCalculando] = useState(false)
  const [datos, setDatos] = useState({ resumen: [], detalle: [], total_con_ndvi: 0 })

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const data = await ndviApi.getEstadisticas()
      setDatos(data)
    } catch (error) {
      console.error('Error al cargar NDVI:', error)
      toast.error('Error al cargar los datos de NDVI')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const handleCalcularBulk = async () => {
    if (!window.confirm('Esto calculará el NDVI para todos los árboles sin NDVI. ¿Continuar?')) return
    setCalculando(true)
    try {
      const res = await ndviApi.calcularBulk()
      toast.success(`${res.procesados} árboles procesados correctamente`)
      await cargarDatos()
    } catch (error) {
      toast.error('Error al calcular NDVI masivo')
    } finally {
      setCalculando(false)
    }
  }

  // Formatear datos para Recharts
  const datosResumen = datos.resumen.map(r => ({
    estado: r.EstadoSanitario,
    cantidad: r.total_arboles,
    ndvi_promedio: parseFloat(r.ndvi_promedio) || 0,
    ndvi_min: parseFloat(r.ndvi_min) || 0,
    ndvi_max: parseFloat(r.ndvi_max) || 0,
    ndvi_desviacion: parseFloat(r.ndvi_desviacion) || 0,
    color: COLORES_ESTADO[r.EstadoSanitario] || '#6b7280'
  }))

  // Datos para dispersión: cada árbol es un punto (índice, NDVI, tamaño por biomasa)
  const datosDispersion = datos.detalle
    .filter(d => d.NDVI !== null)
    .map((d, idx) => ({
      index: idx + 1,
      numero: d.NumeroArbol,
      ndvi: parseFloat(d.NDVI),
      estado: d.EstadoSanitario,
      color: COLORES_ESTADO[d.EstadoSanitario] || '#6b7280',
    }))

  // Agrupar por estado para colorear la dispersión
  const dispersionPorEstado = ['BUENO', 'REGULAR', 'MALO'].map(estado => ({
    estado,
    color: COLORES_ESTADO[estado],
    puntos: datosDispersion.filter(d => d.estado === estado)
  }))

  // Estadísticas globales
  const totalArboles = datos.total_con_ndvi
  const ndviGlobal = datos.detalle.length > 0
    ? (datos.detalle.reduce((s, d) => s + parseFloat(d.NDVI || 0), 0) / datos.detalle.length).toFixed(4)
    : '0.0000'

  const exportarCSV = () => {
    const filas = [
      ['NumeroArbol', 'EstadoSanitario', 'NDVI', 'NDVI_fecha'],
      ...datos.detalle.map(d => [d.NumeroArbol, d.EstadoSanitario, d.NDVI, d.NDVI_fecha])
    ]
    const csv = filas.map(fila => fila.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `analisis_ndvi_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    toast.success('CSV exportado')
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-500">Cargando análisis NDVI...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* ========== ENCABEZADO ========== */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🛰️ Análisis NDVI - Sentinel-2</h1>
          <p className="text-gray-500 mt-1">
            Correlación entre el índice de vegetación satelital y el estado sanitario de los árboles
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCalcularBulk}
            disabled={calculando}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            {calculando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Calculando...
              </>
            ) : (
              <>
                <FiRefreshCw /> Calcular NDVI Masivo
              </>
            )}
          </button>
          <button
            onClick={exportarCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <FiDownload /> Exportar CSV
          </button>
        </div>
      </div>

      {/* ========== TARJETAS DE ESTADÍSTICAS ========== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-700 font-medium">NDVI Global Promedio</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{ndviGlobal}</p>
            </div>
            <div className="bg-purple-500 text-white p-3 rounded-full">
              <FiActivity size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-700 font-medium">Árboles con NDVI Calculado</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{totalArboles}</p>
            </div>
            <div className="bg-green-500 text-white p-3 rounded-full">
              <FiAward size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-700 font-medium">Estados Evaluados</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{datosResumen.length}</p>
            </div>
            <div className="bg-blue-500 text-white p-3 rounded-full">
              <FiTrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* ========== GRÁFICOS ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 1: NDVI Promedio por Estado Sanitario */}
        <div className="bg-white p-5 rounded-xl shadow-md">
          <h3 className="font-semibold text-gray-800 mb-4">📊 NDVI Promedio por Estado Sanitario</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosResumen}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="estado" />
              <YAxis domain={[0, 1]} />
              <Tooltip formatter={(value) => value.toFixed(4)} />
              <Bar dataKey="ndvi_promedio" name="NDVI Promedio">
                {datosResumen.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
                <LabelList dataKey="ndvi_promedio" position="top" formatter={(v) => v.toFixed(3)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico 2: Cantidad de Árboles por Estado */}
        <div className="bg-white p-5 rounded-xl shadow-md">
          <h3 className="font-semibold text-gray-800 mb-4">🌳 Distribución de Árboles por Estado</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosResumen} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="estado" />
              <Tooltip />
              <Bar dataKey="cantidad" name="Árboles">
                {datosResumen.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
                <LabelList dataKey="cantidad" position="right" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 3: Dispersión completa */}
      <div className="bg-white p-5 rounded-xl shadow-md">
        <h3 className="font-semibold text-gray-800 mb-4">
          📉 Dispersión de NDVI por Árbol (coloreado por estado sanitario)
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="index" 
              name="Índice de Árbol" 
              label={{ value: 'Árbol #', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              dataKey="ndvi" 
              name="NDVI" 
              domain={[0, 1]}
              label={{ value: 'NDVI', angle: -90, position: 'insideLeft' }}
            />
            <ZAxis range={[80, 80]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload
                  return (
                    <div className="bg-white p-2 rounded shadow border text-xs">
                      <p><strong>Árbol #{d.numero}</strong></p>
                      <p>Estado: <span style={{ color: d.color }}>{d.estado}</span></p>
                      <p>NDVI: <strong>{d.ndvi.toFixed(4)}</strong></p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend />
            {dispersionPorEstado.map(({ estado, color, puntos }) => (
              <Scatter
                key={estado}
                name={estado}
                data={puntos}
                fill={color}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico 4: Rango de NDVI (min-max) por estado */}
      <div className="bg-white p-5 rounded-xl shadow-md">
        <h3 className="font-semibold text-gray-800 mb-4">📏 Rango de NDVI por Estado (min-max)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={datosResumen}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="estado" />
            <YAxis domain={[0, 1]} />
            <Tooltip formatter={(value) => parseFloat(value).toFixed(4)} />
            <Legend />
            <Bar dataKey="ndvi_min" name="NDVI Mínimo" fill="#f87171" />
            <Bar dataKey="ndvi_promedio" name="NDVI Promedio" fill="#60a5fa" />
            <Bar dataKey="ndvi_max" name="NDVI Máximo" fill="#34d399" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ========== TABLA DETALLADA ========== */}
      <div className="bg-white p-5 rounded-xl shadow-md">
        <h3 className="font-semibold text-gray-800 mb-4">📋 Detalle de Árboles con NDVI</h3>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left py-3 px-3">#</th>
                <th className="text-left py-3 px-3">N° Árbol</th>
                <th className="text-left py-3 px-3">Estado Sanitario</th>
                <th className="text-right py-3 px-3">NDVI</th>
                <th className="text-left py-3 px-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {datos.detalle.map((d, i) => (
                <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 text-gray-500">{i + 1}</td>
                  <td className="py-2 px-3 font-medium">{d.NumeroArbol}</td>
                  <td className="py-2 px-3">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${COLORES_ESTADO[d.EstadoSanitario]}20`,
                        color: COLORES_ESTADO[d.EstadoSanitario]
                      }}
                    >
                      {d.EstadoSanitario}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold">
                    {parseFloat(d.NDVI).toFixed(4)}
                  </td>
                  <td className="py-2 px-3 text-gray-500 text-xs">
                    {d.NDVI_fecha ? new Date(d.NDVI_fecha).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== INTERPRETACIÓN CIENTÍFICA ============ */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">📚 Interpretación</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li><strong>NDVI &gt; 0.6</strong>: Vegetación densa y saludable (bosque húmedo tropical).</li>
          <li><strong>NDVI 0.4 - 0.6</strong>: Vegetación moderada o en desarrollo.</li>
          <li><strong>NDVI 0.2 - 0.4</strong>: Vegetación escasa o estresada.</li>
          <li><strong>NDVI &lt; 0.2</strong>: Suelo desnudo, agua o nubes.</li>
          <li className="mt-2 text-xs italic">
            Nota: Sentinel-2 tiene resolución de 10 m/píxel. El NDVI refleja la respuesta espectral 
            del dosel circundante más que el estado fitosanitario del tronco individual.
          </li>
        </ul>
      </div>
    </div>
  )
}

export default AnalisisNDVIPage