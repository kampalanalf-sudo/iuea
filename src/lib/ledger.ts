// Identity ledger — merges repeat observations onto stable tokens.
//
// Merge key priority:
//   1. iBeacon UUID + major + minor
//   2. Eddystone UID namespace + instance
//   3. device address / Web-Bluetooth device id
//   4. payload hash (manufacturer + service data)
//   5. otherwise a fresh rotating entry (Person-N) — rotating labels stay SEPARATE
//      unless a stable token above matches.

import type { Identity, Observation, TokenKind } from './types';
import { hashStr } from './util';

export interface TokenResult {
  id: string;
  kind: TokenKind;
  rotating: boolean;
}

export function tokenFor(o: Observation): TokenResult {
  if (o.ibeacon) {
    return { id: `iB:${o.ibeacon.uuid}:${o.ibeacon.major}:${o.ibeacon.minor}`, kind: 'ibeacon', rotating: false };
  }
  if (o.eddystone) {
    return { id: `eU:${o.eddystone.namespace}:${o.eddystone.instance}`, kind: 'eddystone', rotating: false };
  }
  if (o.address) {
    return { id: `aD:${o.address.toLowerCase()}`, kind: 'address', rotating: false };
  }
  if (o.payloadHash) {
    return { id: `pH:${o.payloadHash}`, kind: 'payload', rotating: false };
  }
  // No stable token at all: rotating label, kept separate per sighting fingerprint.
  return { id: `rot:${o.id}`, kind: 'rotating', rotating: true };
}

let personSeq = 0;
let bleSeq = 0;

export function nextLabel(rotating: boolean): string {
  if (rotating) {
    personSeq += 1;
    return `Person-${personSeq}`;
  }
  bleSeq += 1;
  return `BLE-${bleSeq.toString().padStart(2, '0')}`;
}

/** Merge one observation into the identity map (mutates + returns the map). */
export function mergeObservation(map: Record<string, Identity>, o: Observation): Record<string, Identity> {
  const t = tokenFor(o);
  let id = map[t.id];
  if (!id) {
    id = {
      id: t.id,
      label: nextLabel(t.rotating),
      rotating: t.rotating,
      tokenKind: t.kind,
      firstSeen: o.ts,
      lastSeen: o.ts,
      count: 0,
      rssiSum: 0,
      lastRssi: o.rssi,
      names: [],
      source: o.source,
    };
    map[t.id] = id;
  }
  id.count += 1;
  id.lastSeen = Math.max(id.lastSeen, o.ts);
  id.firstSeen = Math.min(id.firstSeen, o.ts);
  id.rssiSum += o.rssi;
  id.lastRssi = o.rssi;
  if (typeof o.dist === 'number') {
    id.distLast = o.dist;
    id.distMin = id.distMin === undefined ? o.dist : Math.min(id.distMin, o.dist);
  }
  // Bearings are source-reported only — never derived from signal geometry.
  if (typeof o.bearing === 'number' && isFinite(o.bearing)) id.bearing = o.bearing;
  if (typeof o.lat === 'number' && typeof o.lon === 'number') {
    id.lat = o.lat;
    id.lon = o.lon;
  }
  if (o.name && !id.names.includes(o.name)) {
    id.names.push(o.name);
    if (id.names.length > 5) id.names.shift();
  }
  return map;
}

/** Average RSSI for an identity. */
export function avgRssi(id: Identity): number {
  return id.count > 0 ? id.rssiSum / id.count : id.lastRssi;
}

/** Sort identities: most recently seen first. */
export function sortIdentities(list: Identity[]): Identity[] {
  return [...list].sort((a, b) => b.lastSeen - a.lastSeen);
}

/** Rebuild a ledger from scratch (used after imports). */
export function buildLedger(observations: Observation[]): Record<string, Identity> {
  const map: Record<string, Identity> = {};
  const sorted = [...observations].sort((a, b) => a.ts - b.ts);
  for (const o of sorted) mergeObservation(map, o);
  return map;
}

/** Compact fingerprint of the whole workspace (for change detection). */
export function workspaceFingerprint(map: Record<string, Identity>): string {
  const keys = Object.keys(map).sort();
  return hashStr(`${keys.length}:${keys.join(',')}:${keys.reduce((s, k) => s + map[k].count, 0)}`);
}
