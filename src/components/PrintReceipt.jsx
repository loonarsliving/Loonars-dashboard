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
const ih=(items||[]).map(i=>`<tr><td style="padding:4px 0;font-size:16px">${i.product_name||'Produk'}</td><td style="padding:4px 0;font-size:16px;text-align:right">x${i.quantity||i.qty||1}</td></tr>`).join('')
const tn=order?.tracking_number?`<div style="border-top:1.5px solid black;padding:8px 0;text-align:center"><p style="font-size:12px;color:#555">No. Resi</p><p style="font-weight:bold;font-size:22px;letter-spacing:1px">${order.tracking_number}</p></div>`:''
const html=`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Resi ${order?.order_number}</title><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:76mm;height:100mm;font-family:Arial,sans-serif;font-size:13pt;overflow:hidden}.w{width:76mm;height:100mm;padding:4mm;display:flex;flex-direction:column;justify-content:space-between}.btn{display:block;width:100%;padding:10px;background:#d4296c;color:white;border:none;border-radius:8px;font-size:15px;font-weight:bold;cursor:pointer;margin-bottom:8px}@media screen{html,body{width:auto;height:auto;background:#eee;display:flex;justify-content:center;padding:20px}.w{background:white;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.2);height:auto}}@media print{.btn{display:none}}@page{size:76mm 100mm;margin:0}</style></head><body><div class="w"><div><button class="btn" onclick="window.print()">Print / Simpan PDF</button><div style="border-bottom:2px solid black;padding-bottom:5px;margin-bottom:5px"><p style="font-weight:bold;font-size:16px;letter-spacing:.5px">LOONARS SKINCARE</p><p style="font-size:11px;color:#444">loonarsbeauty.haluoleo.id</p></div><div style="display:flex;justify-content:space-between;border-bottom:1.5px solid black;padding-bottom:5px;margin-bottom:5px"><b style="font-size:15px">${order?.courier||'Kurir'}</b><span style="font-size:13px">${order?.courier_service||''}</span></div>${tn}<div style="border:1.5px solid black;padding:6px;border-radius:3px;margin-bottom:5px"><p style="font-size:10px;color:#555;margin-bottom:3px;font-weight:bold">PENERIMA:</p><p style="font-weight:bold;font-size:17px;line-height:1.2">${order?.customer_name}</p><p style="font-weight:bold;font-size:15px">${order?.customer_phone}</p><p style="font-size:12px;line-height:1.4;margin-top:3px">${order?.shipping_address||order?.notes||'-'}</p></div><div style="border-top:1px dashed #888;padding-top:5px;margin-bottom:5px"><p style="font-size:10px;color:#555;font-weight:bold;margin-bottom:3px">ISI PAKET:</p><table style="width:100%">${ih}</table></div></div><div style="border-top:1px dashed #888;padding-top:4px;text-align:center"><p style="font-size:10px;color:#555">${order?.order_number} - ${date}</p><p style="font-size:12px;margin-top:2px">Terima kasih! 🌿</p></div></div></body></html>`
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
