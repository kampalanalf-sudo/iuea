// Central app store: session state, live scan ingest, identity ledger,
// cloud publish (1.5 s debounce) and admin pull (15 s + realtime).

import type { Identity, Observation, ObsSource, User, ViewId, Workspace } from './types';
import { loadSettings, saveSettings, loadUser, saveUser, deviceLabel, type Settings } from './prefs';
import { scanner } from './ble';
import { mergeObservation, workspaceFingerprint } from './ledger';
import { getFix, startGeoWatch, stopGeoWatch } from './geo';
import { isConfigured, pullWorkspaces, pushWorkspace, subscribeRealtime, testConnection } from './supabase';
import { getHeading, startHeadingWatch } from './heading';
import { uid } from './util';

export type CloudState = 'off' | 'idle' | 'syncing' | 'ok' | 'error';

export interface AppState {
  user: User | null;
  view: ViewId;
  settings: Settings;
  scanning: boolean;
  scanError: string | null;
  observations: Observation[];
  identities: Record<string, Identity>;
  obsCount: number;
  lastObsAt: number | null;
  sessionStartedAt: number;
  cloud: CloudState;
  cloudMessage: string;
  cloudWorkspaces: Workspace[];
  lastSyncAt: number | null;
}

let state: AppState = {
  user: loadUser(),
  view: 'scan',
  settings: loadSettings(),
  scanning: false,
  scanError: null,
  observations: [],
  identities: {},
  obsCount: 0,
  lastObsAt: null,
  sessionStartedAt: Date.now(),
  cloud: 'off',
  cloudMessage: '',
  cloudWorkspaces: [],
  lastSyncAt: null,
};

const listeners = new Set<() => void>();
let emitScheduled = false;

function emit(): void {
  if (emitScheduled) return;
  emitScheduled = true;
  queueMicrotask(() => {
    emitScheduled = false;
    listeners.forEach((l) => l());
  });
}

