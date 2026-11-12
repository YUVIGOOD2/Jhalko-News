import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';

/** Supabase keys set hain ya nahi. Nahi hain to site demo-mode me chalti hai. */
export const isConfigured = /^https:\/\/.+\.supabase\.co$/.test(url) && key.length > 20;

export const supabase = createClient(
  isConfigured ? url : 'https://placeholder.supabase.co',
  isConfigured ? key : 'placeholder-anon-key-placeholder',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } },
);
