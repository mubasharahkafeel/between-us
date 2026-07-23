import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cyhqpebyneqyejenydfu.supabase.co'
const supabaseKey = 'sb_publishable_rIVNNigOFeACu_FiZd03yg_-48gdzCg'

export const supabase = createClient(supabaseUrl, supabaseKey)
