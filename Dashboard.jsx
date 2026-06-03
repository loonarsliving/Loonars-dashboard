import { useState, useEffect } from 'react'
import { ShoppingCart, Package, AlertTriangle, Clock, CheckCircle, Truck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatRupiah, formatDate, ORDER_STATUS } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ pending: 0, processing: 0, packing: 0, lowStock: 0 })
  const [pendingOrders, setPendingOrders] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: orders }, { data: products }] = await Promise.all([
      supabase.from('orders').select('id, order_number, customer_name, total, channel, status, created_at').in('status', ['pending', 'processing', 'packing']).order('created_at', { ascending: true }).limit(10),
      supabase.from('products').select('*').eq('is_active', true).lt('stock', 20).limit(5)
    ])

    const pending = (orders || []).filter(o => o.status === 'pending').length
    const processing = (orders || []).filter(o => o.status === 'processing').length
    const packing = (orders || []).filter(o => o.status === 'packing').length
    setStats({ pending, processing, packing, lowStock: (products || []).length })
    setPendingOrders(orders || [])
    setLowStockProducts(products || [])
    setLoading(false)
  }

  // Realtime subscription
  useEffect(() => {
    const ch = supabase.channel('admin_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe()
    return () => ch.unsubscribe()
  }, [])

  const statCards = [
    { label: 'Order Baru', value: stats.pending, icon: Clock, color: 'bg-blue-50 text-blue-600', path: '/admin/orders' },
    { label: 'Sedang Diproses', value: stats.processing, icon: ShoppingCart, color: 'bg-yellow-50 text-yellow-600', path: '/admin/orders' },
    { label: 'Sedang Dikemas', value: stats.packing, icon: Package, color: 'bg-purple-50 text-purple-600', path: '/admin/orders' },
    { label: 'Stok Menipis', value: stats.lowStock, icon: AlertTriangle, color: 'bg-red-50 text-red-500', path: '/admin/products' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Tim</h1>
        <p className="text-gray-500 text-sm mt-1">Halo! Ini order yang perlu diproses hari ini.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, path }) => (
          <div key={label} onClick={() => navigate(path)}
            className="card p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending orders */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Order Menunggu Proses</h2>
            <button onClick={() => navigate('/admin/orders')} className="text-primary text-xs hover:underline">Lihat semua</button>
          </div>
          {pendingOrders.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              <CheckCircle size={28} className="mx-auto mb-2 text-green-400" />
              Semua order sudah diproses!
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingOrders.map(o => {
                const st = ORDER_STATUS[o.status]
                const chColors = { tokopedia: 'bg-green-100 text-green-700', shopee: 'bg-orange-100 text-orange-700', offline: 'bg-gray-100 text-gray-600', website: 'bg-blue-100 text-blue-700' }
                return (
                  <div key={o.id} className="px-5 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate('/admin/orders')}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-900">{o.order_number}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${chColors[o.channel] || 'bg-gray-100'}`}>
                            {o.channel}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{o.customer_name}</p>
                        <p className="text-xs text-gray-400">{formatDate(o.created_at, 'dd/MM HH:mm')}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-sm text-gray-900">{formatRupiah(o.total, true)}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${st?.bg} ${st?.text}`}>{st?.label}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Stok Menipis</h2>
            <button onClick={() => navigate('/admin/products')} className="text-primary text-xs hover:underline">Lihat semua</button>
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              <CheckCircle size={28} className="mx-auto mb-2 text-green-400" />
              Semua stok aman!
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {lowStockProducts.map(p => (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.sku}</p>
                  </div>
                  <span className={`text-sm font-bold ${p.stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                    {p.stock} pcs
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '📦 Proses Order', path: '/admin/orders', color: 'bg-primary text-white' },
          { label: '🔍 Cek Stok', path: '/admin/products', color: 'bg-white border border-gray-200 text-gray-700' },
          { label: '👥 Pelanggan', path: '/admin/customers', color: 'bg-white border border-gray-200 text-gray-700' },
          { label: '🔔 Notifikasi', path: '#', color: 'bg-white border border-gray-200 text-gray-700' },
        ].map(({ label, path, color }) => (
          <button key={label} onClick={() => path !== '#' && navigate(path)}
            className={`p-3 rounded-xl text-sm font-medium transition-all hover:shadow-md ${color}`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
