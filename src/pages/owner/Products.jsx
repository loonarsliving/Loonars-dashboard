import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, BarChart2, RefreshCw, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatRupiah, getStockStatus } from '../../lib/utils'
import { sendTelegram, msgLowStock } from '../../lib/telegram'
import { createNotification } from '../../lib/supabase'
import toast from 'react-hot-toast'

function StockBar({ product }) {
  const { pct, label, color, alert } = getStockStatus(product)
  const colorMap = { red: 'bg-red-500', orange: 'bg-orange-400', yellow: 'bg-yellow-400', green: 'bg-green-500', gray: 'bg-gray-300' }
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${colorMap[color]}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-medium min-w-12 text-right ${alert ? (color === 'red' ? 'text-red-600' : 'text-orange-500') : 'text-gray-500'}`}>
        {product.stock} pcs
      </span>
    </div>
  )
}

function ProductModal({ product, onClose, onSaved }) {
  const isEdit = !!product?.id
  const [form, setForm] = useState({
    name: product?.name || '', sku: product?.sku || '', description: product?.description || '',
    price: product?.price || 0, cost_price: product?.cost_price || 0,
    stock: product?.stock || 0, min_stock: product?.min_stock || 0,
    low_stock_threshold: product?.low_stock_threshold || 30,
    category: product?.category || '', weight_gram: product?.weight_gram || 0,
    barcode: product?.barcode || '', is_active: product?.is_active ?? true
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.name || !form.sku) return toast.error('Nama dan SKU wajib diisi')
    setSaving(true)
    try {
      const { error } = isEdit
        ? await supabase.from('products').update(form).eq('id', product.id)
        : await supabase.from('products').insert(form)
      if (error) throw error
      toast.success(isEdit ? 'Produk diupdate' : 'Produk ditambahkan')
      onSaved()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const margin = form.price > 0 ? Math.round(((form.price - form.cost_price) / form.price) * 100) : 0

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{isEdit ? 'Edit Produk' : 'Tambah Produk'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">✕</button>
        </div>
        <div className="overflow-y-auto max-h-[70vh] p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Nama Produk *</label>
              <input className="input" value={form.name} onChange={e => f('name', e.target.value)} />
            </div>
            <div>
              <label className="label">SKU *</label>
              <input className="input" placeholder="LNR-XXX-001" value={form.sku} onChange={e => f('sku', e.target.value)} />
            </div>
            <div>
              <label className="label">Kategori</label>
              <input className="input" placeholder="Serum, Toner..." value={form.category} onChange={e => f('category', e.target.value)} />
            </div>
            <div>
              <label className="label">Harga Jual</label>
              <input type="number" className="input" value={form.price} onChange={e => f('price', e.target.value)} />
            </div>
            <div>
              <label className="label">HPP (Harga Pokok)</label>
              <input type="number" className="input" value={form.cost_price} onChange={e => f('cost_price', e.target.value)} />
            </div>
          </div>
          {form.price > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-sm">
              Margin: <strong className="text-green-700">{margin}%</strong> ({formatRupiah(Number(form.price) - Number(form.cost_price))})
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Stok Awal</label>
              <input type="number" className="input" value={form.stock} onChange={e => f('stock', e.target.value)} />
            </div>
            <div>
              <label className="label">Stok Min</label>
              <input type="number" className="input" value={form.min_stock} onChange={e => f('min_stock', e.target.value)} />
            </div>
            <div>
              <label className="label">Alert (%)</label>
              <input type="number" className="input" min={1} max={100} value={form.low_stock_threshold} onChange={e => f('low_stock_threshold', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Berat (gram)</label>
              <input type="number" className="input" value={form.weight_gram} onChange={e => f('weight_gram', e.target.value)} />
            </div>
            <div>
              <label className="label">Barcode</label>
              <input className="input" value={form.barcode} onChange={e => f('barcode', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Deskripsi</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => f('description', e.target.value)} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-primary" checked={form.is_active} onChange={e => f('is_active', e.target.checked)} />
            <span className="text-sm text-gray-700">Produk aktif</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">Batal</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StockUpdateModal({ product, onClose, onSaved }) {
  const [qty, setQty] = useState(0)
  const [type, setType] = useState('in')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!qty || qty <= 0) return toast.error('Jumlah harus lebih dari 0')
    setSaving(true)
    try {
      const change = type === 'in' ? Number(qty) : -Number(qty)
      const newStock = Math.max(0, product.stock + change)
      
      await supabase.from('products').update({ stock: newStock }).eq('id', product.id)
      await supabase.from('stock_movements').insert({
        product_id: product.id, type, quantity: Number(qty),
        stock_before: product.stock, stock_after: newStock, notes
      })

      // Check low stock
      const thresholdStock = Math.ceil((product.low_stock_threshold / 100) * 100)
      if (newStock <= thresholdStock && type === 'out') {
        await sendTelegram(msgLowStock({ ...product, stock: newStock }))
        await createNotification('Stok menipis!', `${product.name}: sisa ${newStock} pcs`, 'low_stock', product.id, 'product')
      }

      toast.success('Stok berhasil diperbarui')
      onSaved()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Update Stok</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="font-semibold text-gray-900">{product.name}</p>
            <p className="text-sm text-gray-500">Stok saat ini: <strong>{product.stock} pcs</strong></p>
          </div>
          <div>
            <label className="label">Jenis Update</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ v: 'in', l: '+ Stok Masuk' }, { v: 'out', l: '- Stok Keluar' }, { v: 'adjustment', l: '⚡ Koreksi' }, { v: 'return', l: '↩ Retur' }].map(({ v, l }) => (
                <button key={v} onClick={() => setType(v)}
                  className={`p-2.5 rounded-lg text-sm font-medium border transition-all ${type === v ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Jumlah</label>
            <input type="number" className="input" min={1} value={qty} onChange={e => setQty(e.target.value)} placeholder="0" />
          </div>
          {qty > 0 && (
            <div className="text-sm bg-blue-50 border border-blue-100 rounded-lg p-3">
              Stok baru: <strong>{Math.max(0, product.stock + (type === 'in' || type === 'return' ? Number(qty) : -Number(qty)))}</strong> pcs
            </div>
          )}
          <div>
            <label className="label">Catatan</label>
            <input className="input" placeholder="Opsional..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">Batal</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">Simpan</button>
        </div>
      </div>
    </div>
  )
}

