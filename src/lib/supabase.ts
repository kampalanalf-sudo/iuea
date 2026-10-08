// Shared cloud (Supabase) — all users, one backend.
// Tables: point_operators, point_sessions, point_observations (see supabase/schema.sql).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Identity, Workspace } from './types';

let client: SupabaseClient | null = null;
let clientKey = '';

export function getClient(url: string, anonKey: string): SupabaseClient | null {
  if (!url || !anonKey) return null;
  const key = `${url}|${anonKey}`;
  if (client && clientKey === key) return client;
  try {
    client = createClient(url, anonKey, { auth: { persistSession: false } });
    clientKey = key;
    return client;
  } catch {
    return null;
  }
}

export function isConfigured(url: string, anonKey: string): boolean {
  return /^https?:\/\//.test(url || '') && (anonKey || '').length > 20;
}

export async function testConnection(url: string, anonKey: string): Promise<{ ok: boolean; message: string }> {
  const c = getClient(url, anonKey);
  if (!c) return { ok: false, message: 'Enter both Project URL and anon public key.' };
  const { error } = await c.from('point_sessions').select('id', { count: 'exact', head: true });
  if (error) return { ok: false, message: `Connection failed: ${error.message}` };
  return { ok: true, message: 'Connected. point_sessions reachable.' };
}

/** Upsert this console's operator + session + latest observations (~1.5 s debounce in store). */
export async function pushWorkspace(
  url: string,
  anonKey: string,
  ws: Workspace,
): Promise<{ ok: boolean; message?: string }> {
  const c = getClient(url, anonKey);
  if (!c) return { ok: false, message: 'not configured' };
  try {
    const { error: opErr } = await c.from('point_operators').upsert(
      { id: ws.operatorId, name: ws.operatorName, role: 'operator', last_seen: new Date().toISOString() },
      { onConflict: 'id' },
    );
    if (opErr) return { ok: false, message: opErr.message };

    const { error: sErr } = await c.from('point_sessions').upsert(
      {
        id: ws.id,
        operator_id: ws.operatorId,
        operator_name: ws.operatorName,
        device_label: ws.deviceLabel,
        updated_at: new Date(ws.updatedAt).toISOString(),
      },
      { onConflict: 'id' },
    );
    if (sErr) return { ok: false, message: sErr.message };

    const rows = ws.identities.slice(0, 300).map((id: Identity) => ({
      id: `${ws.id}:${id.id}`,
      session_id: ws.id,
      identity_key: id.id,
      label: id.label,
      rotating: id.rotating,
      count: id.count,
      first_seen: new Date(id.firstSeen).toISOString(),
      last_seen: new Date(id.lastSeen).toISOString(),
      rssi_avg: id.count > 0 ? Math.round(id.rssiSum / id.count) : id.lastRssi,
      dist_last: id.distLast ?? null,
      dist_min: id.distMin ?? null,
      bearing: id.bearing ?? null,
      lat: id.lat ?? null,
      lon: id.lon ?? null,
      names: id.names.join(', '),
      updated_at: new Date(ws.updatedAt).toISOString(),
    }));
    if (rows.length > 0) {
      const { error: oErr } = await c.from('point_observations').upsert(rows, { onConflict: 'id' });
      if (oErr) return { ok: false, message: oErr.message };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

/** Admin pull: every session with its merged identities. */
export async function pullWorkspaces(url: string, anonKey: string): Promise<Workspace[]> {
  const c = getClient(url, anonKey);
  if (!c) return [];
  const { data: sessions, error: sErr } = await c.from('point_sessions').select('*');
  if (sErr || !sessions) throw new Error(sErr?.message ?? 'no sessions');
  const { data: obs, error: oErr } = await c.from('point_observations').select('*');
  if (oErr) throw new Error(oErr.message);
  const bySession = new Map<string, Workspace>();
  for (const s of sessions as Array<Record<string, unknown>>) {
    bySession.set(String(s.id), {
      id: String(s.id),
      operatorId: String(s.operator_id ?? ''),
      operatorName: String(s.operator_name ?? 'unknown'),
      deviceLabel: String(s.device_label ?? ''),
      updatedAt: s.updated_at ? Date.parse(String(s.updated_at)) : Date.now(),
      identities: [],
    });
  }
  for (const o of (obs ?? []) as Array<Record<string, unknown>>) {
    const ws = bySession.get(String(o.session_id));
    if (!ws) continue;
    ws.identities.push({
      id: String(o.identity_key ?? o.id),
      label: String(o.label ?? '?'),
      rotating: Boolean(o.rotating),
      tokenKind: 'payload',
      firstSeen: o.first_seen ? Date.parse(String(o.first_seen)) : Date.now(),
      lastSeen: o.last_seen ? Date.parse(String(o.last_seen)) : Date.now(),
      count: Number(o.count ?? 1),
      rssiSum: Number(o.rssi_avg ?? -80) * Number(o.count ?? 1),
      lastRssi: Number(o.rssi_avg ?? -80),
      distLast: o.dist_last != null ? Number(o.dist_last) : undefined,
      distMin: o.dist_min != null ? Number(o.dist_min) : undefined,
      bearing: o.bearing != null ? Number(o.bearing) : undefined,
      lat: o.lat != null ? Number(o.lat) : undefined,
      lon: o.lon != null ? Number(o.lon) : undefined,
      names: String(o.names ?? '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      source: 'live',
    });
  }
  return Array.from(bySession.values());
}

/** Live refresh channel for admin consoles. */
export function subscribeRealtime(
  url: string,
  anonKey: string,
  onChange: () => void,
): (() => void) | null {
  const c = getClient(url, anonKey);
  if (!c) return null;
  const channel = c
    .channel('point-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'point_observations' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'point_sessions' }, onChange)
    .subscribe();
  return () => {
    c.removeChannel(channel).catch(() => undefined);
  };
}
