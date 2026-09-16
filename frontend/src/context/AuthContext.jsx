import React, { createContext, useState, useEffect } from 'react'
import { authApi } from '../api/authApi'
import toast from 'react-hot-toast'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // ──────────────────────────────────────────────────────
  // Cargar sesión guardada al iniciar
  // ──────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        const userData = JSON.parse(stored)
        setUser(userData)
        setIsAuthenticated(true)
      } catch (e) {
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  // ──────────────────────────────────────────────────────
  // Login
  // ──────────────────────────────────────────────────────
  const login = async (usuario, contrasena) => {
    try {
      const response = await authApi.login(usuario, contrasena)
      if (response.token) {
        const userData = {
          UsuarioID: response.UsuarioID,
          usuario: response.usuario,
          Rol: response.Rol,
          RolID: response.RolID,
          permisos: response.permisos || [],   // ← NUEVO
          token: response.token,
        }
        setUser(userData)
        setIsAuthenticated(true)
        localStorage.setItem('user', JSON.stringify(userData))
        toast.success(`Bienvenido, ${userData.usuario}`)
        return true
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al iniciar sesión')
      return false
    }
  }

  // ──────────────────────────────────────────────────────
  // Logout
  // ──────────────────────────────────────────────────────
  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('user')
    toast.success('Sesión cerrada')
  }

  // ──────────────────────────────────────────────────────
  // Verificación de permisos
  // ──────────────────────────────────────────────────────
  const hasPermission = (permiso) => {
    if (!user) return false
    if (!user.permisos) return false
    // Administrador tiene comodín
    if (user.permisos.includes('*')) return true
    return user.permisos.includes(permiso)
  }

  const isAdmin = () => user?.Rol === 'Administrador'

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        hasPermission,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}