import { useState, useEffect } from 'react'
import { ShoppingCart, Package, Users, TrendingUp, AlertTriangle, Clock, CheckCircle, Truck } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '../../lib/supabase'
import { formatRupiah, formatDate, ORDER_STATUS, ORDER_CHANNELS } from '../../lib/utils'
import { subDays, format, startOfDay, endOfDay } from 'date-fns'
import { id } from 'date-fns/locale'
import StatCard from '../../components/StatCard'
import { useNavigate } from 'react-router-dom'

export default function OwnerDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ totalOrders: 0, revenue: 0, profit: 0, customers: 0 })
  const [pendingOrders, setPendingOrders] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [revenueChart, setRevenueChart] = useState([])
  const [channelData, setChannelData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadStats(), loadPendingOrders(), loadLowStock(), loadChartData()])
    setLoading(false)
  }

  async function loadStats() {
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
    
    const [{ count: totalOrders }, { data: revenueData }, { count: customers }] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', monthStart).neq('status', 'cancelled'),
      supabase.from('orders').select('total, profit').gte('created_at', monthStart).in('status', ['shipped', 'done']),
      supabase.from('customers').select('*', { count: 'exact', head: true })
    ])
    
    const revenue = (revenueData || []).reduce((a, o) => a + Number(o.total), 0)
    const profit = (revenueData || []).reduce((a, o) => a + Number(o.profit), 0)
    setStats({ totalOrders: totalOrders || 0, revenue, profit, customers: customers || 0 })
  }

  async function loadPendingOrders() {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, total, channel, status, created_at')
      .in('status', ['pending', 'processing', 'packing'])
      .order('created_at', { ascending: true })
      .limit(6)
    setPendingOrders(data || [])
  }

  async function loadLowStock() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .lt('stock', 20)
      .order('stock', { ascending: true })
      .limit(5)
    setLowStockProducts(data || [])
  }

  async function loadChartData() {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i)
      days.push({ date: d, label: format(d, 'EEE', { locale: id }) })
    }

    const from = startOfDay(days[0].date).toISOString()
    const to = endOfDay(days[6].date).toISOString()

    const { data: orders } = await supabase
      .from('orders')
      .select('total, channel, created_at')
      .gte('created_at', from)
      .lte('created_at', to)
      .in('status', ['shipped', 'done'])

    const chartData = days.map(({ date, label }) => {
      const dayOrders = (orders || []).filter(o => {
        const d = new Date(o.created_at)
        return d >= startOfDay(date) && d <= endOfDay(date)
      })
      return {
        label,
        revenue: dayOrders.reduce((s, o) => s + Number(o.total), 0)
      }
    })

    const channelTotals = {}
    ;(orders || []).forEach(o => {
      channelTotals[o.channel] = (channelTotals[o.channel] || 0) + Number(o.total)
    })
    const channelPie = Object.entries(channelTotals).map(([k, v]) => ({
      name: ORDER_CHANNELS[k]?.label || k, value: v
    }))

    setRevenueChart(chartData)
    setChannelData(channelPie)
  }

  const COLORS = ['#22c55e', '#f97316', '#3b82f6', '#6b7280']

  const statusInfo = {
    pending:    { icon: Clock,         color: 'text-blue-500',   label: 'Baru' },
    processing: { icon: ShoppingCart,  color: 'text-yellow-500', label: 'Diproses' },
    packing:    { icon: Package,       color: 'text-purple-500', label: 'Dikemas' },
    shipped:    { icon: Truck,         color: 'text-indigo-500', label: 'Dikirim' },
    done:       { icon: CheckCircle,   color: 'text-green-500',  label: 'Selesai' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Selamat datang! Berikut ringkasan bisnis bulan ini.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label="Order Bulan Ini" value={stats.totalOrders} sub="Tidak termasuk batal" color="blue" onClick={() => navigate('/owner/orders')} />
        <StatCard icon={TrendingUp} label="Omzet Bulan Ini" value={formatRupiah(stats.revenue, true)} sub="Order terkirim & selesai" color="green" onClick={() => navigate('/owner/reports')} />
        <StatCard icon={TrendingUp} label="Profit Bulan Ini" value={formatRupiah(stats.profit, true)} sub="Omzet - HPP" color="primary" onClick={() => navigate('/owner/reports')} />
        <StatCard icon={Users} label="Total Pelanggan" value={stats.customers} sub="Semua pelanggan" color="purple" onClick={() => navigate('/owner/customers')} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h2 className="font-semibold text-gray-800">Omzet 7 Hari Terakhir</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueChart}>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => formatRupiah(v, true)} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [formatRupiah(v), 'Omzet']} />
                <Line type="monotone" dataKey="revenue" stroke="#d4296c" strokeWidth={2.5} dot={{ fill: '#d4296c', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-800">Omzet per Channel</h2>
          </div>
          <div className="card-body flex flex-col items-center">
            {channelData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={channelData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => formatRupiah(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1 w-full">
                  {channelData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-600">{d.name}</span>
                      </div>
                      <span className="font-medium text-gray-800">{formatRupiah(d.value, true)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-10 text-center text-gray-400 text-sm">Belum ada data</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Orders */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Order Perlu Diproses</h2>
            <button onClick={() => navigate('/owner/orders')} className="text-primary text-xs hover:underline">Lihat semua →</button>
          </div>
          <div>
            {pendingOrders.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                <CheckCircle size={28} className="mx-auto mb-2 text-green-400" />
                Semua order sudah diproses!
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pendingOrders.map(o => {
                  const StatusIcon = statusInfo[o.status]?.icon || Clock
                  return (
                    <div key={o.id} className="px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate('/owner/orders')}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusIcon size={15} className={statusInfo[o.status]?.color} />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{o.order_number}</p>
                            <p className="text-xs text-gray-500">{o.customer_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{formatRupiah(o.total, true)}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ORDER_STATUS[o.status]?.bg} ${ORDER_STATUS[o.status]?.text}`}>
                            {ORDER_STATUS[o.status]?.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-800">Stok Menipis</h2>
              {lowStockProducts.length > 0 && (
                <span className="badge bg-red-100 text-red-600">{lowStockProducts.length}</span>
              )}
            </div>
            <button onClick={() => navigate('/owner/products')} className="text-primary text-xs hover:underline">Kelola stok →</button>
          </div>
          <div>
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                <CheckCircle size={28} className="mx-auto mb-2 text-green-400" />
                Semua stok aman!
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="px-5 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate('/owner/products')}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${p.stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                          {p.stock} pcs
                        </p>
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className={`h-full rounded-full ${p.stock === 0 ? 'bg-red-500' : 'bg-orange-400'}`}
                            style={{ width: `${Math.min(100, (p.stock / 100) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
