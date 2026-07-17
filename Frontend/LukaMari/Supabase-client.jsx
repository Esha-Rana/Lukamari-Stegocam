import { createClient } from "@supabase/supabase-js";
const SupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const SupabaseANONKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SupabaseUrl, SupabaseANONKey);