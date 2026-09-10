import apiClient from './axiosConfig'

export const arbolesApi = {
  getAll: async () => {
    const response = await apiClient.get('/arboles') // Ahora va a localhost:8001/arboles (200 OK)
    return response.data
  },
  getById: async (id) => {
    const response = await apiClient.get(`/arboles/${id}`)
    return response.data
  },
  create: async (data) => {
    const response = await apiClient.post('/arboles', data)
    return response.data
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/arboles/${id}`, data)
    return response.data
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/arboles/${id}`)
    return response.data
  },
  uploadImage: async (id, file) => {
    const formData = new FormData()
    // ⚠️ Asegúrate de que 'imagen' sea la clave exacta esperada en req.file / upload.single(...)
    formData.append('imagen', file) 

    const response = await apiClient.post(`/arboles/${id}/imagen`, formData, {
        headers: {
        'Content-Type': 'multipart/form-data' // Garantiza el envío correcto del archivo
        }
    })
    return response.data
    }
}