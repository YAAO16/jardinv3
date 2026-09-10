import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import Layout from './components/layout/Layout'
import AdminPage from './pages/AdminPage'
import InventarioPage from './pages/InventarioPage'
import EspeciesPage from './pages/EspeciesPage' // ✅ Importación real
import ReportesPage from './pages/ReportesPage' // ✅ Importación real
import ExportPage from './pages/ExportPage' // ✅ Importación real
import AnalisisNDVIPage from './pages/AnalisisNDVIPage' // ✅ Importación real

// Páginas placeholder (las crearemos después)
// ❌ ELIMINADA: const EspeciesPage = () => <div className="p-6 text-xl">🌿 Especies</div>
//const ReportesPage = () => <div className="p-6 text-xl">📊 Reportes</div>
//const ExportPage = () => <div className="p-6 text-xl">⬇️ Exportar</div>
const NotFoundPage = () => <div className="p-6 text-xl">404 - Página no encontrada</div>

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>
  }
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/especies" element={
          <ProtectedRoute>
            <Layout>
              <EspeciesPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <Layout>
              <AdminPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/arboles" element={
          <ProtectedRoute>
            <Layout>
              <InventarioPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/reportes" element={
          <ProtectedRoute>
            <Layout>
              <ReportesPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/export" element={
          <ProtectedRoute>
            <Layout>
              <ExportPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/analisis-ndvi" element={
          <ProtectedRoute>
            <Layout>
              <AnalisisNDVIPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App