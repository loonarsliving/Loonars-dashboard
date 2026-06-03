import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import OwnerLayout from './components/OwnerLayout'
import AdminLayout from './components/AdminLayout'

// Owner pages
import OwnerDashboard from './pages/owner/Dashboard'
import OwnerOrders from './pages/owner/Orders'
import OwnerProducts from './pages/owner/Products'
import OwnerCustomers from './pages/owner/Customers'
import OwnerReports from './pages/owner/Reports'
import OwnerSettings from './pages/owner/Settings'
import OwnerUsers from './pages/owner/Users'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminOrders from './pages/admin/Orders'
import AdminProducts from './pages/admin/Products'
import AdminCustomers from './pages/admin/Customers'

function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Memuat...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to={profile?.role === 'owner' ? '/owner' : '/admin'} replace />
  }
  return children
}

export default function App() {
  const { user, profile, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-loonars-50">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-primary font-semibold">Loonars Dashboard</p>
        <p className="text-gray-400 text-sm mt-1">Memuat...</p>
      </div>
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to={profile?.role === 'owner' ? '/owner' : '/admin'} replace /> : <Login />
      } />

      {/* Owner Routes */}
      <Route path="/owner" element={
        <ProtectedRoute requiredRole="owner"><OwnerLayout /></ProtectedRoute>
      }>
        <Route index element={<OwnerDashboard />} />
        <Route path="orders" element={<OwnerOrders />} />
        <Route path="products" element={<OwnerProducts />} />
        <Route path="customers" element={<OwnerCustomers />} />
        <Route path="reports" element={<OwnerReports />} />
        <Route path="settings" element={<OwnerSettings />} />
        <Route path="users" element={<OwnerUsers />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="customers" element={<AdminCustomers />} />
      </Route>

      <Route path="/" element={
        user ? <Navigate to={profile?.role === 'owner' ? '/owner' : '/admin'} replace /> : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
