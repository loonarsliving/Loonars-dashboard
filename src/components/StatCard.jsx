export default function StatCard({ icon: Icon, label, value, sub, color = 'primary', onClick }) {
  const colors = {
    primary: { bg: 'bg-primary/10', icon: 'text-primary', border: 'border-primary/20' },
    green:   { bg: 'bg-green-50',   icon: 'text-green-600', border: 'border-green-100' },
    blue:    { bg: 'bg-blue-50',    icon: 'text-blue-600',  border: 'border-blue-100' },
    yellow:  { bg: 'bg-yellow-50',  icon: 'text-yellow-600',border: 'border-yellow-100' },
    red:     { bg: 'bg-red-50',     icon: 'text-red-500',   border: 'border-red-100' },
    purple:  { bg: 'bg-purple-50',  icon: 'text-purple-600',border: 'border-purple-100' },
    orange:  { bg: 'bg-orange-50',  icon: 'text-orange-600',border: 'border-orange-100' },
  }
  const c = colors[color] || colors.primary

  return (
    <div onClick={onClick}
      className={`card p-5 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg} ${c.border} border`}>
        {Icon && <Icon size={22} className={c.icon} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
