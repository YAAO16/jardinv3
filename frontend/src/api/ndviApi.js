import apiClient from './axiosConfig'

export const ndviApi = {
  // Estadísticas NDVI agrupadas por estado sanitario
  getEstadisticas: async () => {
    const response = await apiClient.get('/ndvi/estadisticas')
    return response.data
  },
  // Calcular NDVI de un árbol específico
  calcularArbol: async (arbolId) => {
    const response = await apiClient.post(`/ndvi/arbol/${arbolId}`)
    return response.data
  },
  // Calcular NDVI masivo
  calcularBulk: async () => {
    const response = await apiClient.post('/ndvi/bulk')
    return response.data
  }
}