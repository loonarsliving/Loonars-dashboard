import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Filter, RefreshCw, Eye } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatRupiah, formatDate, ORDER_STATUS, ORDER_CHANNELS } from '../../lib/utils'
import OrderDetailModal from './OrderDetailModal'
import AddOrderModal from '../../components/AddOrderModal'

const STATUS_OPTS = [
  { value: '', label: 'Semua Status' },
  { value: 'pending', label: 'Baru' },
  { value: 'processing', label: 'Diproses' },
  { value: 'packing', label: 'Dikemas' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'done', label: 'Selesai' },
  { value: 'cancelled', label: 'Batal' },
]

const CHANNEL_OPTS = [
  { value: '', label: 'Semua Channel' },
  { value: 'tokopedia', label: 'Tokopedia' },
  { value: 'shopee', label: 'Shopee' },
  { value: 'offline', label: 'Offline' },
  { value: 'website', label: 'Website' },
]

export default function OwnerOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterChannel, setFilterChannel] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 20

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('orders')
      .select('id, order_number, customer_name, customer_phone, channel, status, total, created_at, tracking_number', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (filterStatus) q = q.eq('status', filterStatus)
    if (filterChannel) q = q.eq('channel', filterChannel)
    if (search) q = q.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%`)

    const { data, count } = await q
    setOrders(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [page, filterStatus, filterChannel, search])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // Realtime subscription
  useEffect(() => {
    const ch = supabase.channel('orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe()
    return () => ch.unsubscribe()
  }, [fetchOrders])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pesanan</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} pesanan ditemukan</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} /> Tambah Order
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Cari no. order atau nama..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
          </div>
          <select className="input w-auto" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0) }}>
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className="input w-auto" value={filterChannel} onChange={e => { setFilterChannel(e.target.value); setPage(0) }}>
            {CHANNEL_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={fetchOrders} className="btn-secondary" title="Refresh">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>No. Order</th>
              <th>Pelanggan</th>
              <th>Channel</th>
              <th>Status</th>
              <th>Total</th>
              <th>Waktu</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Memuat...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Tidak ada pesanan</td></tr>
            ) : orders.map(o => {
              const st = ORDER_STATUS[o.status]
              const ch = ORDER_CHANNELS[o.channel]
              return (
                <tr key={o.id}>
                  <td className="font-mono text-xs font-semibold text-gray-800">{o.order_number}</td>
                  <td>
                    <div className="font-medium text-gray-900 text-sm">{o.customer_name}</div>
                    {o.customer_phone && <div className="text-xs text-gray-400">{o.customer_phone}</div>}
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${ch?.color || 'bg-gray-400'}`}>
                      {ch?.label || o.channel}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${st?.bg} ${st?.text}`}>{st?.label || o.status}</span>
                  </td>
                  <td className="font-semibold text-sm">{formatRupiah(o.total, true)}</td>
                  <td className="text-xs text-gray-500">{formatDate(o.created_at, 'dd/MM HH:mm')}</td>
                  <td>
                    <button onClick={() => setSelectedOrder(o)} className="btn-ghost btn-sm">
                      <Eye size={14} /> Detail
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} dari {total}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="btn-secondary btn-sm">← Prev</button>
            <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="btn-secondary btn-sm">Next →</button>
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal orderId={selectedOrder.id} onClose={() => { setSelectedOrder(null); fetchOrders() }} />
      )}
      {showAdd && (
        <AddOrderModal onClose={() => { setShowAdd(false); fetchOrders() }} />
      )}
    </div>
  )
}
