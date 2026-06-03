import { useEffect, useState, useCallback } from 'react'
import { Search, RefreshCw, Printer, Truck, Package, CheckCircle, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatRupiah, formatDate, ORDER_STATUS, ORDER_CHANNELS } from '../../lib/utils'
import { useAuth } from '../../contexts/AuthContext'
import PrintReceipt, { triggerPrint } from '../../components/PrintReceipt'
import { createNotification } from '../../lib/supabase'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'action',   label: '⚡ Perlu Aksi', statuses: ['pending', 'processing', 'packing'] },
  { key: 'shipped',  label: '🚚 Dikirim',    statuses: ['shipped'] },
  { key: 'done',     label: '✅ Selesai',    statuses: ['done'] },
  { key: 'all',      label: '📋 Semua',      statuses: null },
]

const NEXT_STATUS = { pending: 'processing', processing: 'packing', packing: 'shipped', shipped: 'done' }
const NEXT_LABEL  = { pending: 'Mulai Proses', processing: 'Mulai Kemas', packing: 'Tandai Dikirim', shipped: 'Tandai Selesai' }

export default function AdminOrders() {
  const { profile } = useAuth()
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('action')
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [items, setItems]       = useState([])
  const [tracking, setTracking] = useState('')
  const [courier, setCourier]   = useState('')
  const [updating, setUpdating] = useState(false)
  const [printData, setPrintData] = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const tab = TABS.find(t => t.key === activeTab)
    let q = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: activeTab === 'action' })
    if (tab?.statuses) q = q.in('status', tab.statuses)
    if (search) q = q.or(`customer_name.ilike.%${search}%,order_number.ilike.%${search}%`)
    const { data } = await q.limit(80)
    setOrders(data || [])
    setLoading(false)
  }, [activeTab, search])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  useEffect(() => {
    const ch = supabase.channel('admin-orders-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe()
    return () => ch.unsubscribe()
  }, [fetchOrders])

  async function selectOrder(order) {
    setSelected(order)
    setTracking(order.tracking_number || '')
    setCourier(order.courier || '')
    const { data } = await supabase.from('order_items').select('*').eq('order_id', order.id)
    setItems(data || [])
  }

  async function updateStatus(newStatus) {
    if (!selected) return
    if (newStatus === 'shipped' && !tracking) {
      return toast.error('Isi nomor resi terlebih dahulu!')
    }
    setUpdating(true)
    try {
      const updates = {
        status: newStatus,
        processed_by: profile?.id,
        ...(newStatus === 'shipped' ? { tracking_number: tracking, courier, courier_service: '' } : {})
      }
      const { error } = await supabase.from('orders').update(updates).eq('id', selected.id)
      if (error) throw error
      await createNotification(
        `Order ${selected.order_number} diupdate`,
        `Status: ${ORDER_STATUS[newStatus]?.label} oleh ${profile?.full_name}`,
        'info', selected.id, 'order'
      )
      toast.success(`Status diupdate → ${ORDER_STATUS[newStatus]?.label} ✅`)
      setSelected(null)
      fetchOrders()
    } catch (err) {
      toast.error('Gagal update: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  async function handlePrint() {
    if (!selected) return
    setPrintData({ order: selected, items })
    setTimeout(() => triggerPrint(), 200)
  }

  const st = selected ? ORDER_STATUS[selected.status] : null
  const ch = selected ? ORDER_CHANNELS[selected.channel] : null

  return (
    <div className="space-y-4">
      {printData && <PrintReceipt order={printData.order} items={printData.items} />}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Pesanan</h1>
        <button onClick={fetchOrders} className="btn-secondary btn-sm"><RefreshCw size={14} /> Refresh</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab === t.key ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Cari nama atau no. order..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* List */}
        <div className="card overflow-hidden" style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <CheckCircle size={36} className="mx-auto mb-2 text-green-300" />
              <p className="text-sm font-medium">Tidak ada order di sini</p>
              <p className="text-xs mt-1">Selamat! Semua sudah diproses 🎉</p>
            </div>
          ) : orders.map(o => {
            const oSt = ORDER_STATUS[o.status]
            const oCh = ORDER_CHANNELS[o.channel]
            const isSelected = selected?.id === o.id
            return (
              <div key={o.id} onClick={() => selectOrder(o)}
                className={`p-4 border-b last:border-0 cursor-pointer transition-colors
                  ${isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-gray-50'}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-gray-500">{o.order_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${oCh?.color || 'bg-gray-400'}`}>
                      {oCh?.label || o.channel}
                    </span>
                  </div>
                  <span className={`badge ${oSt?.bg} ${oSt?.text} flex-shrink-0`}>{oSt?.label}</span>
                </div>
                <div className="font-semibold text-gray-800 text-sm">{o.customer_name}</div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-400">{formatDate(o.created_at, 'dd/MM HH:mm')}</span>
                  <span className="font-bold text-primary text-sm">{formatRupiah(o.total, true)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detail panel */}
        <div>
          {!selected ? (
            <div className="card h-48 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">👈</div>
                <p className="text-sm">Pilih order untuk melihat detail</p>
              </div>
            </div>
          ) : (
            <div className="card">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold text-lg text-gray-900">{selected.order_number}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge ${st?.bg} ${st?.text}`}>{st?.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full text-white ${ch?.color || 'bg-gray-400'}`}>{ch?.label}</span>
                  </div>
                </div>
                <p className="font-bold text-primary text-lg">{formatRupiah(selected.total, true)}</p>
              </div>

              {/* Customer */}
              <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
                <p className="font-semibold text-gray-800">{selected.customer_name}</p>
                {selected.customer_phone && <p className="text-gray-500 text-xs mt-0.5">{selected.customer_phone}</p>}
                {selected.shipping_address && (
                  <p className="text-gray-500 text-xs mt-0.5">
                    {selected.shipping_address}
                    {selected.shipping_city ? `, ${selected.shipping_city}` : ''}
                    {selected.shipping_province ? `, ${selected.shipping_province}` : ''}
                  </p>
                )}
              </div>

              {/* Items */}
              <div className="border border-gray-100 rounded-xl overflow-hidden mb-4">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between px-3 py-2.5 border-b border-gray-50 last:border-0 text-sm">
                    <span className="text-gray-700">{item.product_name} <span className="text-gray-400">×{item.quantity}</span></span>
                    <span className="font-medium text-gray-900">{formatRupiah(item.subtotal, true)}</span>
                  </div>
                ))}
                <div className="flex justify-between px-3 py-2.5 bg-gray-50 font-bold text-sm">
                  <span>Total</span><span className="text-primary">{formatRupiah(selected.total)}</span>
                </div>
              </div>

              {/* Resi input - tampil saat packing */}
              {selected.status === 'packing' && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div>
                    <label className="label text-xs">Kurir</label>
                    <input className="input text-sm" placeholder="JNE, J&T, SiCepat..." value={courier}
                      onChange={e => setCourier(e.target.value)} />
                  </div>
                  <div>
                    <label className="label text-xs">No. Resi *</label>
                    <input className="input text-sm" placeholder="Nomor resi" value={tracking}
                      onChange={e => setTracking(e.target.value)} />
                  </div>
                </div>
              )}

              {/* Show existing tracking */}
              {selected.tracking_number && selected.status !== 'packing' && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center gap-2 mb-4">
                  <Truck size={16} className="text-indigo-500 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-indigo-600 text-xs font-medium">{selected.courier}</p>
                    <p className="font-bold text-indigo-800 font-mono">{selected.tracking_number}</p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {NEXT_STATUS[selected.status] && (
                  <button onClick={() => updateStatus(NEXT_STATUS[selected.status])}
                    disabled={updating}
                    className="btn-primary flex-1 justify-center">
                    {updating
                      ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      : <ArrowRight size={15} />
                    }
                    {NEXT_LABEL[selected.status]}
                  </button>
                )}
                <button onClick={handlePrint} className="btn-secondary">
                  <Printer size={15} /> Resi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
