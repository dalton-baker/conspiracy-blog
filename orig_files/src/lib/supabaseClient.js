import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL ?? "https://plazmhrwcrjkczolknbm.supabase.co",
    import.meta.env.VITE_SUPABASE_ANON_KEY ?? "sb_publishable_Pg0r87yHTP9rH7cvp0KHUw_tQiOlEDH"
)