export default function OwnerProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAlert, setFilterAlert] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [stockProduct, setStockProduct] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  async function load() {
    setLoading(true)
    let q = supabase.from('products').select('*').order('name')
    if (search) q = q.ilike('name', `%${search}%`)
    if (filterAlert) q = q.lt('stock', 20)
    const { data } = await q
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [search, filterAlert])

  const lowStockCount = products.filter(p => p.stock < 20).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produk & Stok</h1>
          <p className="text-gray-500 text-sm mt-0.5">{products.length} produk</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-700">
          <AlertTriangle size={20} />
          <span className="text-sm font-medium">{lowStockCount} produk memiliki stok menipis</span>
          <button onClick={() => setFilterAlert(true)} className="ml-auto text-xs underline">Tampilkan saja</button>
        </div>
      )}

      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setFilterAlert(!filterAlert)}
            className={`btn-sm ${filterAlert ? 'btn-primary' : 'btn-secondary'}`}>
            <AlertTriangle size={14} /> Stok Menipis
          </button>
          <button onClick={load} className="btn-secondary btn-sm"><RefreshCw size={14} /></button>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Produk</th>
              <th>Harga Jual</th>
              <th>HPP</th>
              <th>Margin</th>
              <th>Stok</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Memuat...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Tidak ada produk</td></tr>
            ) : products.map(p => {
              const margin = p.price > 0 ? Math.round(((p.price - p.cost_price) / p.price) * 100) : 0
              const { label: stockLabel, color, alert } = getStockStatus(p)
              const stockColorText = { red: 'text-red-600', orange: 'text-orange-500', yellow: 'text-yellow-600', green: 'text-green-600', gray: 'text-gray-500' }
              return (
                <tr key={p.id}>
                  <td>
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.sku}</div>
                  </td>
                  <td className="font-semibold">{formatRupiah(p.price, true)}</td>
                  <td className="text-gray-500 text-sm">{formatRupiah(p.cost_price, true)}</td>
                  <td className="font-medium text-green-600">{margin}%</td>
                  <td className="min-w-[140px]"><StockBar product={p} /></td>
                  <td>
                    <span className={`text-xs font-semibold ${stockColorText[color]}`}>{stockLabel}</span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => setStockProduct(p)} className="btn-ghost btn-sm" title="Update stok">
                        <BarChart2 size={14} />
                      </button>
                      <button onClick={() => setEditProduct(p)} className="btn-ghost btn-sm" title="Edit">
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {(showAdd || editProduct) && (
        <ProductModal product={editProduct} onClose={() => { setShowAdd(false); setEditProduct(null) }} onSaved={() => { setShowAdd(false); setEditProduct(null); load() }} />
      )}
      {stockProduct && (
        <StockUpdateModal product={stockProduct} onClose={() => setStockProduct(null)} onSaved={() => { setStockProduct(null); load() }} />
      )}
    </div>
  )
}
