import{useState,useEffect}from 'react'
import{createPortal}from 'react-dom'
import{supabase}from '../lib/supabase'
import toast from 'react-hot-toast'

export function triggerPrint(){window.print()}

const NEXT={pending:'processing',processing:'packing',packing:'shipped',shipped:'done'}
const LABEL={pending:'Diproses',processing:'Dikemas',packing:'Dikirim',shipped:'Selesai'}

export default function PrintReceipt({order,items,onClose,onStatusUpdated}){
const[statusDone,setStatusDone]=useState(false)

useEffect(()=>{
async function updateSt(){
if(order?.id&&NEXT[order?.status]){
const{error}=await supabase.from('orders').update({status:NEXT[order.status]}).eq('id',order.id)
if(!error){toast.success('Status: '+LABEL[order.status]);if(onStatusUpdated)onStatusUpdated()}
}
setStatusDone(true)
}
updateSt()
},[])

function openReceipt(){
const date=new Date(order?.created_at).toLocaleDateString('id-ID')
const ih=(items||[]).map(i=>`<p style="margin:2px 0">${i.product_name||'Produk'} x${i.quantity||i.qty||1}</p>`).join('')
const tn=order?.tracking_number?`<div style="border-top:1px solid black;padding:4px 0;text-align:center"><p style="font-size:7pt;color:#666">No. Resi</p><p style="font-weight:bold;font-size:11pt">${order.tracking_number}</p></div>`:''
const html=`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Resi ${order?.order_number}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:9pt;background:#eee;padding:16px;display:flex;justify-content:center}.w{background:white;width:70mm;padding:8px;border-radius:4px}.btn{display:block;width:100%;padding:10px;background:#d4296c;color:white;border:none;border-radius:8px;font-size:14px;font-weight:bold;cursor:pointer;margin-bottom:10px}@media print{.btn{display:none}body{background:white;padding:0}}@page{size:70mm 100mm;margin:3mm}</style></head><body><div class="w"><button class="btn" onclick="window.print()">Print / Simpan PDF</button><div style="border-bottom:2px solid black;padding-bottom:6px;margin-bottom:4px"><p style="font-weight:bold;font-size:11pt">LOONARS SKINCARE</p><p style="font-size:8pt">loonarsbeauty.haluoleo.id</p></div><div style="border-bottom:1px solid black;padding:4px 0;display:flex;justify-content:space-between"><b>${order?.courier||'Kurir'}</b><span>${order?.courier_service||''}</span></div>${tn}<div style="border:1px solid black;padding:6px;margin:4px 0;border-radius:3px"><p style="font-size:7pt;color:#666">PENERIMA:</p><p style="font-weight:bold;font-size:11pt">${order?.customer_name}</p><p style="font-weight:bold">${order?.customer_phone}</p><p style="margin-top:3px;line-height:1.4">${order?.shipping_address||order?.notes||'-'}</p></div><div style="border-top:1px dashed #999;padding-top:4px;margin-top:4px"><p style="font-size:7pt;color:#666">ISI PAKET:</p>${ih}</div><div style="border-top:1px dashed #999;padding-top:4px;margin-top:4px;text-align:center"><p style="font-size:7pt">${order?.order_number} - ${date}</p><p>Terima kasih!</p></div></div></body></html>`
const blob=new Blob([html],{type:'text/html;charset=utf-8'})
const url=URL.createObjectURL(blob)
window.open(url,'_blank')
onClose()
}

return createPortal(
<div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.7)',zIndex:999999,display:'flex',alignItems:'center',justifyContent:'center'}}>
<div style={{background:'white',borderRadius:16,padding:24,margin:16,textAlign:'center',maxWidth:300}}>
<p style={{fontSize:40,marginBottom:8}}>🧾</p>
<p style={{fontWeight:'bold',fontSize:16,marginBottom:4}}>Label Resi Siap</p>
<p style={{fontSize:13,color:'#666',marginBottom:16}}>Status pesanan sudah diperbarui</p>
<button onClick={openReceipt} style={{display:'block',width:'100%',padding:12,background:'#d4296c',color:'white',border:'none',borderRadius:10,fontSize:15,fontWeight:'bold',cursor:'pointer',marginBottom:8}}>Buka Label Resi</button>
<button onClick={onClose} style={{display:'block',width:'100%',padding:10,background:'#f3f4f6',color:'#374151',border:'none',borderRadius:10,fontSize:14,cursor:'pointer'}}>Tutup</button>
</div>
</div>,
document.body
)
}
