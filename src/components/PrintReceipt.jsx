import{formatDate}from '../lib/utils'
import{supabase}from '../lib/supabase'
import toast from 'react-hot-toast'

export function triggerPrint(){window.print()}

const NEXT_STATUS={pending:'processing',processing:'packing',packing:'shipped',shipped:'done'}
const NEXT_LABEL={pending:'Diproses',processing:'Dikemas',packing:'Dikirim',shipped:'Selesai'}

export default function PrintReceipt({order,items,onClose,onStatusUpdated}){

async function handleSavePDF(){
window.print()
// Auto update status setelah print
if(order?.id && NEXT_STATUS[order?.status]){
const nextStatus=NEXT_STATUS[order.status]
const{error}=await supabase.from('orders').update({status:nextStatus}).eq('id',order.id)
if(!error){
toast.success('Status diupdate ke: '+NEXT_LABEL[order.status])
if(onStatusUpdated)onStatusUpdated(nextStatus)
}
}
}

return(
<>
<style>{`
@page{size:70mm 100mm;margin:0}
@media print{
body *{visibility:hidden}
#resi,#resi *{visibility:visible}
#resi{position:fixed;top:0;left:0;width:70mm;height:100mm;padding:3mm;font-family:Arial,sans-serif;font-size:8pt;background:white}
.no-print{display:none!important}}
`}</style>
<div className="modal-overlay no-print" style={{zIndex:9999}} onClick={e=>e.target===e.currentTarget&&onClose()}>
<div className="modal w-full max-w-xs">
<div className="flex items-center justify-between p-4 border-b border-gray-100">
<h2 className="font-bold text-gray-900 text-sm">Preview Label Resi</h2>
<button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">✕</button>
</div>
<div id="resi" className="p-3 text-xs bg-white" style={{width:'70mm',minHeight:'100mm',border:'1px solid #000'}}>
<div className="border-b-2 border-black pb-2 mb-2">
<p className="font-bold text-sm">LOONARS SKINCARE</p>
<p>loonarsbeauty.haluoleo.id</p>
</div>
<div className="border-b border-black pb-1 mb-1 flex justify-between">
<span className="font-bold">{order?.courier||'Kurir'}</span>
<span>{order?.courier_service||''}</span>
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
<div className="bg-blue-50 mx-4 p-2 rounded-lg text-xs text-blue-700 no-print">
💡 Tap "Simpan PDF" → cubit preview ke atas → Save to Files → buka di Printer Label
</div>
<div className="flex justify-end gap-2 p-4 border-t border-gray-100 no-print">
<button onClick={onClose} className="btn-secondary text-sm">✕ Tutup</button>
<button onClick={handleSavePDF} className="btn-primary text-sm">📄 Simpan PDF</button>
</div>
</div>
</div>
</>
)}
