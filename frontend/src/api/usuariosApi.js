import apiClient from './axiosConfig'

export const usuariosApi = {
  getAll: async () => {
    const response = await apiClient.get('/usuarios')
    return response.data
  },
  create: async (data) => {
    const response = await apiClient.post('/usuarios', data)
    return response.data
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/usuarios/${id}`, data)
    return response.data
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/usuarios/${id}`)
    return response.data
  }
}