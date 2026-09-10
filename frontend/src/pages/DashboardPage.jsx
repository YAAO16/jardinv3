import React, { useState, useEffect } from 'react'
import { reportesApi } from '../api/reportesApi'
import { Trees, Package, Leaf, CircleDollarSign, Activity, AlertCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const DashboardPage = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // ✅ Estado inicial CORREGIDO: sin anidación de 'metricas'
  const [stats, setStats] = useState({
    total_arboles: 0,
    total_especies: 0,
    biomasa_total: 0,
    carbono_total: 0,
    dap_promedio: 0,
    altura_promedio: 0,
    estado_sanitario: []
  })

  // ✅ Función SEGURA para convertir a número
  const toNumber = (value) => {
    if (value === null || value === undefined || value === '') return 0
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  // ✅ Función SEGURA para formatear números
  const formatNumber = (value, decimals = 2) => {
    const num = toNumber(value)
    return num.toFixed(decimals)
  }

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  const cargarEstadisticas = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reportesApi.getEstadisticasGenerales()
      console.log('📊 Datos completos:', data)
      
      // ✅ CORRECCIÓN PRINCIPAL: Leer las propiedades directamente del objeto 'data'
      const datosSeguros = {
        total_arboles: toNumber(data.total_arboles),
        total_especies: toNumber(data.total_especies),
        biomasa_total: toNumber(data.biomasa_total),
        carbono_total: toNumber(data.carbono_total),
        dap_promedio: toNumber(data.dap_promedio),
        altura_promedio: toNumber(data.altura_promedio),
        estado_sanitario: data.estado_sanitario || []
      }
      
      setStats(datosSeguros)
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error)
      let mensaje = 'Error al cargar estadísticas'
      if (error.response?.status === 401) {
        mensaje = 'Sesión expirada. Inicia sesión nuevamente.'
      } else if (error.code === 'ERR_NETWORK') {
        mensaje = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.'
      }
      setError(mensaje)
      toast.error(mensaje)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-forest-600 border-t-transparent"></div>
        <p className="ml-4 text-gray-500">Cargando estadísticas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700">Error al cargar datos</h3>
        <p className="text-gray-500 mt-2">{error}</p>
        <button 
          onClick={cargarEstadisticas}
          className="btn-primary mt-4 inline-flex items-center gap-2"
        >
          <RefreshCw size={16} /> Intentar de nuevo
        </button>
      </div>
    )
  }

  // ✅ LECTURA CORRECTA DE VARIABLES
  const totalBiomasa = toNumber(stats.biomasa_total)
  const totalCarbono = toNumber(stats.carbono_total)
  const promedioDap = toNumber(stats.dap_promedio)
  const promedioAltura = toNumber(stats.altura_promedio)

  const cards = [
    {
      title: 'Total Árboles',
      value: stats.total_arboles || 0,
      icon: Trees,
      color: 'bg-forest-50 text-forest-700',
      borderColor: 'border-forest-200'
    },
    {
      title: 'Total Especies',
      value: stats.total_especies || 0,
      icon: Package,
      color: 'bg-blue-50 text-blue-700',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Biomasa Total',
      value: `${formatNumber(totalBiomasa)} kg`,
      icon: Leaf,
      color: 'bg-green-50 text-green-700',
      borderColor: 'border-green-200'
    },
    {
      title: 'Carbono Total',
      value: `${formatNumber(totalCarbono)} kg`,
      icon: CircleDollarSign,
      color: 'bg-purple-50 text-purple-700',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Promedio DAP',
      value: `${formatNumber(promedioDap, 3)} m`,
      icon: Activity,
      color: 'bg-orange-50 text-orange-700',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Promedio Altura',
      value: `${formatNumber(promedioAltura, 2)} m`,
      icon: Trees,
      color: 'bg-teal-50 text-teal-700',
      borderColor: 'border-teal-200'
    }
  ]

  const estadoSanitario = stats.estado_sanitario || []
  const total = estadoSanitario.reduce((acc, item) => acc + (item.cantidad || 0), 0) || 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-forest-700">📊 Dashboard</h1>
        <p className="text-gray-500 mt-1">Resumen general del inventario forestal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`card hover:shadow-xl transition-shadow duration-300 border-l-4 ${card.borderColor}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{card.value}</p>
              </div>
              <div className={`p-3 rounded-full ${card.color}`}>
                <card.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {estadoSanitario.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">🩺 Estado Sanitario</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {estadoSanitario.map((item) => {
              const cantidad = toNumber(item.cantidad)
              const porcentaje = total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0
              const color =
                item.EstadoSanitario === 'BUENO'
                  ? 'bg-green-500'
                  : item.EstadoSanitario === 'REGULAR'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              return (
                <div key={item.EstadoSanitario} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{item.EstadoSanitario}</span>
                      <span className="text-gray-500">{cantidad} ({porcentaje}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div
                        className={`${color} h-2.5 rounded-full transition-all duration-700`}
                        style={{ width: `${porcentaje}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage