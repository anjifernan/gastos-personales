import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hsuziivxwjgktxpqpbmg.supabase.co'
const SUPABASE_KEY = 'sb_publishable_cnairVE10c7lA0nTQ5UQKQ_ELC2xopN'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
