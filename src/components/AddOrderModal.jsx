import{useState,useEffect}from 'react'
import{X,Plus,Trash2,Loader2}from 'lucide-react'
import{supabase}from '../lib/supabase'
import{ORDER_CHANNELS}from '../lib/utils'
import toast from 'react-hot-toast'

export default function AddOrderModal({onClose,onSaved}){
const[form,setForm]=useState({customer_name:'',customer_phone:'',channel:'offline',notes:''})
const[items,setItems]=useState([{product_id:'',product_name:'',qty:1,price:0,subtotal:0}])
const[products,setProducts]=useState([])
const[saving,setSaving]=useState(false)

useEffect(()=>{
supabase.from('products').select('id,name,price').eq('is_active',true).then(({data})=>setProducts(data||[]))
},[])

function updateItem(i,field,val){
const arr=[...items]
arr[i]={...arr[i],[field]:val}
if(field==='product_id'){
const p=products.find(x=>x.id===val)
if(p){arr[i].product_name=p.name;arr[i].price=p.price;arr[i].subtotal=p.price*arr[i].qty}
}
if(field==='qty'){arr[i].subtotal=arr[i].price*Number(val)}
if(field==='price'){arr[i].subtotal=Number(val)*arr[i].qty}
setItems(arr)
}

const total=items.reduce((s,i)=>s+i.subtotal,0)

async function handleSave(){
if(!form.customer_name)return toast.error('Nama pembeli wajib diisi')
if(!form.customer_phone)return toast.error('No HP wajib diisi')
if(items.some(i=>!i.product_id))return toast.error('Pilih produk')
setSaving(true)
try{
// Cari atau buat customer
let customerId
const{data:existing}=await supabase.from('customers').select('id').eq('phone',form.customer_phone).single()
if(existing){
customerId=existing.id
}else{
const{data:newCust,error:custErr}=await supabase.from('customers').insert({name:form.customer_name,phone:form.customer_phone}).select('id').single()
if(custErr)throw custErr
customerId=newCust.id
}
// Buat order
const{data:order,error:orderErr}=await supabase.from('orders').insert({
customer_id:customerId,
channel:form.channel,
notes:form.notes,
total,
status:'pending'
}).select('id').single()
if(orderErr)throw orderErr
// Buat order items
const orderItems=items.map(i=>({order_id:order.id,product_id:i.product_id,qty:i.qty,price:i.price,subtotal:i.subtotal}))
const{error:itemErr}=await supabase.from('order_items').insert(orderItems)
if(itemErr)throw itemErr
toast.success('Pesanan berhasil disimpan!')
onSaved()
}catch(e){
toast.error(e.message||'Gagal menyimpan')
}finally{setSaving(false)}
}

return(
<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
<div className="modal w-full max-w-lg max-h-[90vh] overflow-y-auto">
<div className="flex items-center justify-between p-5 border-b border-gray-100">
<h2 className="font-bold text-gray-900">Tambah Pesanan</h2>
<button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X size={16}/></button>
</div>
<div className="p-5 space-y-4">
<div className="grid grid-cols-2 gap-3">
<div>
<label className="label">Nama Pembeli</label>
<input className="input" placeholder="Nama lengkap" value={form.customer_name} onChange={e=>setForm(f=>({...f,customer_name:e.target.value}))}/>
</div>
<div>
<label className="label">No HP</label>
<input className="input" placeholder="08xxxxxxxxxx" value={form.customer_phone} onChange={e=>setForm(f=>({...f,customer_phone:e.target.value}))}/>
</div>
</div>
<div>
<label className="label">Channel</label>
<select className="input" value={form.channel} onChange={e=>setForm(f=>({...f,channel:e.target.value}))}>
{Object.entries(ORDER_CHANNELS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
</select>
</div>
<div>
<div className="flex items-center justify-between mb-2">
<label className="label mb-0">Produk</label>
<button onClick={()=>setItems([...items,{product_id:'',product_name:'',qty:1,price:0,subtotal:0}])} className="text-xs text-primary font-medium flex items-center gap-1"><Plus size={12}/>Tambah</button>
</div>
{items.map((item,i)=>(
<div key={i} className="flex gap-2 mb-2 items-center">
<select className="input flex-1 text-sm" value={item.product_id} onChange={e=>updateItem(i,'product_id',e.target.value)}>
<option value="">Pilih produk</option>
{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
</select>
<input type="number" className="input w-16 text-sm" min="1" value={item.qty} onChange={e=>updateItem(i,'qty',e.target.value)}/>
<span className="text-xs text-gray-500 w-20 text-right">Rp{item.subtotal.toLocaleString('id-ID')}</span>
{items.length>1&&<button onClick={()=>setItems(items.filter((_,j)=>j!==i))} className="text-red-400"><Trash2 size={14}/></button>}
</div>
))}
</div>
<div>
<label className="label">Catatan (opsional)</label>
<textarea className="input" rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
</div>
<div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
<span className="text-sm text-gray-600">Total</span>
<span className="font-bold text-primary">Rp{total.toLocaleString('id-ID')}</span>
</div>
</div>
<div className="flex justify-end gap-3 p-5 border-t border-gray-100">
<button onClick={onClose} className="btn-secondary">Batal</button>
<button onClick={handleSave} disabled={saving} className="btn-primary">
{saving?<Loader2 size={15} className="animate-spin"/>:<Plus size={15}/>}Simpan
</button>
</div>
</div>
</div>
)
}
