import { formatDate, formatRupiah } from '../lib/utils'

export function triggerPrint() {
  window.print()
}

export default function PrintReceipt({ order, items }) {
  if (!order) return null
  return (
    <div id="print-area" className="hidden">
      <div style={{ width: '80mm', fontFamily: 'monospace', fontSize: '11px', padding: '4mm' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>LOONARS SKINCARE</div>
          <div style={{ fontSize: '10px' }}>Skincare Premium Indonesia</div>
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <div><strong>No. Order:</strong> {order.order_number}</div>
          <div><strong>Tanggal:</strong> {formatDate(order.created_at, 'dd/MM/yyyy HH:mm')}</div>
          <div><strong>Channel:</strong> {order.channel?.toUpperCase()}</div>
          {order.tracking_number && <div><strong>Resi:</strong> {order.tracking_number}</div>}
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

        <div style={{ marginBottom: '8px' }}>
          <div><strong>Penerima:</strong> {order.customer_name}</div>
          {order.customer_phone && <div><strong>HP:</strong> {order.customer_phone}</div>}
          {order.shipping_address && <div><strong>Alamat:</strong> {order.shipping_address}</div>}
          {order.shipping_city && <div>{order.shipping_city}{order.shipping_province ? `, ${order.shipping_province}` : ''}</div>}
          {order.courier && <div><strong>Kurir:</strong> {order.courier} {order.courier_service}</div>}
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

        <div style={{ marginBottom: '8px' }}>
          {(items || []).map((item, i) => (
            <div key={i}>
              <div style={{ fontWeight: 'bold' }}>{item.product_name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{item.quantity} x {formatRupiah(item.unit_price)}</span>
                <span>{formatRupiah(item.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal</span><span>{formatRupiah(order.subtotal)}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Diskon</span><span>-{formatRupiah(order.discount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Ongkir</span><span>{formatRupiah(order.shipping_cost)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginTop: '4px' }}>
            <span>TOTAL</span><span>{formatRupiah(order.total)}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '8px 0', textAlign: 'center', fontSize: '10px' }}>
          <div>Terima kasih telah berbelanja di Loonars Skincare!</div>
          <div>Produk premium untuk kulit bercahaya ✨</div>
        </div>
      </div>
    </div>
  )
}
