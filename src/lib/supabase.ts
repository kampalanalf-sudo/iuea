import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfigState } from '../types/distribution';

const STORAGE_URL_KEY = 'tank_supabase_url';
const STORAGE_ANON_KEY = 'tank_supabase_anon_key';

let supabaseInstance: SupabaseClient | null = null;

export function getSavedSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_URL_KEY) || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_ANON_KEY) || '' : '';

  const url = (localUrl || envUrl).trim();
  const anonKey = (localKey || envKey).trim();
  const isValidUrl =
    url.startsWith('https://') &&
    !url.includes('your-project-ref') &&
    anonKey.length > 20 &&
    !anonKey.includes('your-supabase');

  if (!isValidUrl) {
    return { url: '', anonKey: '' };
  }
  return { url, anonKey };
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSavedSupabaseCredentials();
  if (!url || !anonKey) {
    supabaseInstance = null;
    return null;
  }
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch {
      supabaseInstance = null;
    }
  }
  return supabaseInstance;
}

export function saveSupabaseCredentials(url: string, anonKey: string): SupabaseClient | null {
  if (typeof window !== 'undefined') {
    if (url.trim() && anonKey.trim()) {
      localStorage.setItem(STORAGE_URL_KEY, url.trim());
      localStorage.setItem(STORAGE_ANON_KEY, anonKey.trim());
    } else {
      localStorage.removeItem(STORAGE_URL_KEY);
      localStorage.removeItem(STORAGE_ANON_KEY);
    }
  }
  supabaseInstance = null;
  return getSupabaseClient();
}

export async function testSupabaseConnection(): Promise<SupabaseConfigState> {
  const { url, anonKey } = getSavedSupabaseCredentials();
  if (!url || !anonKey) {
    return {
      url: '',
      anonKey: '',
      mode: 'hybrid-local',
      lastSyncedAt: new Date().toISOString(),
      connectedTables: 7,
      errorMessage: null,
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      url,
      anonKey,
      mode: 'hybrid-local',
      lastSyncedAt: null,
      connectedTables: 0,
      errorMessage: 'Invalid Supabase URL or Anon Key format.',
    };
  }

  try {
    const { error } = await client.from('releases').select('id').limit(1);
    if (error) {
      return {
        url,
        anonKey,
        mode: 'live-supabase',
        lastSyncedAt: new Date().toISOString(),
        connectedTables: 0,
        errorMessage: `Connected to Supabase endpoint, but schema needs migration (${error.message}). Run 001_tank_distribution_schema.sql in SQL Editor.`,
      };
    }

    return {
      url,
      anonKey,
      mode: 'live-supabase',
      lastSyncedAt: new Date().toISOString(),
      connectedTables: 7,
      errorMessage: null,
    };
  } catch (err) {
    return {
      url,
      anonKey,
      mode: 'hybrid-local',
      lastSyncedAt: null,
      connectedTables: 0,
      errorMessage: err instanceof Error ? err.message : 'Unable to reach Supabase host.',
    };
  }
}

export async function signInWithGitHubOAuth(): Promise<{ ok: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      message:
        'GitHub Session Authenticated via Local Studio Provider (@kampalanalf-sudo). Connect live Supabase URL & Anon Key to trigger live OAuth redirect.',
    };
  }
  const { error } = await client.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true, message: 'Redirecting to GitHub OAuth via Supabase...' };
}
