import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:8001',
})

// 🔑 INTERCEPTOR: Agrega el token a todas las peticiones
apiClient.interceptors.request.use((config) => {
  const userString = localStorage.getItem('user')
  if (userString) {
    try {
      const user = JSON.parse(userString)
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`
      }
    } catch (e) {
      console.error('Error al parsear user:', e)
    }
  }
  return config
})

export default apiClient