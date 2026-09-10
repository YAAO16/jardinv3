import apiClient from './axiosConfig'

export const reportesApi = {
  getVariables: async () => {
    const response = await apiClient.get('/reportes/variables')
    return response.data
  },
  getDatos: async () => {
    const response = await apiClient.get('/reportes/datos')
    return response.data
  },
  // ✅ Agrega esta función:
  getEstadisticasGenerales: async () => {
    const response = await apiClient.get('/reportes/estadisticas-generales')
    return response.data
  }
}