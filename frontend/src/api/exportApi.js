import apiClient from './axiosConfig'

export const exportApi = {
  // Exportar árboles
  exportarArbolesCSV: () => {
    window.open(`${apiClient.defaults.baseURL}/export/arboles/csv`, '_blank')
  },
  exportarArbolesXLSX: () => {
    window.open(`${apiClient.defaults.baseURL}/export/arboles/xlsx`, '_blank')
  },
  // Exportar especies
  exportarEspeciesCSV: () => {
    window.open(`${apiClient.defaults.baseURL}/export/especies/csv`, '_blank')
  },
  exportarEspeciesXLSX: () => {
    window.open(`${apiClient.defaults.baseURL}/export/especies/xlsx`, '_blank')
  }
}