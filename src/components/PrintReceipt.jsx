import{createPortal}from 'react-dom'
import{formatDate}from '../lib/utils'
import{supabase}from '../lib/supabase'
import toast from 'react-hot-toast'

export function triggerPrint(){window.print()}

const NEXT={pending:'processing',processing:'packing',packing:'shipped',shipped:'done'}
const LABEL={pending:'Diproses',processing:'Dikemas',packing:'Dikirim',shipped:'Selesai'}

export default function PrintReceipt({order,items,onClose,onStatusUpdated}){

async function handlePrint(){
if(order?.id&&NEXT[order?.status]){
const{error}=await supabase.from('orders').update({status:NEXT[order.status]}).eq('id',order.id)
if(!error){
toast.success('Status: '+LABEL[order.status])
if(onStatusUpdated)onStatusUpdated(NEXT[order.status])
}}
window.print()
}

const modal=(
<>
<style>{`@page{size:70mm 100mm;margin:0}@media print{body *{visibility:hidden}#resi,#resi *{visibility:visible}#resi{position:fixed;top:0;left:0;width:70mm;height:100mm;padding:3mm;font-family:Arial,sans-serif;font-size:8pt;background:white}}`}</style>
<div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.6)',zIndex:99999,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'all'}}>
<div onClick={e=>e.stopPropagation()} style={{background:'white',borderRadius:16,width:'calc(100% - 32px)',maxWidth:320,pointerEvents:'all'}}>
<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:16,borderBottom:'1px solid #f3f4f6'}}>
<span style={{fontWeight:'bold',fontSize:14}}>Preview Label Resi</span>
<button onClick={onClose} style={{width:32,height:32,borderRadius:8,border:'none',background:'#f3f4f6',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'all'}}>✕</button>
</div>
<div id="resi" style={{margin:12,padding:8,border:'1px solid black',fontFamily:'Arial,sans-serif',fontSize:'8pt',minHeight:'100mm',width:'70mm',background:'white'}}>
<div style={{borderBottom:'2px solid black',paddingBottom:6,marginBottom:6}}>
<p style={{fontWeight:'bold',fontSize:12,margin:0}}>LOONARS SKINCARE</p>
<p style={{margin:0,fontSize:9}}>loonarsbeauty.haluoleo.id</p>
</div>
<div style={{borderBottom:'1px solid black',paddingBottom:4,marginBottom:4,display:'flex',justifyContent:'space-between'}}>
<span style={{fontWeight:'bold'}}>{order?.courier||'Kurir'}</span>
<span>{order?.courier_service||''}</span>
</div>
{order?.tracking_number&&(
<div style={{borderBottom:'1px solid black',paddingBottom:4,marginBottom:8,textAlign:'center'}}>
<p style={{margin:0,fontSize:8,color:'#666'}}>No. Resi</p>
<p style={{margin:0,fontWeight:'bold',fontSize:12}}>{order.tracking_number}</p>
</div>
)}
<div style={{border:'1px solid black',padding:6,marginBottom:8,borderRadius:4}}>
<p style={{margin:'0 0 4px',fontWeight:'bold',fontSize:8}}>PENERIMA:</p>
<p style={{margin:0,fontWeight:'bold',fontSize:12}}>{order?.customer_name}</p>
<p style={{margin:0,fontWeight:'bold'}}>{order?.customer_phone}</p>
<p style={{margin:'4px 0 0',lineHeight:1.4}}>{order?.shipping_address||order?.notes||'-'}</p>
</div>
<div style={{borderTop:'1px dashed #999',paddingTop:4,marginBottom:4}}>
<p style={{margin:'0 0 2px',fontWeight:'bold',fontSize:8}}>ISI PAKET:</p>
{items?.map((item,i)=>(<p key={i} style={{margin:0}}>{item.product_name||'Produk'} x{item.quantity||item.qty||1}</p>))}
</div>
<div style={{borderTop:'1px dashed #999',paddingTop:4,textAlign:'center'}}>
<p style={{margin:0,fontSize:8}}>{order?.order_number} · {formatDate(order?.created_at)}</p>
<p style={{margin:'4px 0 0'}}>Terima kasih! 🌿</p>
</div>
</div>
<div style={{background:'#eff6ff',margin:'0 12px 12px',padding:8,borderRadius:8,fontSize:11,color:'#1d4ed8'}}>
💡 Tap "Simpan PDF" → cubit preview ke atas → Save to Files → buka di Printer Label
</div>
<div style={{display:'flex',justifyContent:'flex-end',gap:8,padding:16,borderTop:'1px solid #f3f4f6',pointerEvents:'all'}}>
<button onClick={onClose} style={{padding:'8px 16px',borderRadius:8,border:'1px solid #e5e7eb',background:'white',cursor:'pointer',pointerEvents:'all'}}>Tutup</button>
<button onClick={handlePrint} style={{padding:'8px 16px',borderRadius:8,border:'none',background:'#d4296c',color:'white',cursor:'pointer',fontWeight:'bold',pointerEvents:'all'}}>📄 Simpan PDF</button>
</div>
</div>
</div>
</>
)

return createPortal(modal,document.body)
}
