import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  '';

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-anon-public-key')
  );
};

// Singleton Supabase instance if credentials exist, or null
let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    supabaseInstance = null;
  }
}

export const supabase = supabaseInstance;
export { supabaseUrl, supabaseAnonKey };

/**
 * Returns the canonical redirect URL for Supabase authentication callbacks
 * (e.g. password reset recovery, email confirmation).
 * Prioritizes production domain https://freelanceflow.ai.studio or configured APP_URL,
 * while preserving local development origin (localhost/127.0.0.1) when running locally.
 */
export const getAuthRedirectUrl = (path: string = '/reset-password'): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // If running in browser, check if we're on localhost or custom domain
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    // If running on localhost or 127.0.0.1, keep localhost for seamless local development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return `${origin}${normalizedPath}`;
    }
  }

  // Use configured app URL from environment if present and not localhost
  const envAppUrl = import.meta.env.VITE_APP_URL || import.meta.env.APP_URL;
  if (envAppUrl && !envAppUrl.includes('localhost') && !envAppUrl.includes('127.0.0.1')) {
    const cleanUrl = envAppUrl.replace(/\/+$/, '');
    return `${cleanUrl}${normalizedPath}`;
  }

  // If browser is on production domain or any hosted preview, use window.location.origin
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${normalizedPath}`;
  }

  // Default canonical production URL
  return `https://freelanceflow.ai.studio${normalizedPath}`;
};

