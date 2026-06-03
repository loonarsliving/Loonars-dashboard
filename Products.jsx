import { useEffect, useState } from 'react'
import { Search, ArrowUp, ArrowDown, AlertTriangle, Package, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatRupiah, getStockStatus } from '../../lib/utils'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function AdminProducts() {
  const { profile } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')
  const [modal, setModal]       = useState(null)
  const [qty, setQty]           = useState('')
  const [note, setNote]         = useState('')
  const [type, setType]         = useState('in')
  const [saving, setSaving]     = useState(false)

  async function fetchProducts() {
    setLoading(true)
    let q = supabase.from('products').select('*').eq('is_active', true).order('name')
    if (search) q = q.ilike('name', `%${search}%`)
    const { data } = await q
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [search])

  const filtered = products.filter(p => {
    const { alert } = getStockStatus(p)
    if (filter === 'low') return alert
    if (filter === 'ok') return !alert
    return true
  })

  const lowCount = products.filter(p => getStockStatus(p).alert).length

  async function doUpdateStock() {
    if (!qty || isNaN(Number(qty)) || Number(qty) <= 0) return toast.error('Masukkan jumlah yang valid')
    setSaving(true)
    const p = modal
    const amount = Number(qty)
    const newStock = type === 'in' ? p.stock + amount : Math.max(0, p.stock - amount)

    try {
      await supabase.from('products').update({ stock: newStock }).eq('id', p.id)
      await supabase.from('stock_movements').insert({
        product_id: p.id,
        type,
        quantity: amount,
        stock_before: p.stock,
        stock_after: newStock,
        reference_type: 'manual',
        notes: note || (type === 'in' ? 'Tambah stok manual' : 'Kurangi stok manual'),
        created_by: profile?.id,
      })
      toast.success(`Stok ${p.name} diperbarui → ${newStock} pcs`)
      setModal(null); setQty(''); setNote('')
      fetchProducts()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  function openModal(p, t) {
    setModal(p); setType(t); setQty(''); setNote('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Stok Produk</h1>
        <div className="flex items-center gap-2">
          {lowCount > 0 && (
            <span className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 px-3 py-1.5 rounded-lg text-sm font-medium">
              <AlertTriangle size={14} /> {lowCount} menipis
            </span>
          )}
          <button onClick={fetchProducts} className="btn-secondary btn-sm"><RefreshCw size={14} /></button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[['all', 'Semua'], ['low', '⚠️ Menipis'], ['ok', '✅ Aman']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${filter === k ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Product list */}
      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-gray-100" />)
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <Package size={36} className="mx-auto mb-2 opacity-30" />
            <p>Tidak ada produk ditemukan</p>
          </div>
        ) : filtered.map(p => {
          const { pct, label: stockLabel, color, alert } = getStockStatus(p)
          const barColor = { red: 'bg-red-500', orange: 'bg-orange-400', yellow: 'bg-yellow-400', green: 'bg-green-500' }[color] || 'bg-gray-300'
          const textColor = { red: 'text-red-600', orange: 'text-orange-500', yellow: 'text-yellow-600', green: 'text-green-600' }[color] || 'text-gray-500'
          const borderColor = { red: 'bg-red-500', orange: 'bg-orange-400', yellow: 'bg-yellow-400', green: 'bg-green-400' }[color] || 'bg-gray-300'

          return (
            <div key={p.id} className="card flex items-center gap-4">
              {/* Color indicator */}
              <div className={`w-1.5 h-14 rounded-full flex-shrink-0 ${borderColor}`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800 truncate">{p.name}</h3>
                  {alert && <AlertTriangle size={14} className="text-orange-400 flex-shrink-0" />}
                </div>
                <div className="text-xs text-gray-400 font-mono">{p.sku}{p.category ? ` • ${p.category}` : ''}</div>
                {/* Stock bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                  </div>
                  <span className={`text-xs font-bold ${textColor} w-16 text-right`}>{p.stock} pcs</span>
                  <span className={`text-xs ${textColor} w-14 text-right`}>{stockLabel}</span>
                </div>
              </div>

              {/* Price */}
              <div className="text-right flex-shrink-0 hidden sm:block">
                <div className="font-semibold text-primary text-sm">{formatRupiah(p.price, true)}</div>
                <div className="text-xs text-gray-400">harga jual</div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openModal(p, 'in')}
                  className="w-9 h-9 rounded-xl bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center transition-colors"
                  title="Tambah stok">
                  <ArrowUp size={16} />
                </button>
                <button onClick={() => openModal(p, 'out')}
                  className="w-9 h-9 rounded-xl bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center transition-colors"
                  title="Kurangi stok">
                  <ArrowDown size={16} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal update stok */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-1">
              {type === 'in' ? '➕ Tambah' : '➖ Kurangi'} Stok
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {modal.name}<br />
              <span className="font-semibold">Stok saat ini: {modal.stock} pcs</span>
            </p>
            <div className="space-y-3">
              <div>
                <label className="label">Jumlah</label>
                <input type="number" className="input text-lg font-bold" value={qty}
                  onChange={e => setQty(e.target.value)} placeholder="0" min="1" autoFocus />
              </div>
              <div>
                <label className="label">Keterangan (opsional)</label>
                <input className="input" value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Misal: restock dari supplier..." />
              </div>
              {qty > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 text-sm text-center">
                  Stok setelah update:{' '}
                  <span className="font-bold text-lg text-primary">
                    {type === 'in' ? modal.stock + Number(qty) : Math.max(0, modal.stock - Number(qty))} pcs
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Batal</button>
              <button onClick={doUpdateStock} disabled={saving}
                className={`flex-1 flex items-center justify-center gap-2 font-medium px-4 py-2 rounded-lg text-white transition-colors
                  ${type === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {saving ? '...' : type === 'in'
                  ? <><ArrowUp size={15} /> Tambah</>
                  : <><ArrowDown size={15} /> Kurangi</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
