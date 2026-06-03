import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, Package, Users, BarChart3,
  Settings, LogOut, Bell, UserCog, ChevronDown, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import NotificationBell from './NotificationBell'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/owner', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/owner/orders', icon: ShoppingCart, label: 'Pesanan' },
  { to: '/owner/products', icon: Package, label: 'Produk & Stok' },
  { to: '/owner/customers', icon: Users, label: 'Pelanggan' },
  { to: '/owner/reports', icon: BarChart3, label: 'Laporan' },
  { to: '/owner/users', icon: UserCog, label: 'Manajemen Tim' },
  { to: '/owner/settings', icon: Settings, label: 'Pengaturan' },
]

export default function OwnerLayout() {
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
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{ background: '#2D1020' }}>
        
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-lg tracking-wide">🌙 Loonars</p>
              <p className="text-pink-200 text-xs">Owner Dashboard</p>
            </div>
            <button className="lg:hidden text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-pink-100/70 hover:bg-white/10 hover:text-white'
                }`
              }>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Profile */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
              {profile?.full_name?.[0]?.toUpperCase() || 'O'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{profile?.full_name || 'Owner'}</p>
              <p className="text-pink-200 text-xs">Owner</p>
            </div>
          </div>
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-pink-100/70 hover:bg-white/10 hover:text-white text-sm transition-colors">
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between shadow-sm">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} className="text-gray-600" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                {profile?.full_name?.[0]?.toUpperCase() || 'O'}
              </div>
              <span className="hidden sm:inline font-medium">{profile?.full_name || 'Owner'}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
