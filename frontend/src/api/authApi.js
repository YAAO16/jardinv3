import apiClient from './axiosConfig'

export const authApi = {
  login: async (usuario, contrasena) => {
    const response = await apiClient.post('/auth/login', { usuario, contrasena })
    return response.data
  },
}