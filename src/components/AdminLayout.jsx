import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Package, Users, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import NotificationBell from './NotificationBell'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Pesanan' },
  { to: '/admin/products', icon: Package, label: 'Produk & Stok' },
  { to: '/admin/customers', icon: Users, label: 'Pelanggan' },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
    toast.success('Berhasil keluar')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-64 z-50 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary font-bold text-lg tracking-wide">🌙 Loonars</p>
              <p className="text-gray-400 text-xs">Tim Operasional</p>
            </div>
            <button className="lg:hidden p-1 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(false)}>
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`
              }>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {profile?.full_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-800 text-sm font-medium truncate">{profile?.full_name || 'Admin'}</p>
              <p className="text-gray-400 text-xs">Tim Admin</p>
            </div>
          </div>
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 text-sm transition-colors">
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between shadow-sm">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} className="text-gray-600" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                {profile?.full_name?.[0]?.toUpperCase() || 'A'}
              </div>
              <span className="hidden sm:inline font-medium">{profile?.full_name || 'Admin'}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
