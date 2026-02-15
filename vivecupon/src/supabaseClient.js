import { createClient } from '@supabase/supabase-js'

// 1. Use la URL que ya tiene
const supabaseUrl = 'https://njfpxlcwjwdmaixsmulf.supabase.co'

// 2. IMPORTANTE: Vaya a su panel de Supabase y busque la llave "anon public". 
// No use la que empieza por "eyJhbG..." de su archivo .env, esa es privada.
const supabaseAnonKey ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZnB4bGN3andkbWFpeHNtdWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjIxMTksImV4cCI6MjA4NjQ5ODExOX0.3Z8bYx_S73tpHxbgklTV-CNxC_XAXAKGeuvb1YBLQN4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)