import { useState, useEffect } from 'react'
import { Search, Plus, MessageCircle, Calendar, RefreshCw, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatRupiah, formatDate, CUSTOMER_SEGMENTS } from '../../lib/utils'
import toast from 'react-hot-toast'

function CustomerModal({ customer, onClose, onSaved }) {
  const isEdit = !!customer?.id
  const [form, setForm] = useState({
    name: customer?.name || '', phone: customer?.phone || '', email: customer?.email || '',
    address: customer?.address || '', city: customer?.city || '', province: customer?.province || '',
    segment: customer?.segment || 'new', notes: customer?.notes || ''
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.name) return toast.error('Nama wajib diisi')
    setSaving(true)
    try {
      const { error } = isEdit
        ? await supabase.from('customers').update(form).eq('id', customer.id)
        : await supabase.from('customers').insert(form)
      if (error) throw error
      toast.success(isEdit ? 'Pelanggan diupdate' : 'Pelanggan ditambahkan')
      onSaved()
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{isEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">✕</button>
        </div>
        <div className="overflow-y-auto max-h-[60vh] p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Nama *</label>
              <input className="input" value={form.name} onChange={e => f('name', e.target.value)} />
            </div>
            <div>
              <label className="label">No. HP</label>
              <input className="input" value={form.phone} onChange={e => f('phone', e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => f('email', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Alamat</label>
              <input className="input" value={form.address} onChange={e => f('address', e.target.value)} />
            </div>
            <div>
              <label className="label">Kota</label>
              <input className="input" value={form.city} onChange={e => f('city', e.target.value)} />
            </div>
            <div>
              <label className="label">Segment</label>
              <select className="input" value={form.segment} onChange={e => f('segment', e.target.value)}>
                <option value="new">Pelanggan Baru</option>
                <option value="loyal">Pelanggan Loyal</option>
                <option value="at_risk">Perlu Followup</option>
                <option value="inactive">Tidak Aktif</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Catatan Internal</label>
              <textarea className="input" rows={2} value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Catatan tentang pelanggan..." />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">Batal</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </div>
    </div>
  )
}

function FollowupModal({ customer, onClose }) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [list, setList] = useState([])

  useEffect(() => {
    supabase.from('followup_schedules').select('*').eq('customer_id', customer.id).order('scheduled_at').then(({ data }) => setList(data || []))
  }, [customer.id])

  async function handleSave() {
    if (!title || !scheduledAt) return toast.error('Judul dan waktu wajib diisi')
    setSaving(true)
    try {
      const { data } = await supabase.from('followup_schedules').insert({
        customer_id: customer.id, title, notes, scheduled_at: scheduledAt
      }).select().single()
      setList(prev => [...prev, data])
      setTitle(''); setNotes(''); setScheduledAt('')
      toast.success('Followup dijadwalkan')
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  async function toggleDone(f) {
    await supabase.from('followup_schedules').update({ is_done: !f.is_done, done_at: !f.is_done ? new Date().toISOString() : null }).eq('id', f.id)
    setList(prev => prev.map(x => x.id === f.id ? { ...x, is_done: !x.is_done } : x))
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Followup — {customer.name}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">✕</button>
        </div>
        <div className="overflow-y-auto max-h-[65vh] p-5 space-y-4">
          <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jadwalkan Followup</p>
            <input className="input" placeholder="Judul followup..." value={title} onChange={e => setTitle(e.target.value)} />
            <input type="datetime-local" className="input" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
            <textarea className="input" rows={2} placeholder="Catatan..." value={notes} onChange={e => setNotes(e.target.value)} />
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full justify-center">
              {saving ? 'Menyimpan...' : '+ Tambah Jadwal'}
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jadwal Followup</p>
            {list.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Belum ada jadwal</p>
            ) : list.map(f => (
              <div key={f.id} className={`flex gap-3 p-3 rounded-xl border ${f.is_done ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200'}`}>
                <input type="checkbox" className="mt-0.5 accent-primary" checked={f.is_done} onChange={() => toggleDone(f)} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${f.is_done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{f.title}</p>
                  {f.notes && <p className="text-xs text-gray-500 mt-0.5">{f.notes}</p>}
                  <p className="text-xs text-gray-400 mt-1">📅 {formatDate(f.scheduled_at, 'dd MMM yyyy HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary w-full justify-center">Tutup</button>
        </div>
      </div>
    </div>
  )
}

export default function OwnerCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState('')
  const [editCustomer, setEditCustomer] = useState(null)
  const [followupCustomer, setFollowupCustomer] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [total, setTotal] = useState(0)

  async function load() {
    setLoading(true)
    let q = supabase.from('customers').select('*', { count: 'exact' }).order('created_at', { ascending: false })
    if (search) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
    if (segment) q = q.eq('segment', segment)
    const { data, count } = await q.limit(50)
    setCustomers(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [search, segment])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pelanggan</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total pelanggan</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={16} /> Tambah</button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Cari nama atau HP..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto" value={segment} onChange={e => setSegment(e.target.value)}>
            <option value="">Semua Segment</option>
            <option value="new">Pelanggan Baru</option>
            <option value="loyal">Loyal</option>
            <option value="at_risk">Perlu Followup</option>
            <option value="inactive">Tidak Aktif</option>
          </select>
          <button onClick={load} className="btn-secondary btn-sm"><RefreshCw size={14} /></button>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Pelanggan</th>
              <th>Kontak</th>
              <th>Segment</th>
              <th>Total Order</th>
              <th>Total Belanja</th>
              <th>Terakhir Order</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Memuat...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Tidak ada pelanggan</td></tr>
            ) : customers.map(c => {
              const seg = CUSTOMER_SEGMENTS[c.segment]
              return (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {c.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{c.name}</div>
                        {c.city && <div className="text-xs text-gray-400">{c.city}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    {c.phone && (
                      <a href={`https://wa.me/62${c.phone?.replace(/^0/, '')}`} target="_blank" rel="noreferrer"
                        className="text-sm text-green-600 hover:underline flex items-center gap-1">
                        💬 {c.phone}
                      </a>
                    )}
                    {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
                  </td>
                  <td>
                    <span className={`badge ${seg?.color}`}>{seg?.label}</span>
                  </td>
                  <td className="text-center font-semibold text-gray-700">{c.total_orders}</td>
                  <td className="font-semibold text-sm">{formatRupiah(c.total_spent, true)}</td>
                  <td className="text-xs text-gray-500">{c.last_order_at ? formatDate(c.last_order_at, 'dd MMM yyyy') : '-'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => setFollowupCustomer(c)} className="btn-ghost btn-sm" title="Followup">
                        <Calendar size={14} />
                      </button>
                      <button onClick={() => setEditCustomer(c)} className="btn-ghost btn-sm" title="Edit">
                        <User size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {(showAdd || editCustomer) && (
        <CustomerModal customer={editCustomer} onClose={() => { setShowAdd(false); setEditCustomer(null) }} onSaved={() => { setShowAdd(false); setEditCustomer(null); load() }} />
      )}
      {followupCustomer && (
        <FollowupModal customer={followupCustomer} onClose={() => setFollowupCustomer(null)} />
      )}
    </div>
  )
}
