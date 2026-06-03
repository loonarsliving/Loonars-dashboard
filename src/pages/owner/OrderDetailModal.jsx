import { useState, useEffect, useRef } from 'react'
import { X, Printer, Save, Loader2, Package, Truck, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatRupiah, formatDate, ORDER_STATUS, ORDER_CHANNELS } from '../../lib/utils'
import { sendTelegram, msgStatusUpdate } from '../../lib/telegram'
import { createNotification } from '../../lib/supabase'
import PrintReceipt, { triggerPrint } from '../../components/PrintReceipt'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const STATUS_FLOW = ['pending', 'processing', 'packing', 'shipped', 'done']

export default function OrderDetailModal({ orderId, onClose }) {
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [courier, setCourier] = useState('')
  const [courierService, setCourierService] = useState('')

  useEffect(() => {
    loadOrder()
  }, [orderId])

  async function loadOrder() {
    setLoading(true)
    const [{ data: o }, { data: i }] = await Promise.all([
      supabase.from('orders').select('*').eq('id', orderId).single(),
      supabase.from('order_items').select('*, products(name, sku)').eq('order_id', orderId)
    ])
    setOrder(o)
    setItems(i || [])
    setNewStatus(o?.status || '')
    setTrackingNumber(o?.tracking_number || '')
    setCourier(o?.courier || '')
    setCourierService(o?.courier_service || '')
    setLoading(false)
  }

  async function handleSave() {
    if (!order) return
    setSaving(true)
    try {
      const updates = {
        status: newStatus,
        tracking_number: trackingNumber,
        courier,
        courier_service: courierService,
        processed_by: user?.id
      }

      const { error } = await supabase.from('orders').update(updates).eq('id', orderId)
      if (error) throw error

      // Notify
      if (newStatus !== order.status) {
        await Promise.all([
          sendTelegram(msgStatusUpdate({ ...order, ...updates })),
          createNotification(
            `Order ${order.order_number} diupdate`,
            `Status: ${ORDER_STATUS[newStatus]?.label}`,
            'info', orderId, 'order'
          )
        ])
      }
      toast.success('Order berhasil diupdate')
      onClose()
    } catch (e) {
      toast.error('Gagal update order')
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel() {
    if (!confirm('Yakin batalkan order ini?')) return
    setSaving(true)
    try {
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
      toast.success('Order dibatalkan')
      onClose()
    } catch {
      toast.error('Gagal membatalkan order')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="modal-overlay">
      <div className="modal w-full max-w-lg p-10 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    </div>
  )

  if (!order) return null

  const st = ORDER_STATUS[order.status]
  const ch = ORDER_CHANNELS[order.channel]
  const currentIdx = STATUS_FLOW.indexOf(order.status)

  return (
    <>
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{order.order_number}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge ${st?.bg} ${st?.text}`}>{st?.label}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${ch?.color || 'bg-gray-400'}`}>
                  {ch?.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { window.setTimeout(triggerPrint, 100) }} className="btn-secondary btn-sm">
                <Printer size={14} /> Cetak Resi
              </button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Status stepper */}
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center">
              {STATUS_FLOW.map((s, i) => {
                const done = i <= currentIdx
                const current = i === currentIdx
                return (
                  <div key={s} className="flex items-center flex-1">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all
                      ${current ? 'bg-primary text-white ring-4 ring-primary/20' : done ? 'bg-primary/80 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {done && !current ? '✓' : i + 1}
                    </div>
                    {i < STATUS_FLOW.length - 1 && (
                      <div className={`flex-1 h-1 mx-1 rounded ${i < currentIdx ? 'bg-primary/60' : 'bg-gray-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-1">
              {STATUS_FLOW.map(s => (
                <span key={s} className="text-[10px] text-gray-500 text-center flex-1">{ORDER_STATUS[s]?.label}</span>
              ))}
            </div>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto max-h-[60vh]">
            <div className="p-5 space-y-5">
              {/* Customer info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1">PELANGGAN</p>
                  <p className="font-semibold text-gray-900">{order.customer_name}</p>
                  {order.customer_phone && <p className="text-sm text-gray-600">{order.customer_phone}</p>}
                  {order.customer_email && <p className="text-sm text-gray-500">{order.customer_email}</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1">ALAMAT KIRIM</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {order.shipping_address}<br />
                    {order.shipping_city}{order.shipping_province ? `, ${order.shipping_province}` : ''} {order.shipping_postal_code}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs text-gray-400 font-medium mb-2">PRODUK</p>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-xs text-gray-400">{item.product_sku}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-gray-500">{item.quantity} × {formatRupiah(item.unit_price, true)}</p>
                        <p className="font-semibold text-gray-900">{formatRupiah(item.subtotal, true)}</p>
                      </div>
                    </div>
                  ))}
                  <div className="px-4 py-3 bg-gray-50 space-y-1 text-sm">
                    {Number(order.discount) > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Diskon</span><span>-{formatRupiah(order.discount, true)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                      <span>Ongkir</span><span>{formatRupiah(order.shipping_cost, true)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-1 mt-1">
                      <span>Total</span><span>{formatRupiah(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Update form */}
              {order.status !== 'done' && order.status !== 'cancelled' && (
                <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Update Order</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label text-xs">Status</label>
                      <select className="input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                        {STATUS_FLOW.map(s => (
                          <option key={s} value={s}>{ORDER_STATUS[s]?.label}</option>
                        ))}
                        <option value="cancelled">Batal</option>
                      </select>
                    </div>
                    <div>
                      <label className="label text-xs">No. Resi</label>
                      <input className="input" placeholder="Masukkan nomor resi"
                        value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} />
                    </div>
                    <div>
                      <label className="label text-xs">Kurir</label>
                      <input className="input" placeholder="JNE, J&T, SiCepat..."
                        value={courier} onChange={e => setCourier(e.target.value)} />
                    </div>
                    <div>
                      <label className="label text-xs">Layanan</label>
                      <input className="input" placeholder="REG, YES, SAME DAY..."
                        value={courierService} onChange={e => setCourierService(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {order.notes && (
                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
                  <p className="text-xs font-medium text-yellow-700">Catatan:</p>
                  <p className="text-sm text-yellow-800 mt-0.5">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-5 border-t border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-400">{formatDate(order.created_at)}</div>
            <div className="flex gap-2">
              {order.status !== 'done' && order.status !== 'cancelled' && (
                <button onClick={handleCancel} disabled={saving} className="btn-danger btn-sm">
                  <XCircle size={14} /> Batalkan
                </button>
              )}
              {order.status !== 'done' && order.status !== 'cancelled' && (
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Simpan
                </button>
              )}
              <button onClick={onClose} className="btn-secondary">Tutup</button>
            </div>
          </div>
        </div>
      </div>
      <PrintReceipt order={order} items={items} />
    </>
  )
}
