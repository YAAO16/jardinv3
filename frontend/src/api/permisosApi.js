import apiClient from './axiosConfig'

export const permisosApi = {
  getAll: async () => {
    // 🔥 Cambiado de '/permisos' a '/usuarios/permisos'
    const response = await apiClient.get('/usuarios/permisos')
    return response.data
  },
  getByRol: async (rolId) => {
    // 🔥 Cambiado de '/roles/${rolId}/permisos' a '/usuarios/roles/${rolId}/permisos'
    const response = await apiClient.get(`/usuarios/roles/${rolId}/permisos`)
    return response.data
  },
  updateRol: async (rolId, permisosIds) => {
    // 🔥 Cambiado de '/roles/${rolId}/permisos' a '/usuarios/roles/${rolId}/permisos'
    const response = await apiClient.put(`/usuarios/roles/${rolId}/permisos`, { permisos: permisosIds })
    return response.data
  }
}