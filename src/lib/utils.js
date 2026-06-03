import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { id } from 'date-fns/locale'

export function formatRupiah(amount, short = false) {
  const num = Number(amount) || 0
  if (short) {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}M`
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}Jt`
    if (num >= 1000) return `${(num / 1000).toFixed(0)}rb`
  }
  return `Rp ${num.toLocaleString('id-ID')}`
}

export function formatDate(date, fmt = 'dd MMM yyyy HH:mm') {
  if (!date) return '-'
  try {
    return format(new Date(date), fmt, { locale: id })
  } catch {
    return '-'
  }
}

export function formatDateOnly(date) {
  return formatDate(date, 'dd MMM yyyy')
}

export function getDateRange(range) {
  const now = new Date()
  switch (range) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) }
    case 'yesterday': {
      const y = subDays(now, 1)
      return { from: startOfDay(y), to: endOfDay(y) }
    }
    case 'week':
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) }
    case 'month':
      return { from: startOfMonth(now), to: endOfMonth(now) }
    case '7days':
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) }
    case '30days':
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) }
    default:
      return { from: startOfDay(now), to: endOfDay(now) }
  }
}

export const ORDER_STATUS = {
  pending:    { label: 'Baru',      color: 'blue',   bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200' },
  processing: { label: 'Diproses',  color: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  packing:    { label: 'Dikemas',   color: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  shipped:    { label: 'Dikirim',   color: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  done:       { label: 'Selesai',   color: 'green',  bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200' },
  cancelled:  { label: 'Batal',     color: 'red',    bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200' },
}

export const ORDER_CHANNELS = {
  tokopedia: { label: 'Tokopedia', color: 'bg-green-500',  textColor: 'text-white' },
  shopee:    { label: 'Shopee',    color: 'bg-orange-500', textColor: 'text-white' },
  website:   { label: 'Website',   color: 'bg-blue-500',   textColor: 'text-white' },
  offline:   { label: 'Offline',   color: 'bg-gray-500',   textColor: 'text-white' },
}

export const CUSTOMER_SEGMENTS = {
  new:      { label: 'Pelanggan Baru',   color: 'bg-blue-100 text-blue-700' },
  loyal:    { label: 'Pelanggan Loyal',  color: 'bg-green-100 text-green-700' },
  at_risk:  { label: 'Perlu Followup',   color: 'bg-yellow-100 text-yellow-700' },
  inactive: { label: 'Tidak Aktif',      color: 'bg-gray-100 text-gray-600' },
}

export function getStockStatus(product) {
  if (!product) return { pct: 0, label: 'Tidak diketahui', color: 'gray' }
  const threshold = product.low_stock_threshold || 30
  const maxRef = Math.max(product.stock + 10, product.min_stock * 3, 10)
  const pct = Math.min(100, Math.round((product.stock / maxRef) * 100))
  
  if (product.stock === 0) return { pct: 0, label: 'Habis', color: 'red', alert: true }
  if (pct <= threshold) return { pct, label: 'Menipis', color: 'orange', alert: true }
  if (pct <= 50) return { pct, label: 'Cukup', color: 'yellow', alert: false }
  return { pct, label: 'Aman', color: 'green', alert: false }
}

export function truncate(str, n = 30) {
  if (!str) return ''
  return str.length > n ? str.substring(0, n) + '...' : str
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function calcProfit(items) {
  return items.reduce((acc, item) => {
    const sale = Number(item.unit_price) * item.quantity
    const cost = Number(item.cost_price) * item.quantity
    return acc + (sale - cost)
  }, 0)
}
