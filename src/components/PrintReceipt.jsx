import{useState,useEffect}from 'react'
import{createPortal}from 'react-dom'
import{supabase}from '../lib/supabase'
import toast from 'react-hot-toast'

export function triggerPrint(){window.print()}

const NEXT={pending:'processing',processing:'packing',packing:'shipped',shipped:'done'}
const LABEL={pending:'Diproses',processing:'Dikemas',packing:'Dikirim',shipped:'Selesai'}

export default function PrintReceipt({order,items,onClose,onStatusUpdated}){
const[done,setDone]=useState(false)

useEffect(()=>{
async function updateSt(){
if(order?.id&&NEXT[order?.status]){
const{error}=await supabase.from('orders').update({status:NEXT[order.status]}).eq('id',order.id)
if(!error){toast.success('Status: '+LABEL[order.status]);if(onStatusUpdated)onStatusUpdated()}
}
setDone(true)
}
updateSt()
},[])

function openReceipt(){
const date=new Date(order?.created_at).toLocaleDateString('id-ID')
const ih=(items||[]).map(i=>`<p style="margin:2px 0">${i.product_name||'Produk'} x${i.quantity||i.qty||1}</p>`).join('')
const tn=order?.tracking_number?`<div style="text-align:center;border-top:1px solid black;padding:4px 0;margin:4px 0"><p style="font-size:9px;color:#666">No. Resi</p><p style="font-weight:bold;font-size:14px">${order.tracking_number}</p></div>`:''
const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Resi ${order?.order_number}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>
<style>body{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#eee;margin:0}.btn{padding:12px 24px;background:#d4296c;color:white;border:none;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer}</style>
</head><body>
<button class="btn" onclick="generatePDF()">Download PDF Resi</button>
<script>
function generatePDF(){
const {jsPDF}=window.jspdf
const doc=new jsPDF({orientation:'portrait',unit:'mm',format:[76,100]})
const W=76,margin=4,x=margin,w=W-margin*2
let y=margin+2

doc.setFontSize(11)
doc.setFont('helvetica','bold')
doc.text('LOONARS SKINCARE',W/2,y,{align:'center'})
y+=5
doc.setFontSize(7)
doc.setFont('helvetica','normal')
doc.text('haluoleo.id',W/2,y,{align:'center'})
y+=3
doc.setLineWidth(0.5)
doc.line(x,y,x+w,y)
y+=4

doc.setFontSize(9)
doc.setFont('helvetica','bold')
doc.text('${order?.courier||"Kurir"}',x,y)
y+=3
doc.setLineWidth(0.3)
doc.line(x,y,x+w,y)
y+=3

${order?.tracking_number?`
doc.setFontSize(7)
doc.setFont('helvetica','normal')
doc.text('No. Resi',W/2,y,{align:'center'})
y+=3
doc.setFontSize(11)
doc.setFont('helvetica','bold')
doc.text('${order.tracking_number}',W/2,y,{align:'center'})
y+=4
doc.line(x,y,x+w,y)
y+=3
`:''}

doc.setDrawColor(0)
doc.rect(x,y,w,32)
y+=4
doc.setFontSize(7)
doc.setFont('helvetica','normal')
doc.setTextColor(100)
doc.text('PENERIMA:',x+2,y)
y+=4
doc.setTextColor(0)
doc.setFontSize(11)
doc.setFont('helvetica','bold')
doc.text('${order?.customer_name||""}',x+2,y)
y+=5
doc.setFontSize(9)
doc.text('${order?.customer_phone||""}',x+2,y)
y+=4
doc.setFont('helvetica','normal')
doc.setFontSize(7)
const addr=doc.splitTextToSize('${(order?.shipping_address||order?.notes||"-").replace(/'/g,"\\'")}',w-4)
doc.text(addr,x+2,y)
y+=addr.length*3+4

doc.setFontSize(7)
doc.setTextColor(100)
doc.text('ISI PAKET:',x,y)
y+=4
doc.setTextColor(0)
doc.setFontSize(9)
doc.setFont('helvetica','normal')
${(items||[]).map(i=>`doc.text('${i.product_name||"Produk"} x${i.quantity||i.qty||1}',x,y);y+=4;`).join('')}

doc.setDrawColor(150)
doc.setLineDash([1,1])
doc.line(x,y,x+w,y)
y+=3
doc.setLineDash([])
doc.setFontSize(7)
doc.setTextColor(100)
doc.text('${order?.order_number} - ${date}',W/2,y,{align:'center'})
y+=4
doc.text('Terima kasih!',W/2,y,{align:'center'})

doc.save('resi-${order?.order_number}.pdf')
}
<\/script>
</body></html>`
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
<p style={{fontSize:13,color:'#666',marginBottom:16}}>Tap untuk download PDF 76x100mm</p>
<button onClick={openReceipt} style={{display:'block',width:'100%',padding:12,background:'#d4296c',color:'white',border:'none',borderRadius:10,fontSize:15,fontWeight:'bold',cursor:'pointer',marginBottom:8}}>Download PDF Resi</button>
<button onClick={onClose} style={{display:'block',width:'100%',padding:10,background:'#f3f4f6',color:'#374151',border:'none',borderRadius:10,fontSize:14,cursor:'pointer'}}>Tutup</button>
</div>
</div>,
document.body
)
}
