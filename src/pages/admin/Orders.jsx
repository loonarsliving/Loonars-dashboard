import{useState,useEffect}from 'react'
import{Plus,Search,Loader2}from 'lucide-react'
import{supabase}from '../../lib/supabase'
import{formatRupiah,formatDate,ORDER_STATUS,ORDER_CHANNELS}from '../../lib/utils'
import AddOrderModal from '../../components/AddOrderModal'
import toast from 'react-hot-toast'
export default function AdminOrders(){
const[orders,setOrders]=useState([])
const[loading,setLoading]=useState(true)
const[search,setSearch]=useState('')
const[status,setStatus]=useState('')
const[showAdd,setShowAdd]=useState(false)
const[upd,setUpd]=useState(null)
async function load(){
setLoading(true)
let q=supabase.from('v_order_summary').select('*').order('created_at',{ascending:false})
if(status)q=q.eq('status',status)
if(search)q=q.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%`)
const{data}=await q
setOrders(data||[])
setLoading(false)}
useEffect(()=>{load()},[status,search])
async function updateStatus(id,s){
setUpd(id)
const{error}=await supabase.from('orders').update({status:s}).eq('id',id)
if(error)toast.error('Gagal')
else{toast.success('Updated');load()}
setUpd(null)}
const next={pending:'processing',processing:'packing',packing:'shipped',shipped:'done'}
const lbl={pending:'Proses',processing:'Packing',packing:'Kirim',shipped:'Selesai'}
return(
<div className="space-y-4">
<div className="flex items-center justify-between">
<h1 className="text-2xl font-bold text-gray-900">Pesanan</h1>
<button onClick={()=>setShowAdd(true)} className="btn-primary"><Plus size={16}/>Tambah Offline</button>
</div>
<div className="flex gap-2">
<div className="relative flex-1">
<Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
<input className="input pl-8 py-2 text-sm" placeholder="Cari..." value={search} onChange={e=>setSearch(e.target.value)}/>
</div>
<select className="input py-2 text-sm w-auto" value={status} onChange={e=>setStatus(e.target.value)}>
<option value="">Semua</option>
{Object.entries(ORDER_STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
</select>
</div>
<div className="card divide-y divide-gray-50">
{loading?<div className="py-10 text-center text-gray-400">Memuat...</div>
:orders.length===0?<div className="py-10 text-center text-gray-400">Belum ada pesanan</div>
:orders.map(o=>{
const st=ORDER_STATUS[o.status]||{}
const ch=ORDER_CHANNELS[o.channel]||{}
return(
<div key={o.id} className="px-4 py-3 flex items-center gap-3">
<div className="flex-1 min-w-0">
<div className="flex items-center gap-2 flex-wrap">
<span className="font-mono text-xs font-bold">{o.order_number}</span>
<span className={`badge text-xs ${st.color}`}>{st.label}</span>
<span className={`badge text-xs ${ch.color}`}>{ch.label}</span>
</div>
<p className="text-sm font-medium truncate">{o.customer_name}</p>
<p className="text-xs text-gray-500">{formatDate(o.created_at)} · {formatRupiah(o.total)}</p>
</div>
<div className="flex gap-2 shrink-0">
{next[o.status]&&<button onClick={()=>updateStatus(o.id,next[o.status])} disabled={upd===o.id} className="btn-primary text-xs py-1.5 px-3">{upd===o.id?<Loader2 size={12} className="animate-spin"/>:lbl[o.status]}</button>}
{o.status!=='done'&&o.status!=='cancelled'&&<button onClick={()=>updateStatus(o.id,'cancelled')} disabled={upd===o.id} className="btn-secondary text-xs py-1.5 px-3 text-red-500">Batal</button>}
</div>
</div>)})}
</div>
{showAdd&&<AddOrderModal onClose={()=>setShowAdd(false)} onSaved={()=>{setShowAdd(false);load()}}/>}
</div>)}
