import{formatDate}from '../lib/utils'

export function triggerPrint(){window.print()}

export default function PrintReceipt({order,items,onClose}){
return(
<>
<style>{`@page{size:70mm 100mm;margin:0}@media print{body *{visibility:hidden}#resi,#resi *{visibility:visible}#resi{position:fixed;top:0;left:0;width:70mm;height:100mm;padding:3mm;font-family:Arial,sans-serif;font-size:8pt;overflow:hidden}.no-print{display:none!important}}`}</style>
<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
<div className="modal w-full max-w-xs">
<div className="flex items-center justify-between p-4 border-b border-gray-100">
<h2 className="font-bold text-gray-900 text-sm">Preview Label Resi</h2>
<button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 no-print">✕</button>
</div>
<div id="resi" className="p-3 text-xs" style={{width:'70mm',minHeight:'100mm',border:'1px solid #000'}}>
<div className="border-b-2 border-black pb-2 mb-2">
<p className="font-bold text-sm">LOONARS SKINCARE</p>
<p>loonarsbeauty.haluoleo.id</p>
</div>
<div className="border-b border-black pb-1 mb-1 flex justify-between">
<span className="font-bold">{order?.courier||'Kurir'}</span>
<span className="font-bold">{order?.courier_service||''}</span>
</div>
{order?.tracking_number&&(
<div className="border-b border-black pb-1 mb-2 text-center">
<p className="text-xs text-gray-500">No. Resi</p>
<p className="font-bold text-sm">{order.tracking_number}</p>
</div>
)}
<div className="border border-black p-1.5 mb-2 rounded">
<p className="text-xs font-bold mb-1">PENERIMA:</p>
<p className="font-bold text-sm">{order?.customer_name}</p>
<p className="font-bold">{order?.customer_phone}</p>
<p className="mt-1 leading-tight">{order?.shipping_address||order?.notes||'-'}</p>
</div>
<div className="border-t border-dashed border-gray-400 pt-1 mb-1">
<p className="text-xs font-bold">ISI PAKET:</p>
{items?.map((item,i)=>(
<p key={i}>{item.product_name||'Produk'} x{item.quantity||item.qty||1}</p>
))}
</div>
<div className="border-t border-dashed border-gray-400 pt-1">
<p className="text-xs">{order?.order_number} · {formatDate(order?.created_at)}</p>
</div>
<div className="text-center mt-1 text-xs">
<p>Terima kasih! 🌿</p>
</div>
</div>
<div className="flex justify-end gap-3 p-4 border-t border-gray-100 no-print">
<button onClick={onClose} className="btn-secondary">Tutup</button>
<button onClick={triggerPrint} className="btn-primary">Print Label</button>
</div>
</div>
</div>
</>
)}
