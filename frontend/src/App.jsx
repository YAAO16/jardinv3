import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import { usePermission } from './hooks/usePermission'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import Layout from './components/layout/Layout'
import AdminPage from './pages/AdminPage'
import InventarioPage from './pages/InventarioPage'
import EspeciesPage from './pages/EspeciesPage'
import ReportesPage from './pages/ReportesPage'
import ExportPage from './pages/ExportPage'
import AnalisisNDVIPage from './pages/AnalisisNDVIPage'

const NotFoundPage = () => <div className="p-6 text-xl">404 - Página no encontrada</div>
const UnauthorizedPage = () => (
  <div className="p-6 text-center">
    <h2 className="text-2xl font-bold text-red-600">⛔ Acceso denegado</h2>
    <p className="text-gray-500 mt-2">No tienes permisos para ver esta página.</p>
  </div>
)

// ──────────────────────────────────────────────────────
// ProtectedRoute: exige autenticación
// ──────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// ──────────────────────────────────────────────────────
// RequirePermission: exige un permiso específico
// ──────────────────────────────────────────────────────
const RequirePermission = ({ permiso, children }) => {
  const { can } = usePermission()
  if (!can(permiso)) {
    return (
      <Layout>
        <UnauthorizedPage />
      </Layout>
    )
  }
  return children
}

// ──────────────────────────────────────────────────────
// RequireAdmin: exige rol Administrador
// ──────────────────────────────────────────────────────
const RequireAdmin = ({ children }) => {
  const { isAdmin } = usePermission()
  if (!isAdmin()) {
    return (
      <Layout>
        <UnauthorizedPage />
      </Layout>
    )
  }
  return children
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard — cualquier usuario logueado */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Especies — requiere especies_ver */}
        <Route
          path="/especies"
          element={
            <ProtectedRoute>
              <RequirePermission permiso="especies_ver">
                <Layout>
                  <EspeciesPage />
                </Layout>
              </RequirePermission>
            </ProtectedRoute>
          }
        />

        {/* Inventario — requiere arboles_ver */}
        <Route
          path="/arboles"
          element={
            <ProtectedRoute>
              <RequirePermission permiso="arboles_ver">
                <Layout>
                  <InventarioPage />
                </Layout>
              </RequirePermission>
            </ProtectedRoute>
          }
        />

        {/* Reportes — requiere reportes_ver */}
        <Route
          path="/reportes"
          element={
            <ProtectedRoute>
              <RequirePermission permiso="reportes_ver">
                <Layout>
                  <ReportesPage />
                </Layout>
              </RequirePermission>
            </ProtectedRoute>
          }
        />

        {/* Exportar — requiere reportes_exportar_excel */}
        <Route
          path="/export"
          element={
            <ProtectedRoute>
              <RequirePermission permiso="reportes_exportar_excel">
                <Layout>
                  <ExportPage />
                </Layout>
              </RequirePermission>
            </ProtectedRoute>
          }
        />

        {/* Análisis NDVI — requiere arboles_ver */}
        <Route
          path="/analisis-ndvi"
          element={
            <ProtectedRoute>
              <RequirePermission permiso="arboles_ver">
                <Layout>
                  <AnalisisNDVIPage />
                </Layout>
              </RequirePermission>
            </ProtectedRoute>
          }
        />

        {/* Admin — SOLO Administrador */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RequireAdmin>
                <Layout>
                  <AdminPage />
                </Layout>
              </RequireAdmin>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App