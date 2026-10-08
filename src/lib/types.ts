// Shared types for ProxiCore POINT

export type Shell = 'web' | 'apk' | 'exe';

export interface IBeaconId {
  uuid: string;
  major: number;
  minor: number;
}

export interface EddystoneUid {
  namespace: string;
  instance: string;
}

export type ObsSource = 'live' | 'csv' | 'json' | 'ocr';

/** One BLE advertisement observation (live or imported). */
export interface Observation {
  id: string;
  ts: number; // epoch ms
  source: ObsSource;
  name?: string;
  address?: string; // MAC (native) or opaque device id (web)
  deviceId?: string;
  rssi: number;
  txPower?: number; // calibrated TX power when present
  dist?: number; // metres, RSSI path-loss estimate
  bearing?: number; // degrees — source-reported only (never derived)
  lat?: number; // scanner position
  lon?: number;
  manufacturer?: string; // trimmed payload summary
  ibeacon?: IBeaconId;
  eddystone?: EddystoneUid;
  payloadHash?: string;
}

/** Stable-token classification used by the identity ledger. */
export type TokenKind = 'ibeacon' | 'eddystone' | 'address' | 'payload' | 'rotating';

export interface Identity {
  id: string; // fingerprint / merge key
  label: string; // Person-N or BLE-N (rotating vs stable)
  rotating: boolean;
  tokenKind: TokenKind;
  firstSeen: number;
  lastSeen: number;
  count: number;
  rssiSum: number;
  distLast?: number;
  distMin?: number;
  bearing?: number; // last source-reported bearing
  lat?: number; // last scanner position
  lon?: number;
  names: string[];
  lastRssi: number;
  source: ObsSource;
}

/** A scanning console's published workspace (for Admin / P.O.I.N.T.). */
export interface Workspace {
  id: string;
  operatorId: string;
  operatorName: string;
  deviceLabel: string;
  updatedAt: number;
  identities: Identity[];
}

export interface User {
  name: string;
  role: 'analyst' | 'admin';
}

export type ViewId =
  | 'scan'
  | 'ledger'
  | 'map'
  | 'analysis'
  | 'io'
  | 'settings'
  | 'manuals'
  | 'native';
