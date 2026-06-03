import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: { eventsPerSecond: 10 }
  }
})

// Helper: get setting value
export async function getSetting(key) {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single()
  return data?.value ?? null
}

// Helper: update setting
export async function updateSetting(key, value) {
  const { error } = await supabase
    .from('settings')
    .update({ value: String(value), updated_at: new Date().toISOString() })
    .eq('key', key)
  return !error
}

// Helper: get multiple settings as object
export async function getSettings(keys) {
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', keys)
  return Object.fromEntries((data || []).map(s => [s.key, s.value]))
}

// Helper: create notification
export async function createNotification(title, message, type = 'info', referenceId = null, referenceType = null) {
  await supabase.from('notifications').insert({
    title, message, type,
    reference_id: referenceId,
    reference_type: referenceType
  })
}
