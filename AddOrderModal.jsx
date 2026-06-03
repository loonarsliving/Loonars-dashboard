import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatRupiah } from '../lib/utils'
import { sendTelegram, msgNewOrder } from '../lib/telegram'
import { createNotification } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function AddOrderModal({ onClose }) {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({
    channel: 'offline',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    shipping_address: '',
    shipping_city: '',
    shipping_province: '',
    shipping_postal_code: '',
    courier: '',
    courier_service: '',
    shipping_cost: 0,
    discount: 0,
    notes: '',
    platform_order_id: ''
  })
  const [items, setItems] = useState([{ product_id: '', product_name: '', quantity: 1, unit_price: 0, cost_price: 0 }])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('products').select('id, name, sku, price, cost_price, stock').eq('is_active', true).then(({ data }) => setProducts(data || []))
  }, [])

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function addItem() {
    setItems(prev => [...prev, { product_id: '', product_name: '', quantity: 1, unit_price: 0, cost_price: 0 }])
  }

  function removeItem(i) {
    setItems(prev => prev.filter((_, idx) => idx !== i))
  }

  function setItem(i, k, v) {
    setItems(prev => {
      const next = [...prev]
      next[i] = { ...next[i], [k]: v }
      if (k === 'product_id') {
        const p = products.find(p => p.id === v)
        if (p) {
          next[i].product_name = p.name
          next[i].unit_price = p.price
          next[i].cost_price = p.cost_price
        }
      }
      return next
    })
  }

  const subtotal = items.reduce((s, i) => s + (Number(i.unit_price) * Number(i.quantity)), 0)
  const profit = items.reduce((s, i) => s + ((Number(i.unit_price) - Number(i.cost_price)) * Number(i.quantity)), 0)
  const total = subtotal - Number(form.discount) + Number(form.shipping_cost)

  async function handleSave() {
    if (!form.customer_name) return toast.error('Nama pelanggan wajib diisi')
    if (items.some(i => !i.product_id || !i.quantity)) return toast.error('Lengkapi semua item produk')
    setSaving(true)
    try {
      // Upsert customer
      let customerId = null
      if (form.customer_phone || form.customer_name) {
        let cq = supabase.from('customers').select('id').eq('name', form.customer_name)
        if (form.customer_phone) cq = cq.eq('phone', form.customer_phone)
        const { data: existing } = await cq.maybeSingle()
        if (existing) {
          customerId = existing.id
        } else {
          const { data: newC } = await supabase.from('customers').insert({
            name: form.customer_name,
            phone: form.customer_phone,
            email: form.customer_email,
            address: form.shipping_address,
            city: form.shipping_city,
            province: form.shipping_province,
            postal_code: form.shipping_postal_code,
          }).select('id').single()
          customerId = newC?.id
        }
      }

      // Insert order
      const { data: newOrder, error } = await supabase.from('orders').insert({
        ...form,
        customer_id: customerId,
        subtotal, total, profit,
        shipping_cost: Number(form.shipping_cost),
        discount: Number(form.discount),
        status: 'pending'
      }).select().single()

      if (error) throw error

      // Insert items
      await supabase.from('order_items').insert(
        items.map(i => ({
          order_id: newOrder.id,
          product_id: i.product_id || null,
          product_name: i.product_name,
          product_sku: products.find(p => p.id === i.product_id)?.sku || '',
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          cost_price: Number(i.cost_price),
          subtotal: Number(i.unit_price) * Number(i.quantity)
        }))
      )

      // Notif
      await Promise.all([
        sendTelegram(msgNewOrder(newOrder, items.map(i => ({ product_name: i.product_name, quantity: i.quantity })))),
        createNotification('Order baru masuk!', `${newOrder.order_number} - ${form.customer_name}`, 'new_order', newOrder.id, 'order')
      ])

      toast.success('Order berhasil ditambahkan!')
      onClose()
    } catch (e) {
      toast.error('Gagal menyimpan order: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal w-full max-w-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">Tambah Order Baru</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto max-h-[70vh] p-5 space-y-5">
          {/* Channel & Platform */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Channel</label>
              <select className="input" value={form.channel} onChange={e => setField('channel', e.target.value)}>
                <option value="offline">Offline</option>
                <option value="tokopedia">Tokopedia</option>
                <option value="shopee">Shopee</option>
                <option value="website">Website</option>
              </select>
            </div>
            {form.channel !== 'offline' && (
              <div>
                <label className="label">No. Order Platform</label>
                <input className="input" placeholder="No. order dari platform" value={form.platform_order_id} onChange={e => setField('platform_order_id', e.target.value)} />
              </div>
            )}
          </div>

          {/* Customer */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Data Pelanggan</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nama *</label>
                <input className="input" placeholder="Nama lengkap" value={form.customer_name} onChange={e => setField('customer_name', e.target.value)} />
              </div>
              <div>
                <label className="label">No. HP</label>
                <input className="input" placeholder="08xxxxxxxxxx" value={form.customer_phone} onChange={e => setField('customer_phone', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="label">Alamat</label>
                <input className="input" placeholder="Jalan, nomor, RT/RW..." value={form.shipping_address} onChange={e => setField('shipping_address', e.target.value)} />
              </div>
              <div>
                <label className="label">Kota</label>
                <input className="input" placeholder="Kota" value={form.shipping_city} onChange={e => setField('shipping_city', e.target.value)} />
              </div>
              <div>
                <label className="label">Provinsi</label>
                <input className="input" placeholder="Provinsi" value={form.shipping_province} onChange={e => setField('shipping_province', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">Produk</p>
              <button onClick={addItem} className="btn-secondary btn-sm"><Plus size={13} /> Tambah</button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <select className="input" value={item.product_id} onChange={e => setItem(i, 'product_id', e.target.value)}>
                      <option value="">Pilih produk...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} (stok: {p.stock})</option>)}
                    </select>
                  </div>
                  <div className="w-20">
                    <input type="number" className="input" min={1} placeholder="Qty"
                      value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} />
                  </div>
                  <div className="w-28">
                    <input type="number" className="input" placeholder="Harga"
                      value={item.unit_price} onChange={e => setItem(i, 'unit_price', e.target.value)} />
                  </div>
                  <button onClick={() => removeItem(i)} className="btn-ghost p-2 text-red-400 hover:text-red-600" disabled={items.length === 1}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Kurir</label>
              <input className="input" placeholder="JNE, J&T..." value={form.courier} onChange={e => setField('courier', e.target.value)} />
            </div>
            <div>
              <label className="label">Layanan</label>
              <input className="input" placeholder="REG, YES..." value={form.courier_service} onChange={e => setField('courier_service', e.target.value)} />
            </div>
            <div>
              <label className="label">Ongkir</label>
              <input type="number" className="input" value={form.shipping_cost} onChange={e => setField('shipping_cost', e.target.value)} />
            </div>
            <div>
              <label className="label">Diskon</label>
              <input type="number" className="input" value={form.discount} onChange={e => setField('discount', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Catatan</label>
              <input className="input" placeholder="Catatan opsional..." value={form.notes} onChange={e => setField('notes', e.target.value)} />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
            {form.discount > 0 && <div className="flex justify-between text-gray-600"><span>Diskon</span><span>-{formatRupiah(form.discount)}</span></div>}
            <div className="flex justify-between text-gray-600"><span>Ongkir</span><span>{formatRupiah(form.shipping_cost)}</span></div>
            <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2 mt-2">
              <span>Total</span><span>{formatRupiah(total)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">Batal</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</> : 'Simpan Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
