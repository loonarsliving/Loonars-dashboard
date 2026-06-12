import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Package, RefreshCw, CheckCircle, Truck, XCircle, Clock, ChevronDown, Search, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const HARGA_SATUAN = 89000
const fR = n => 'Rp ' + parseInt(n || 0).toLocaleString('id-ID')
const fD = d => d ? new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const STATUS_CONFIG = {
  pending:   { label: 'Menunggu',  color: 'bg-amber-100 text-amber-800',  icon: Clock },
  confirmed: { label: 'Konfirmasi',color: 'bg-blue-100 text-blue-800',    icon: CheckCircle },
  packed:    { label: 'Dikemas',   color: 'bg-purple-100 text-purple-800', icon: Package },
  shipped:   { label: 'Dikirim',   color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  delivered: { label: 'Terima',    color: 'bg-green-100 text-green-800',   icon: CheckCircle },
  cancelled: { label: 'Batal',     color: 'bg-red-100 text-red-800',       icon: XCircle },
}

const STATUS_FLOW = ['pending', 'confirmed', 'packed', 'shipped', 'delivered']

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

function OrderRow({ order, onRefresh }) {
  const [open, setOpen] = useState(false)
  const [awb, setAwb] = useState(order.awb || '')
  const [updating, setUpdating] = useState(false)

  async function updateStatus(status) {
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('beauty_orders')
        .update({ status, processed_by: (await supabase.auth.getUser()).data.user?.email })
        .eq('id', order.id)
      if (error) throw error
      toast.success(`Status diperbarui: ${STATUS_CONFIG[status]?.label}`)
      onRefresh()
    } catch (e) { toast.error(e.message) }
    finally { setUpdating(false) }
  }

  async function saveAWB() {
    if (!awb.trim()) return toast.error('Isi nomor resi dulu')
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('beauty_orders')
        .update({ awb: awb.trim(), status: 'shipped' })
        .eq('id', order.id)
      if (error) throw error
      toast.success('Resi & status tersimpan!')
      onRefresh()
    } catch (e) { toast.error(e.message) }
    finally { setUpdating(false) }
  }

  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Row header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-gray-900">{order.order_no}</span>
            <StatusBadge status={order.status} />
            {order.awb && (
              <span className="text-xs text-gray-400 font-mono">{order.awb}</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">
            {order.nama} · {order.hp} · {order.kota}, {order.provinsi}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-bold text-sm text-rose-700">{fR(order.total_bayar)}</div>
          <div className="text-xs text-gray-400">{order.kurir} {order.layanan} · ×{order.qty}</div>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">Penerima</p>
              <p className="text-sm font-semibold">{order.nama}</p>
              <p className="text-sm text-gray-600">{order.hp}</p>
              <p className="text-sm text-gray-600 mt-1">{order.alamat}</p>
              {order.kecamatan && <p className="text-sm text-gray-500">{order.kecamatan}</p>}
              <p className="text-sm text-gray-500">{order.kota}, {order.provinsi} {order.kode_pos}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">Rincian Pembayaran</p>
              <div className="space-y-1">
                {[
                  ['Produk', `HydraGlow ×${order.qty}`, fR(order.total_produk)],
                  ['Ongkir', `${order.kurir} ${order.layanan}`, fR(order.ongkir)],
                  ['Biaya COD', '', fR(order.cod_fee)],
                ].map(([l, s, v]) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span className="text-gray-500">{l} {s && <span className="text-gray-400 text-xs">({s})</span>}</span>
                    <span>{v}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold text-rose-700 pt-1 border-t border-gray-200">
                  <span>Total COD</span>
                  <span>{fR(order.total_bayar)}</span>
                </div>
              </div>
            </div>
          </div>

          {order.catatan && (
            <div className="mb-3 p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
              <p className="text-xs text-amber-700">📝 Catatan: {order.catatan}</p>
            </div>
          )}

          <p className="text-xs text-gray-400 mb-3">Dipesan: {fD(order.created_at)}</p>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {/* Maju status */}
            {nextStatus && (
              <button
                onClick={() => updateStatus(nextStatus)}
                disabled={updating}
                className="px-3 py-1.5 bg-rose-700 text-white text-xs font-semibold rounded-lg hover:bg-rose-800 transition disabled:opacity-50"
              >
                {updating ? '⏳' : '→'} {STATUS_CONFIG[nextStatus]?.label}
              </button>
            )}

            {/* Input AWB */}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <div className="flex items-center gap-1.5">
                <input
                  value={awb}
                  onChange={e => setAwb(e.target.value)}
                  placeholder="No. Resi KiriminAja"
                  className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg w-44 focus:outline-none focus:border-rose-400"
                />
                <button
                  onClick={saveAWB}
                  disabled={updating}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  Simpan Resi
                </button>
              </div>
            )}

            {/* Batal */}
            {['pending', 'confirmed'].includes(order.status) && (
              <button
                onClick={() => { if (confirm('Batalkan pesanan ini?')) updateStatus('cancelled') }}
                disabled={updating}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-red-50 hover:text-red-700 transition disabled:opacity-50"
              >
                Batalkan
              </button>
            )}

            {/* Track AWB */}
            {order.awb && (
              <a
                href={`https://app.kiriminaja.com/tracking?awb=${order.awb}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 transition"
              >
                <ExternalLink size={11} />
                Lacak
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function BeautyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [stats, setStats] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('beauty_orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setOrders(data || [])

      // Hitung stats
      const s = {}
      ;(data || []).forEach(o => { s[o.status] = (s[o.status] || 0) + 1 })
      const totalRevenue = (data || [])
        .filter(o => !['cancelled'].includes(o.status))
        .reduce((sum, o) => sum + (o.total_bayar || 0), 0)
      setStats({ ...s, totalRevenue })
    } catch (e) { toast.error('Gagal memuat: ' + e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Realtime subscription
  useEffect(() => {
    const ch = supabase.channel('beauty-orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'beauty_orders' }, () => load())
      .subscribe()
    return () => ch.unsubscribe()
  }, [load])

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === 'all' || o.status === filterStatus
    const q = search.toLowerCase()
    const matchSearch = !q ||
      o.order_no?.toLowerCase().includes(q) ||
      o.nama?.toLowerCase().includes(q) ||
      o.hp?.includes(q) ||
      o.kota?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Beauty Orders</h1>
          <p className="text-sm text-gray-500">Pesanan COD dari haluoleo.id/beauty</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Menunggu', val: stats.pending || 0, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Dikirim', val: (stats.shipped || 0) + (stats.packed || 0) + (stats.confirmed || 0), color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Selesai', val: stats.delivered || 0, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Total Nilai', val: fR(stats.totalRevenue || 0), color: 'text-rose-700', bg: 'bg-rose-50', big: true },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`font-bold mt-0.5 ${s.big ? 'text-sm' : 'text-2xl'} ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, HP, order no..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-rose-400"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', ...STATUS_FLOW, 'cancelled'].map(s => (
            <button key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${filterStatus === s ? 'bg-rose-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s === 'all' ? 'Semua' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* KiriminAja hint */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 flex items-start gap-2">
        <span className="text-base flex-shrink-0">💡</span>
        <div>
          <strong>Untuk buat resi otomatis:</strong> isi API Key KiriminAja di file <code className="bg-blue-100 px-1 rounded">beauty.html</code> baris <code className="bg-blue-100 px-1 rounded">const KA_KEY = ""</code>.
          Sebelum itu, kamu bisa input nomor resi manual di setiap order di bawah.
          Setelah input resi → klik "Simpan Resi" → status otomatis jadi Dikirim.
        </div>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-700 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Package size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            {orders.length === 0 ? 'Belum ada pesanan masuk' : 'Tidak ada yang cocok dengan filter'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {orders.length === 0 && 'Pesanan dari haluoleo.id/beauty akan muncul di sini secara real-time'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => (
            <OrderRow key={o.id} order={o} onRefresh={load} />
          ))}
          <p className="text-center text-xs text-gray-400 pt-1">
            Menampilkan {filtered.length} dari {orders.length} pesanan
          </p>
        </div>
      )}
    </div>
  )
}
