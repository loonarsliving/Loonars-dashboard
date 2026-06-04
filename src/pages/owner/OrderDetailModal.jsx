import{useState,useEffect}from 'react'
import{X,Printer,Package,CheckCircle,XCircle,Truck,Clock,Tag}from 'lucide-react'
import{supabase}from '../../lib/supabase'
import{formatRupiah,formatDate,ORDER_STATUS,ORDER_CHANNELS}from '../../lib/utils'
import PrintReceipt from '../../components/PrintReceipt'
import toast from 'react-hot-toast'

export default function OrderDetailModal({orderId,onClose,onUpdated}){
const[order,setOrder]=useState(null)
const[items,setItems]=useState([])
const[loading,setLoading]=useState(true)
const[showPrint,setShowPrint]=useState(false)
const[showSample,setShowSample]=useState(false)
const[sampleNotes,setSampleNotes]=useState('')
const[saving,setSaving]=useState(false)

useEffect(()=>{if(orderId)load()},[orderId])

async function load(){
setLoading(true)
const{data:o}=await supabase.from('orders').select('*').eq('id',orderId).single()
const{data:i}=await supabase.from('order_items').select('*').eq('order_id',orderId)
setOrder(o)
setItems(i||[])
setSampleNotes(o?.sample_notes||'')
setLoading(false)
}

async function updateStatus(status){
setSaving(true)
await supabase.from('orders').update({status}).eq('id',orderId)
toast.success('Status diperbarui')
load()
if(onUpdated)onUpdated()
setSaving(false)
}

async function toggleSample(){
setSaving(true)
if(order?.is_sample){
await supabase.from('orders').update({is_sample:false,sample_notes:null}).eq('id',orderId)
toast.success('Ditandai sebagai penjualan biasa')
}else{
await supabase.from('orders').update({is_sample:true,sample_notes:sampleNotes}).eq('id',orderId)
toast.success('Ditandai sebagai Sample')
}
setShowSample(false)
load()
if(onUpdated)onUpdated()
setSaving(false)
}

if(loading)return(
<div className="modal-overlay"><div className="modal p-10 text-center text-gray-400">Memuat...</div></div>
)

const st=ORDER_STATUS[order?.status]||{}
const ch=ORDER_CHANNELS[order?.channel]||{}
const STATUSES=['pending','processing','packing','shipped','done','cancelled']

return(
<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
<div className="modal w-full max-w-lg max-h-[90vh] overflow-y-auto">

{/* Header */}
<div className="flex items-center justify-between p-5 border-b border-gray-100">
<div>
<div className="flex items-center gap-2 flex-wrap">
<h2 className="font-bold text-gray-900">{order?.order_number}</h2>
<span className={`badge ${st.color}`}>{st.label}</span>
<span className={`badge ${ch.color}`}>{ch.label}</span>
{order?.is_sample&&<span className="badge bg-purple-100 text-purple-700">🎁 Sample</span>}
</div>
<p className="text-xs text-gray-400 mt-0.5">{formatDate(order?.created_at)}</p>
</div>
<div className="flex items-center gap-2">
<button onClick={()=>setShowPrint(true)} className="btn-secondary text-xs py-1.5 px-3"><Printer size={13}/> Cetak Resi</button>
<button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X size={16}/></button>
</div>
</div>

{/* Info */}
<div className="p-5 space-y-4">
<div className="grid grid-cols-2 gap-4">
<div>
<p className="text-xs text-gray-400 uppercase font-medium mb-1">Pelanggan</p>
<p className="font-semibold text-gray-900">{order?.customer_name}</p>
<p className="text-sm text-gray-500">{order?.customer_phone}</p>
</div>
<div>
<p className="text-xs text-gray-400 uppercase font-medium mb-1">Alamat Kirim</p>
<p className="text-sm text-gray-700 leading-relaxed">{order?.shipping_address||order?.notes||'-'}</p>
</div>
</div>

{/* Produk */}
<div>
<p className="text-xs text-gray-400 uppercase font-medium mb-2">Produk</p>
<div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
{items.map((item,i)=>(
<div key={i} className="px-4 py-3 flex justify-between items-center">
<div>
<p className="font-medium text-sm text-gray-900">{item.product_name||'Produk'}</p>
<p className="text-xs text-gray-400">{item.product_sku}</p>
</div>
<div className="text-right">
<p className="text-sm">{item.quantity||item.qty} x {formatRupiah(item.unit_price||item.price)}</p>
<p className="font-bold text-sm">{formatRupiah(item.subtotal)}</p>
</div>
</div>
))}
<div className="px-4 py-3 flex justify-between">
<span className="text-sm text-gray-500">Ongkir</span>
<span className="text-sm">{formatRupiah(order?.shipping_cost||0)}</span>
</div>
<div className="px-4 py-3 flex justify-between font-bold">
<span>Total</span>
<span className="text-primary">{formatRupiah(order?.total)}</span>
</div>
</div>
</div>

{/* Kurir */}
{order?.courier&&(
<div className="flex gap-4">
<div className="flex-1">
<p className="text-xs text-gray-400 uppercase font-medium mb-1">Kurir</p>
<p className="text-sm font-medium">{order.courier}</p>
</div>
{order?.tracking_number&&(
<div className="flex-1">
<p className="text-xs text-gray-400 uppercase font-medium mb-1">No. Resi</p>
<p className="text-sm font-medium font-mono">{order.tracking_number}</p>
</div>
)}
</div>
)}

{/* Sample Notes */}
{order?.is_sample&&order?.sample_notes&&(
<div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
<p className="text-xs font-bold text-purple-700 mb-1">🎁 Catatan Sample:</p>
<p className="text-sm text-purple-800">{order.sample_notes}</p>
</div>
)}

{/* Update Status */}
<div className="bg-blue-50 rounded-xl p-4">
<p className="text-xs font-bold text-blue-700 uppercase mb-3">Update Status</p>
<div className="flex flex-wrap gap-2">
{STATUSES.filter(s=>s!==order?.status).map(s=>(
<button key={s} onClick={()=>updateStatus(s)} disabled={saving}
className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-blue-700">
{ORDER_STATUS[s]?.label||s}
</button>
))}
</div>
</div>

{/* Tombol Sample */}
