import { supabase } from './supabase'

async function getTelegramConfig() {
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['telegram_bot_token', 'telegram_chat_id', 'telegram_enabled'])
  
  const cfg = Object.fromEntries((data || []).map(s => [s.key, s.value]))
  return {
    token: cfg.telegram_bot_token || '',
    chatId: cfg.telegram_chat_id || '',
    enabled: cfg.telegram_enabled === 'true'
  }
}

export async function sendTelegram(message) {
  const cfg = await getTelegramConfig()
  if (!cfg.enabled || !cfg.token || !cfg.chatId) return false
  
  try {
    const url = `https://api.telegram.org/bot${cfg.token}/sendMessage`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cfg.chatId,
        text: message,
        parse_mode: 'HTML'
      })
    })
    return response.ok
  } catch {
    return false
  }
}

export function msgNewOrder(order, items) {
  const ch = order.channel?.toUpperCase() || 'OFFLINE'
  const itemList = items.map(i => `  • ${i.product_name} x${i.quantity}`).join('\n')
  return `🛍️ <b>ORDER BARU!</b>

📦 <b>${order.order_number}</b>
🏪 Channel: ${ch}
👤 ${order.customer_name}
📱 ${order.customer_phone || '-'}

${itemList}

💰 Total: <b>Rp ${Number(order.total).toLocaleString('id-ID')}</b>

⏰ ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}

👉 Segera proses di dashboard!`
}

export function msgLowStock(product) {
  const pct = product.max_stock > 0 ? Math.round((product.stock / product.max_stock) * 100) : 0
  return `⚠️ <b>STOK MENIPIS!</b>

📦 <b>${product.name}</b>
SKU: ${product.sku}
Sisa stok: <b>${product.stock} pcs</b>

🔴 Segera lakukan restock!`
}

export function msgStatusUpdate(order) {
  const statusEmoji = {
    processing: '⚙️', packing: '📦', shipped: '🚚', done: '✅', cancelled: '❌'
  }
  const statusLabel = {
    processing: 'Diproses', packing: 'Dikemas', shipped: 'Dikirim', done: 'Selesai', cancelled: 'Dibatalkan'
  }
  return `${statusEmoji[order.status] || '📋'} <b>Update Order</b>

📦 ${order.order_number}
👤 ${order.customer_name}
Status: <b>${statusLabel[order.status] || order.status}</b>
${order.tracking_number ? `🔢 Resi: <code>${order.tracking_number}</code>` : ''}`
}

export function msgDailyReport(stats) {
  return `📊 <b>LAPORAN HARIAN LOONARS</b>
📅 ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' })}

🛍️ Total Order: <b>${stats.totalOrders}</b>
✅ Selesai: ${stats.doneOrders}
🚚 Dikirim: ${stats.shippedOrders}
⏳ Pending: ${stats.pendingOrders}

💰 Omzet: <b>Rp ${Number(stats.revenue).toLocaleString('id-ID')}</b>
📈 Profit: <b>Rp ${Number(stats.profit).toLocaleString('id-ID')}</b>

📦 Produk terlaris: ${stats.topProduct || '-'}

${stats.lowStockCount > 0 ? `⚠️ Stok menipis: ${stats.lowStockCount} produk` : '✅ Semua stok aman'}`
}
