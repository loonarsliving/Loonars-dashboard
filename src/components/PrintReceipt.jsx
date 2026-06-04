import{useEffect}from 'react'
import{supabase}from '../lib/supabase'
import toast from 'react-hot-toast'

export function triggerPrint(){window.print()}

const NEXT={pending:'processing',processing:'packing',packing:'shipped',shipped:'done'}
const LABEL={pending:'Diproses',processing:'Dikemas',packing:'Dikirim',shipped:'Selesai'}

export default function PrintReceipt({order,onClose,onStatusUpdated}){

useEffect(()=>{
async function open(){
if(order?.id&&NEXT[order?.status]){
const{error}=await supabase.from('orders').update({status:NEXT[order.status]}).eq('id',order.id)
if(!error){
toast.success('Status: '+LABEL[order.status])
if(onStatusUpdated)onStatusUpdated()
}
}
window.open('https://gluoioiimapyhchdasfl.supabase.co/functions/v1/print-receipt?id='+order?.id,'_blank')
onClose()
}
open()
},[])

return null
}
