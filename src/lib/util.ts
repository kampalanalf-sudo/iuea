// Small shared helpers

/** djb2 hash -> 8 hex chars, stable across sessions. */
export function hashStr(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

let uidCounter = 0;
export function uid(): string {
  uidCounter = (uidCounter + 1) % 1e6;
  return `${Date.now().toString(36)}-${uidCounter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * RSSI path-loss distance estimate.
 * With a calibrated TX power (iBeacon / Eddystone) use it as the 1 m reference,
 * otherwise fall back to a generic -59 dBm measured power. Exponent N = 2 free-space.
 */
export function rssiToDistance(rssi: number, txPower?: number, n = 2): number {
  const ref = typeof txPower === 'number' && txPower < 0 ? txPower : -59;
  if (rssi >= ref) return 0.1;
  const d = Math.pow(10, (ref - rssi) / (10 * n));
  return Math.min(Math.max(d, 0.1), 200);
}

export function fmtDist(m?: number): string {
  if (m == null || !isFinite(m)) return '—';
  if (m < 1) return `${Math.round(m * 100)} cm`;
  if (m < 100) return `${m.toFixed(1)} m`;
  return `${Math.round(m)} m`;
}

export function fmtTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour12: false });
}

export function fmtAgo(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

export function toHex(dv: DataView, start = 0, len?: number): string {
  const end = Math.min(dv.byteLength, start + (len ?? dv.byteLength - start));
  let out = '';
  for (let i = start; i < end; i++) out += dv.getUint8(i).toString(16).padStart(2, '0');
  return out;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

export function downloadFile(name: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
