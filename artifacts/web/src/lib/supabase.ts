import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wacdwoxpjnfxedryadky.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhY2R3b3hwam5meGVkcnlhZGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTkyMjMsImV4cCI6MjA5NTc3NTIyM30.rZihiuPlXUUf_puIpTtf32XXdMDsAOSkAT3zywj0zsY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
