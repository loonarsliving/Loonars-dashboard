import { useState, useEffect } from 'react'
import { Plus, Loader2, Shield, ShieldOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

function InviteModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'admin' })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.full_name || !form.email || !form.password) return toast.error('Semua field wajib diisi')
    if (form.password.length < 8) return toast.error('Password minimal 8 karakter')
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(form)
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Gagal membuat akun')
      toast.success(`Akun ${form.full_name} berhasil dibuat!`)
      onSaved()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Tambah Anggota Tim</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Nama Lengkap</label>
            <input className="input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" placeholder="Min. 8 karakter" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="admin">Admin / Tim Operasional</option>
              <option value="owner">Owner (akses penuh)</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">Batal</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Buat Akun
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OwnerUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleActive(u) {
    await supabase.from('profiles').update({ is_active: !u.is_active }).eq('id', u.id)
    toast.success(u.is_active ? 'Akun dinonaktifkan' : 'Akun diaktifkan')
    load()
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Tim</h1>
          <p className="text-gray-500 text-sm mt-0.5">Kelola akun anggota tim</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} /> Tambah Anggota
        </button>
      </div>
      <div className="card">
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="py-10 text-center text-gray-400">Memuat...</div>
          ) : users.map(u => (
            <div key={u.id} className="px-5 py-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${u.role === 'owner' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                {u.full_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 text-sm">{u.full_name}</p>
                  {u.id === currentUser?.id && <span className="text-xs text-primary">(kamu)</span>}
                </div>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${u.role === 'owner' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'}`}>
                  {u.role === 'owner' ? '👑 Owner' : '👤 Admin'}
                </span>
                <span className={`badge ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {u.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
                {u.id !== currentUser?.id && (
                  <button onClick={() => toggleActive(u)} className="btn-ghost btn-sm text-gray-400">
                    {u.is_active ? <ShieldOff size={14} /> : <Shield size={14} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {showAdd && <InviteModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load() }} />}
    </div>
  )
}
