import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts'
import { Download, Send, RefreshCw, TrendingUp, Package, ShoppingCart, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatRupiah, getDateRange, formatDate } from '../../lib/utils'
import { sendTelegram, msgDailyReport } from '../../lib/telegram'
import { format, eachDayOfInterval } from 'date-fns'
import { id } from 'date-fns/locale'
import toast from 'react-hot-toast'

const COLORS = ['#d4296c', '#22c55e', '#f97316', '#3b82f6', '#8b5cf6']

export default function OwnerReports() {
  const [range, setRange] = useState('month')
  const [summary, setSummary] = useState({ revenue: 0, profit: 0, orders: 0, customers: 0, avgOrder: 0 })
  const [revenueData, setRevenueData] = useState([])
  const [channelData, setChannelData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => { loadData() }, [range])

  async function loadData() {
    setLoading(true)
    const { from, to } = getDateRange(range)
    const fromStr = from.toISOString()
    const toStr = to.toISOString()

    const [{ data: orders }, { data: items }] = await Promise.all([
      supabase.from('orders').select('*').gte('created_at', fromStr).lte('created_at', toStr).neq('status', 'cancelled'),
      supabase.from('order_items').select('product_name, quantity, subtotal').in('order_id',
        (await supabase.from('orders').select('id').gte('created_at', fromStr).lte('created_at', toStr).in('status', ['shipped', 'done'])).data?.map(o => o.id) || []
      )
    ])

    const doneOrders = (orders || []).filter(o => ['shipped', 'done'].includes(o.status))
    const revenue = doneOrders.reduce((s, o) => s + Number(o.total), 0)
    const profit = doneOrders.reduce((s, o) => s + Number(o.profit), 0)
    const avgOrder = doneOrders.length > 0 ? revenue / doneOrders.length : 0

    const uniqueCustomers = new Set((orders || []).map(o => o.customer_id).filter(Boolean)).size

    setSummary({ revenue, profit, orders: (orders || []).length, customers: uniqueCustomers, avgOrder })

    // Revenue by day
    const days = eachDayOfInterval({ start: from, end: to })
    const revByDay = days.map(d => {
      const dayStr = format(d, 'yyyy-MM-dd')
      const dayOrders = doneOrders.filter(o => o.created_at.startsWith(dayStr))
      return {
        label: format(d, days.length <= 7 ? 'EEE dd' : 'dd/MM', { locale: id }),
        revenue: dayOrders.reduce((s, o) => s + Number(o.total), 0),
        profit: dayOrders.reduce((s, o) => s + Number(o.profit), 0),
      }
    })
    setRevenueData(revByDay)

    // Channel breakdown
    const channelMap = {}
    doneOrders.forEach(o => {
      channelMap[o.channel] = (channelMap[o.channel] || 0) + Number(o.total)
    })
    setChannelData(Object.entries(channelMap).map(([k, v]) => ({
      name: { tokopedia: 'Tokopedia', shopee: 'Shopee', website: 'Website', offline: 'Offline' }[k] || k,
      value: v
    })))

    // Top products
    const prodMap = {}
    ;(items || []).forEach(i => {
      if (!prodMap[i.product_name]) prodMap[i.product_name] = { qty: 0, revenue: 0 }
      prodMap[i.product_name].qty += i.quantity
      prodMap[i.product_name].revenue += Number(i.subtotal)
    })
    const topProd = Object.entries(prodMap)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
    setTopProducts(topProd)

    setLoading(false)
  }

  async function sendToTelegram() {
    setSending(true)
    try {
      await sendTelegram(msgDailyReport({
        totalOrders: summary.orders,
        doneOrders: summary.orders,
        shippedOrders: 0,
        pendingOrders: 0,
        revenue: summary.revenue,
        profit: summary.profit,
        topProduct: topProducts[0]?.name || '-',
        lowStockCount: 0
      }))
      toast.success('Laporan terkirim ke Telegram!')
    } catch {
      toast.error('Gagal kirim ke Telegram')
    } finally {
      setSending(false)
    }
  }

  function exportCSV() {
    const rows = [
      ['Tanggal', 'Omzet', 'Profit'],
      ...revenueData.map(d => [d.label, d.revenue, d.profit])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `loonars-report-${range}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const RANGE_OPTS = [
    { v: 'today', l: 'Hari Ini' }, { v: 'week', l: 'Minggu Ini' },
    { v: 'month', l: 'Bulan Ini' }, { v: '30days', l: '30 Hari' }, { v: '7days', l: '7 Hari' }
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
          <p className="text-gray-500 text-sm mt-0.5">Analitik penjualan dan performa bisnis</p>
        </div>
        <div className="flex gap-2">
          <button onClick={sendToTelegram} disabled={sending} className="btn-secondary">
            <Send size={15} /> {sending ? 'Mengirim...' : 'Kirim ke Telegram'}
          </button>
          <button onClick={exportCSV} className="btn-secondary">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Range filter */}
      <div className="flex gap-2 flex-wrap">
        {RANGE_OPTS.map(({ v, l }) => (
          <button key={v} onClick={() => setRange(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${range === v ? 'bg-primary text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
        <button onClick={loadData} className="btn-ghost btn-sm ml-auto"><RefreshCw size={14} /></button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Order', value: summary.orders, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
          { label: 'Omzet', value: formatRupiah(summary.revenue, true), icon: TrendingUp, color: 'bg-green-50 text-green-600' },
          { label: 'Profit', value: formatRupiah(summary.profit, true), icon: TrendingUp, color: 'bg-primary/10 text-primary' },
          { label: 'Avg. Order', value: formatRupiah(summary.avgOrder, true), icon: Package, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Pelanggan Unik', value: summary.customers, icon: Users, color: 'bg-purple-50 text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-lg font-bold text-gray-900 leading-tight">{loading ? '...' : value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-gray-800">Omzet & Profit</h2>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => formatRupiah(v, true)} tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => formatRupiah(v)} />
              <Bar dataKey="revenue" name="Omzet" fill="#d4296c" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Channel pie */}
        <div className="card">
          <div className="card-header"><h2 className="font-semibold text-gray-800">Per Channel</h2></div>
          <div className="card-body flex flex-col items-center">
            {channelData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={channelData} cx="50%" cy="50%" outerRadius={70} paddingAngle={3} dataKey="value">
                      {channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => formatRupiah(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full space-y-2 mt-2">
                  {channelData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-600">{d.name}</span>
                      </div>
                      <span className="font-semibold">{formatRupiah(d.value, true)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-10 text-gray-400 text-sm">Belum ada data</div>
            )}
          </div>
        </div>

        {/* Top products */}
        <div className="card">
          <div className="card-header"><h2 className="font-semibold text-gray-800">Produk Terlaris</h2></div>
          <div className="card-body">
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">Belum ada data</div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.round((p.revenue / (topProducts[0]?.revenue || 1)) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatRupiah(p.revenue, true)}</p>
                      <p className="text-xs text-gray-400">{p.qty} terjual</p>
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