export function getState(): AppState {
  return state;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function set(patch: Partial<AppState>): void {
  state = { ...state, ...patch };
  emit();
}

// ---------- user / navigation ----------

export function login(name: string, role: User['role']): void {
  const user = { name: name.trim() || 'operator', role };
  saveUser(user);
  set({ user });
  void maybeStartCloud();
}

export function logout(): void {
  saveUser(null);
  stopScan();
  set({ user: null, view: 'scan' });
}

export function setView(view: ViewId): void {
  set({ view });
}

// ---------- settings ----------

export function updateSettings(patch: Partial<Settings>): void {
  const settings = { ...state.settings, ...patch };
  saveSettings(settings);
  set({ settings });
  if ('supabaseUrl' in patch || 'supabaseAnonKey' in patch) void maybeStartCloud();
}

export async function runCloudTest(): Promise<{ ok: boolean; message: string }> {
  const r = await testConnection(state.settings.supabaseUrl, state.settings.supabaseAnonKey);
  set({ cloudMessage: r.message, cloud: r.ok ? 'ok' : 'error' });
  return r;
}

// ---------- observation ingest ----------

const MAX_OBS = 5000;

function ingest(partial: Omit<Observation, 'id' | 'ts' | 'source'>, source: ObsSource): void {
  const fix = getFix();
  // Live bearing = device compass heading at the moment of sighting
  // (source = operator's fused compass; ordinary BLE has no AoA).
  let bearing = partial.bearing;
  if (source === 'live' && bearing === undefined && state.settings.captureBearing) {
    const h = getHeading();
    if (h !== null) bearing = Math.round(h);
  }
  const o: Observation = {
    ...partial,
    id: uid(),
    ts: Date.now(),
    source,
    bearing,
    lat: partial.lat ?? fix?.lat,
    lon: partial.lon ?? fix?.lon,
  };
  const identities = mergeObservation({ ...state.identities }, o);
  const observations = state.observations.length >= MAX_OBS ? [...state.observations.slice(-MAX_OBS + 1)] : [...state.observations];
  observations.push(o);
  set({ observations, identities, obsCount: state.obsCount + 1, lastObsAt: o.ts });
  schedulePublish();
}

export function ingestObservations(rows: Observation[]): number {
  if (rows.length === 0) return 0;
  const identities = { ...state.identities };
  const observations = [...state.observations];
  for (const o of rows) {
    mergeObservation(identities, o);
    observations.push(o);
    if (observations.length > MAX_OBS) observations.splice(0, observations.length - MAX_OBS);
  }
  set({ observations, identities, obsCount: state.obsCount + rows.length, lastObsAt: Date.now() });
  schedulePublish();
  return rows.length;
}

export function clearSession(): void {
  set({ observations: [], identities: {}, obsCount: 0, lastObsAt: null, sessionStartedAt: Date.now() });
  schedulePublish();
}

// ---------- scanning ----------

export async function startScan(): Promise<void> {
  if (state.scanning) return;
  set({ scanning: true, scanError: null });
  void startGeoWatch();
  startHeadingWatch();
  try {
    await scanner.start((partial) => ingest(partial, 'live'));
  } catch (e) {
    set({ scanning: false, scanError: (e as Error).message });
    stopGeoWatch();
  }
}

export function stopScan(): void {
  void scanner.stop();
  stopGeoWatch();
  set({ scanning: false });
}

// ---------- shared cloud ----------

let publishTimer: ReturnType<typeof setTimeout> | null = null;
let lastFingerprint = '';
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let unsubscribeRealtime: (() => void) | null = null;

function schedulePublish(): void {
  if (!isConfigured(state.settings.supabaseUrl, state.settings.supabaseAnonKey)) return;
  if (publishTimer) return;
  publishTimer = setTimeout(() => {
    publishTimer = null;
    void publishNow();
  }, 1500);
}

async function publishNow(): Promise<void> {
  const { supabaseUrl, supabaseAnonKey } = state.settings;
  if (!isConfigured(supabaseUrl, supabaseAnonKey) || !state.user) return;
  const fp = workspaceFingerprint(state.identities);
  if (fp === lastFingerprint && state.cloud === 'ok') return;
  set({ cloud: 'syncing' });
  const ws: Workspace = {
    id: state.settings.sessionId,
    operatorId: `${state.settings.sessionId}:${state.user.name}`,
    operatorName: state.user.name,
    deviceLabel: deviceLabel(),
    updatedAt: Date.now(),
    identities: Object.values(state.identities),
  };
  const res = await pushWorkspace(supabaseUrl, supabaseAnonKey, ws);
  if (res.ok) {
    lastFingerprint = fp;
    set({ cloud: 'ok', cloudMessage: '', lastSyncAt: Date.now() });
  } else {
    set({ cloud: 'error', cloudMessage: res.message ?? 'publish failed' });
  }
}

async function refreshCloudWorkspaces(): Promise<void> {
  const { supabaseUrl, supabaseAnonKey } = state.settings;
  if (!isConfigured(supabaseUrl, supabaseAnonKey)) return;
  try {
    const ws = await pullWorkspaces(supabaseUrl, supabaseAnonKey);
    set({ cloudWorkspaces: ws, cloud: 'ok', lastSyncAt: Date.now() });
  } catch (e) {
    set({ cloud: 'error', cloudMessage: (e as Error).message });
  }
}

async function maybeStartCloud(): Promise<void> {
  const { supabaseUrl, supabaseAnonKey } = state.settings;
  if (!isConfigured(supabaseUrl, supabaseAnonKey)) {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = null;
    if (unsubscribeRealtime) unsubscribeRealtime();
    unsubscribeRealtime = null;
    set({ cloud: 'off', cloudWorkspaces: [] });
    return;
  }
  set({ cloud: 'idle', cloudMessage: '' });
  void refreshCloudWorkspaces();
  if (!refreshTimer) refreshTimer = setInterval(() => void refreshCloudWorkspaces(), 15000);
  if (!unsubscribeRealtime) {
    unsubscribeRealtime = subscribeRealtime(supabaseUrl, supabaseAnonKey, () => void refreshCloudWorkspaces());
  }
  void publishNow();
}

// Boot: resume cloud if configured + logged in.
if (state.user) void maybeStartCloud();
