import { useEffect, useState } from 'react'
import { Search, MessageCircle, ShoppingBag, Save, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatRupiah, formatDate, CUSTOMER_SEGMENTS, ORDER_STATUS, ORDER_CHANNELS } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [selected, setSelected]   = useState(null)
  const [orders, setOrders]       = useState([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [noteText, setNoteText]   = useState('')
  const [saving, setSaving]       = useState(false)

  async function fetchCustomers() {
    setLoading(true)
    let q = supabase.from('customers').select('*')
      .order('last_order_at', { ascending: false, nullsFirst: false })
    if (search) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
    const { data } = await q.limit(100)
    setCustomers(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchCustomers() }, [search])

  async function selectCustomer(c) {
    setSelected(c)
    setNoteText(c.notes || '')
    const { data } = await supabase.from('orders').select('*')
      .eq('customer_id', c.id)
      .order('created_at', { ascending: false })
      .limit(8)
    setOrders(data || [])
  }

  async function saveNote() {
    if (!selected) return
    setSaving(true)
    try {
      await supabase.from('customers').update({ notes: noteText }).eq('id', selected.id)
      setSelected(s => ({ ...s, notes: noteText }))
      toast.success('Catatan disimpan ✅')
    } catch { toast.error('Gagal menyimpan') }
    setSaving(false)
  }

  const seg = selected ? CUSTOMER_SEGMENTS[selected.segment] : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Data Pelanggan</h1>
        <button onClick={fetchCustomers} className="btn-secondary btn-sm"><RefreshCw size={14} /></button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Cari nama atau nomor HP..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Customer list */}
        <div className="card overflow-hidden" style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : customers.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p className="text-sm">Tidak ada pelanggan ditemukan</p>
            </div>
          ) : customers.map(c => {
            const cSeg = CUSTOMER_SEGMENTS[c.segment]
            return (
              <div key={c.id} onClick={() => selectCustomer(c)}
                className={`p-4 border-b last:border-0 cursor-pointer transition-colors
                  ${selected?.id === c.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {c.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800 text-sm">{c.name}</span>
                      <span className={`badge ${cSeg?.color}`}>{cSeg?.label}</span>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-3 mt-0.5">
                      <span>{c.phone || 'Tanpa HP'}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><ShoppingBag size={10} /> {c.total_orders} order</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-primary">{formatRupiah(c.total_spent, true)}</div>
                    <div className="text-xs text-gray-400">
                      {c.last_order_at ? formatDate(c.last_order_at, 'dd/MM/yy') : '-'}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detail panel */}
        {!selected ? (
          <div className="card h-48 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">👈</div>
              <p className="text-sm">Pilih pelanggan di sebelah kiri</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Customer info */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary text-xl font-bold flex items-center justify-center">
                  {selected.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">{selected.name}</h2>
                  <span className={`badge ${seg?.color}`}>{seg?.label}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                {selected.phone && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-16 flex-shrink-0">HP:</span>
                    <span className="font-medium">{selected.phone}</span>
                  </div>
                )}
                {selected.email && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-16 flex-shrink-0">Email:</span>
                    <span className="truncate">{selected.email}</span>
                  </div>
                )}
                {selected.address && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-16 flex-shrink-0">Alamat:</span>
                    <span className="text-xs text-gray-600">{selected.address}{selected.city ? `, ${selected.city}` : ''}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-gray-400 w-16 flex-shrink-0">Total:</span>
                  <span className="font-semibold text-primary">{formatRupiah(selected.total_spent, true)}</span>
                  <span className="text-gray-400 text-xs">dari {selected.total_orders} order</span>
                </div>
              </div>

              {selected.phone && (
                <a href={`https://wa.me/62${selected.phone.replace(/^0/, '').replace(/[^0-9]/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="btn-secondary w-full justify-center text-sm">
                  <MessageCircle size={15} /> Hubungi via WhatsApp
                </a>
              )}
            </div>

            {/* Note */}
            <div className="card">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Catatan Internal</h3>
              <textarea className="input mb-2" rows={3}
                placeholder="Tambah catatan tentang pelanggan ini..."
                value={noteText} onChange={e => setNoteText(e.target.value)} />
              <button onClick={saveNote} disabled={saving} className="btn-primary text-sm py-1.5 w-full justify-center">
                <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan Catatan'}
              </button>
            </div>

            {/* Order history */}
            <div className="card">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Riwayat Order</h3>
              {orders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Belum ada order</p>
              ) : (
                <div className="space-y-2">
                  {orders.map(o => {
                    const oSt = ORDER_STATUS[o.status]
                    const oCh = ORDER_CHANNELS[o.channel]
                    return (
                      <div key={o.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                        <div>
                          <div className="font-mono text-xs text-gray-500">{o.order_number}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {formatDate(o.created_at, 'dd MMM')} · {oCh?.label || o.channel}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm text-gray-900">{formatRupiah(o.total, true)}</div>
                          <span className={`badge text-[10px] ${oSt?.bg} ${oSt?.text}`}>{oSt?.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
