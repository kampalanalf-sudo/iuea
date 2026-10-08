// Persistent per-device settings + session identity.
// Uses Capacitor Preferences under the hood where available, localStorage elsewhere.

import { Preferences } from '@capacitor/preferences';
import { isNative } from './shell';
import type { User } from './types';

export interface Settings {
  groqKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  pathLossN: number; // path-loss exponent
  measuredPower: number; // dBm at 1 m when no calibrated TX power
  sessionId: string; // this console's stable id
}

const KEY = 'point.settings.v1';
const USER_KEY = 'point.user.v1';

function randomSessionId(): string {
  return `console-${Math.random().toString(36).slice(2, 10)}`;
}

function defaults(): Settings {
  return {
    groqKey: '',
    supabaseUrl: (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL ?? '',
    supabaseAnonKey: (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY ?? '',
    pathLossN: 2,
    measuredPower: -59,
    sessionId: randomSessionId(),
  };
}

export function loadSettings(): Settings {
  const d = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return d;
    return { ...d, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return d;
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
  if (isNative()) {
    Preferences.set({ key: KEY, value: JSON.stringify(s) }).catch(() => undefined);
  }
}

export function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function saveUser(u: User | null): void {
  try {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

export function deviceLabel(): string {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) {
    const m = ua.match(/Android [^;)]+;\s*([^)]+)\)/);
    if (m && m[1]) return m[1].trim();
  }
  return navigator.platform || 'console';
}
