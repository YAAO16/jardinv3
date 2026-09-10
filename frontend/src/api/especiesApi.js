import apiClient from './axiosConfig'

export const especiesApi = {
  getAll: async () => {
    const response = await apiClient.get('/especies')
    return response.data
  },
  getById: async (id) => {
    const response = await apiClient.get(`/especies/${id}`)
    return response.data
  },
  create: async (data) => {
    const response = await apiClient.post('/especies', data, {
      headers: { 'Content-Type': 'application/json' }
    })
    return response.data
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/especies/${id}`, data, {
      headers: { 'Content-Type': 'application/json' }
    })
    return response.data
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/especies/${id}`)
    return response.data
  }
}