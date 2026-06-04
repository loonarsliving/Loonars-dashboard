import{formatRupiah,formatDate}from '../lib/utils'

export default function PrintReceipt({order,items,onClose}){
function handlePrint(){window.print()}
return(
<>
<style>{`@media print{body *{visibility:hidden}#resi,#resi *{visibility:visible}#resi{position:fixed;top:0;left:0;width:70mm;padding:4mm;font-family:monospace;font-size:9pt}.no-print{display:none!important}}`}</style>
<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
<div className="modal w-full max-w-xs">
<div className="flex items-center justify-between p-4 border-b border-gray-100">
<h2 className="font-bold text-gray-900 text-sm">Preview Resi</h2>
<button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 no-print">✕</button>
</div>
<div id="resi" className="p-4 font-mono text-xs" style={{width:'70mm',minHeight:'100mm'}}>
<div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
<p className="font-bold text-sm">LOONARS SKINCARE</p>
<p className="text-xs">loonarsbeauty.haluoleo.id</p>
</div>
<div className="mb-2 space-y-0.5">
<p>No    : {order?.order_number}</p>
<p>Tgl   : {formatDate(order?.created_at)}</p>
<p>Kurir : {order?.courier||'-'}</p>
</div>
<div className="border-t border-dashed border-gray-400 pt-2 mb-2 space-y-0.5">
<p className="font-bold">PEMBELI:</p>
<p>{order?.customer_name}</p>
<p>{order?.customer_phone}</p>
</div>
<div className="border-t border-dashed border-gray-400 pt-2 mb-2">
<p className="font-bold mb-1">PRODUK:</p>
{items?.map((item,i)=>(
<div key={i} className="flex justify-between">
<span>{item.product_name||'Produk'} x{item.quantity||item.qty||1}</span>
<span>{formatRupiah(item.subtotal)}</span>
</div>
))}
</div>
<div className="border-t border-dashed border-gray-400 pt-2">
<div className="flex justify-between font-bold">
<span>TOTAL</span>
<span>{formatRupiah(order?.total)}</span>
</div>
</div>
<div className="text-center mt-3 border-t border-dashed border-gray-400 pt-2">
<p>Terima kasih sudah berbelanja!</p>
<p>Loonars Skincare</p>
</div>
</div>
<div className="flex justify-end gap-3 p-4 border-t border-gray-100 no-print">
<button onClick={onClose} className="btn-secondary">Tutup</button>
<button onClick={handlePrint} className="btn-primary">Print Resi</button>
</div>
</div>
</div>
</>
)}
