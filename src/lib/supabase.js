import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from localStorage or Vite environment variables
export const getStoredSupabaseConfig = () => {
  const customUrl = localStorage.getItem('caisterplayz_supabase_url');
  const customKey = localStorage.getItem('caisterplayz_supabase_anon_key');

  const url = customUrl || import.meta.env.VITE_SUPABASE_URL || '';
  const key = customKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  return { url, key };
};

export const setStoredSupabaseConfig = (url, key) => {
  if (url) localStorage.setItem('caisterplayz_supabase_url', url.trim());
  if (key) localStorage.setItem('caisterplayz_supabase_anon_key', key.trim());
};

const { url: initialUrl, key: initialKey } = getStoredSupabaseConfig();

// Safe fallback URL/key to prevent initialization crash before connection
const activeUrl = initialUrl || 'https://placeholder.supabase.co';
const activeKey = initialKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export const isSupabaseConfigured = () => {
  const { url, key } = getStoredSupabaseConfig();
  return Boolean(url && key && !url.includes('placeholder.supabase.co') && !url.includes('caisterplayz-social.supabase.co'));
};

export let supabase = createClient(activeUrl, activeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const reinitializeSupabase = (url, key) => {
  setStoredSupabaseConfig(url, key);
  supabase = createClient(url.trim(), key.trim(), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return supabase;
};
