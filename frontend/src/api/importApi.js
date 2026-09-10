import apiClient from './axiosConfig'

export const importApi = {
  descargarPlantillaArboles: () => {
    window.open(`${apiClient.defaults.baseURL}/import/plantilla/arboles`, '_blank')
  },
  descargarPlantillaEspecies: () => {
    window.open(`${apiClient.defaults.baseURL}/import/plantilla/especies`, '_blank')
  },
  
  // ✅ NO poner headers, dejar que Axios lo haga
  importarArboles: async (file) => {
    const formData = new FormData()
    formData.append('archivo', file)
    const response = await apiClient.post('/import/arboles', formData)
    return response.data
  },
  importarEspecies: async (file) => {
    const formData = new FormData()
    formData.append('archivo', file)
    const response = await apiClient.post('/import/especies', formData)
    return response.data
  }
}