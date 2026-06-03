import { useState, useEffect } from 'react'
import { Save, Send, Loader2, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'
import { supabase, getSettings, updateSetting } from '../../lib/supabase'
import { sendTelegram } from '../../lib/telegram'
import toast from 'react-hot-toast'

const SETTING_GROUPS = [
  {
    title: '🏪 Informasi Toko',
    keys: ['store_name', 'store_phone', 'store_email', 'store_address'],
    labels: { store_name: 'Nama Toko', store_phone: 'No. WA Toko', store_email: 'Email', store_address: 'Alamat Toko' },
    types: { store_phone: 'tel', store_email: 'email', store_address: 'textarea' }
  },
  {
    title: '🤖 Notifikasi Telegram',
    keys: ['telegram_bot_token', 'telegram_chat_id', 'telegram_enabled'],
    labels: { telegram_bot_token: 'Bot Token', telegram_chat_id: 'Chat ID', telegram_enabled: 'Aktifkan Notifikasi' },
    types: { telegram_bot_token: 'password', telegram_enabled: 'toggle' },
    help: {
      telegram_bot_token: 'Buat bot di @BotFather, lalu copy token-nya',
      telegram_chat_id: 'Chat ID grup/channel Telegram kamu. Gunakan @userinfobot untuk mengetahuinya'
    }
  },
  {
    title: '📦 Pengaturan Stok',
    keys: ['low_stock_threshold'],
    labels: { low_stock_threshold: 'Threshold Alert Stok (%)' },
    types: { low_stock_threshold: 'number' },
    help: { low_stock_threshold: 'Notifikasi dikirim saat stok di bawah persentase ini (default: 30%)' }
  },
  {
    title: '🔄 Integrasi Platform',
    keys: ['tokopedia_shop_id', 'tokopedia_api_key', 'shopee_shop_id', 'shopee_partner_id', 'shopee_api_key'],
    labels: {
      tokopedia_shop_id: 'Tokopedia Shop ID', tokopedia_api_key: 'Tokopedia API Key',
      shopee_shop_id: 'Shopee Shop ID', shopee_partner_id: 'Shopee Partner ID', shopee_api_key: 'Shopee API Key'
    },
    types: { tokopedia_api_key: 'password', shopee_api_key: 'password' },
    help: {
      tokopedia_shop_id: 'Daftarkan aplikasi di Tokopedia Open API untuk mendapatkan credential',
      shopee_shop_id: 'Daftarkan aplikasi di Shopee Open Platform untuk mendapatkan credential'
    },
    warning: 'API Tokopedia & Shopee memerlukan persetujuan resmi. Hubungi seller support masing-masing platform.'
  }
]

export default function OwnerSettings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [showPassMap, setShowPassMap] = useState({})

  const allKeys = SETTING_GROUPS.flatMap(g => g.keys)

  useEffect(() => {
    getSettings(allKeys).then(s => { setSettings(s); setLoading(false) })
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await Promise.all(
        Object.entries(settings).map(([k, v]) => updateSetting(k, v))
      )
      toast.success('Pengaturan berhasil disimpan!')
    } catch {
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  async function testTelegram() {
    setTesting(true); setTestResult(null)
    try {
      await updateSetting('telegram_bot_token', settings.telegram_bot_token)
      await updateSetting('telegram_chat_id', settings.telegram_chat_id)
      await updateSetting('telegram_enabled', 'true')
      const ok = await sendTelegram('✅ Test notifikasi dari <b>Loonars Dashboard</b> berhasil!\n\nBotmu sudah terhubung dengan baik. 🎉')
      setTestResult(ok)
      if (ok) toast.success('Notifikasi Telegram berhasil!')
      else toast.error('Gagal kirim notifikasi. Cek token dan chat ID')
    } catch {
      setTestResult(false)
      toast.error('Gagal mengirim test notifikasi')
    } finally {
      setTesting(false)
    }
  }

  const set = (k, v) => setSettings(prev => ({ ...prev, [k]: v }))
  const toggleShow = k => setShowPassMap(prev => ({ ...prev, [k]: !prev[k] }))

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-gray-500 text-sm mt-0.5">Konfigurasi toko dan integrasi</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Simpan Semua
        </button>
      </div>

      {SETTING_GROUPS.map(group => (
        <div key={group.title} className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-800">{group.title}</h2>
          </div>
          <div className="card-body space-y-4">
            {group.warning && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                ⚠️ {group.warning}
              </div>
            )}
            {group.keys.map(key => {
              const type = group.types?.[key] || 'text'
              const label = group.labels[key]
              const help = group.help?.[key]
              const val = settings[key] || ''
              
              if (type === 'toggle') return (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    {help && <p className="text-xs text-gray-400 mt-0.5">{help}</p>}
                  </div>
                  <button onClick={() => set(key, val === 'true' ? 'false' : 'true')}
                    className={`w-12 h-6 rounded-full transition-all relative ${val === 'true' ? 'bg-primary' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${val === 'true' ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              )

              if (type === 'textarea') return (
                <div key={key}>
                  <label className="label">{label}</label>
                  {help && <p className="text-xs text-gray-400 mb-1">{help}</p>}
                  <textarea className="input" rows={2} value={val} onChange={e => set(key, e.target.value)} />
                </div>
              )

              if (type === 'password') return (
                <div key={key}>
                  <label className="label">{label}</label>
                  {help && <p className="text-xs text-gray-400 mb-1">{help}</p>}
                  <div className="relative">
                    <input type={showPassMap[key] ? 'text' : 'password'} className="input pr-10"
                      value={val} onChange={e => set(key, e.target.value)} />
                    <button type="button" onClick={() => toggleShow(key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassMap[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )

              return (
                <div key={key}>
                  <label className="label">{label}</label>
                  {help && <p className="text-xs text-gray-400 mb-1">{help}</p>}
                  <input type={type} className="input" value={val} onChange={e => set(key, e.target.value)} />
                </div>
              )
            })}

            {group.title.includes('Telegram') && (
              <div className="pt-2 border-t border-gray-100">
                <button onClick={testTelegram} disabled={testing || !settings.telegram_bot_token}
                  className="btn-secondary flex items-center gap-2">
                  {testing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Test Notifikasi
                </button>
                {testResult === true && <p className="text-green-600 text-xs mt-2 flex items-center gap-1"><CheckCircle size={13} /> Berhasil terhubung!</p>}
                {testResult === false && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><XCircle size={13} /> Gagal. Cek token & chat ID</p>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
