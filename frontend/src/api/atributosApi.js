import apiClient from './axiosConfig'

export const atributosApi = {
  // Obtener atributos de un árbol específico
  getByArbol: async (arbolId) => {
    const response = await apiClient.get(`/arboles/${arbolId}/atributos`)
    return response.data
  },
  // Crear un atributo para un árbol
  create: async (arbolId, data) => {
    const response = await apiClient.post(`/arboles/${arbolId}/atributos`, data)
    return response.data
  },
  // Actualizar un atributo existente
  update: async (atributoId, data) => {
    const response = await apiClient.put(`/arboles/atributos/${atributoId}`, data)
    return response.data
  },
  // Eliminar un atributo
  delete: async (atributoId) => {
    const response = await apiClient.delete(`/arboles/atributos/${atributoId}`)
    return response.data
  }
}