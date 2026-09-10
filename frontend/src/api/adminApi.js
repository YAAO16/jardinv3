import apiClient from './axiosConfig'

export const adminApi = {
  getEstructura: async (tabla) => {
    const response = await apiClient.get(`/admin/estructura/${tabla}`)
    return response.data
  },
  agregarColumna: async (tabla, data) => {
    const response = await apiClient.post(`/admin/estructura/${tabla}/columna`, data)
    return response.data
  },
  editarColumna: async (tabla, columna, data) => {
    const response = await apiClient.put(`/admin/estructura/${tabla}/columna/${columna}`, data)
    return response.data
  },
  eliminarColumna: async (tabla, columna) => {
    const response = await apiClient.delete(`/admin/estructura/${tabla}/columna/${columna}`)
    return response.data
  }
}