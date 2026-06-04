import { Routes, Route, Navigate } from 'react-router-dom'
import { NotificationProvider } from './context/NotificationContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Layout from './components/common/Layout'
import LoadingSpinner from './components/common/LoadingSpinner'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Customers from './pages/Customers'
import Orders from './pages/Orders'
import Users from './pages/Users'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

function AppRoutes() {
  const { loading } = useAuth()

  if (loading) return <LoadingSpinner fullPage />

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"           element={<Login />} />
      <Route path="/signup"          element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />

      {/* Protected routes — all authenticated users */}
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route index                element={<Dashboard />} />
              <Route path="products"      element={<Products />} />
              <Route path="customers"     element={<Customers />} />
              <Route path="orders"        element={<Orders />} />
              <Route path="users"         element={
                <ProtectedRoute roles={['admin']}>
                  <Users />
                </ProtectedRoute>
              } />
              <Route path="*"             element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </NotificationProvider>
  )
}
