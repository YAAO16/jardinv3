import apiClient from './axiosConfig'

export const rolesApi = {
  getAll: async () => {
    const response = await apiClient.get('/usuarios/roles')
    return response.data
  }
}