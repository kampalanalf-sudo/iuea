// Import / export: POINT CSV, JSON observations, printable HTML report.

import type { Identity, Observation } from './types';
import { avgRssi, sortIdentities } from './ledger';
import { fmtDist } from './util';

export const CSV_HEADER = 'name,dist,rssi,bearing,timestamp,lat,lon';

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** POINT CSV: name,dist,rssi,bearing,timestamp,lat,lon */
export function parseCsv(text: string): Observation[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  let start = 0;
  let cols = splitCsvLine(lines[0]).map((c) => c.toLowerCase());
  if (!cols.includes('rssi') && !cols.includes('name')) {
    cols = ['name', 'dist', 'rssi', 'bearing', 'timestamp', 'lat', 'lon'];
  } else {
    start = 1;
  }
  const idx = (n: string) => cols.indexOf(n);
  const obs: Observation[] = [];
  for (let i = start; i < lines.length; i++) {
    const f = splitCsvLine(lines[i]);
    const num = (n: string): number | undefined => {
      const p = idx(n);
      if (p < 0 || f[p] === undefined || f[p] === '') return undefined;
      const v = Number(f[p]);
      return isFinite(v) ? v : undefined;
    };
    const ts = num('timestamp');
    obs.push({
      id: `csv-${i}-${Math.random().toString(36).slice(2, 7)}`,
      ts: ts !== undefined ? (ts > 1e12 ? ts : ts * 1000) : Date.now(),
      source: 'csv',
      name: idx('name') >= 0 ? f[idx('name')] || undefined : undefined,
      rssi: num('rssi') ?? -80,
      dist: num('dist'),
      bearing: num('bearing'),
      lat: num('lat'),
      lon: num('lon'),
    });
  }
  return obs;
}

export function parseJsonObs(text: string): Observation[] {
  const data = JSON.parse(text) as unknown;
  const arr = Array.isArray(data) ? data : (data as { observations?: unknown[] }).observations;
  if (!Array.isArray(arr)) throw new Error('Expected a JSON array or {observations: []}');
  return arr.map((row, i) => {
    const r = row as Record<string, unknown>;
    const ts = typeof r.ts === 'number' ? r.ts : typeof r.timestamp === 'number' ? r.timestamp : Date.now();
    return {
      id: `json-${i}-${Math.random().toString(36).slice(2, 7)}`,
      ts,
      source: 'json' as const,
      name: typeof r.name === 'string' ? r.name : undefined,
      address: typeof r.address === 'string' ? r.address : undefined,
      deviceId: typeof r.deviceId === 'string' ? r.deviceId : undefined,
      rssi: typeof r.rssi === 'number' ? r.rssi : -80,
      dist: typeof r.dist === 'number' ? r.dist : undefined,
      bearing: typeof r.bearing === 'number' ? r.bearing : undefined,
      lat: typeof r.lat === 'number' ? r.lat : undefined,
      lon: typeof r.lon === 'number' ? r.lon : undefined,
    };
  });
}

export function toCsv(observations: Observation[]): string {
  const rows = [CSV_HEADER];
  for (const o of observations) {
    rows.push(
      [
        o.name ? `"${o.name.replace(/"/g, '""')}"` : '',
        o.dist?.toFixed(2) ?? '',
        String(o.rssi),
        o.bearing ?? '',
        String(Math.round(o.ts / 1000)),
        o.lat ?? '',
        o.lon ?? '',
      ].join(','),
    );
  }
  return rows.join('\n');
}

export function toJson(observations: Observation[]): string {
  return JSON.stringify({ exportedAt: new Date().toISOString(), observations }, null, 2);
}

export function toHtmlReport(identities: Identity[], operator: string): string {
  const rows = sortIdentities(identities)
    .map(
      (id) => `<tr>
        <td>${id.label}</td>
        <td>${id.tokenKind}</td>
        <td>${id.count}</td>
        <td>${avgRssi(id).toFixed(0)} dBm</td>
        <td>${fmtDist(id.distLast)}</td>
        <td>${fmtDist(id.distMin)}</td>
        <td>${id.bearing != null ? id.bearing + '°' : '—'}</td>
        <td>${id.names.join(', ') || '—'}</td>
        <td>${new Date(id.firstSeen).toLocaleString()}</td>
        <td>${new Date(id.lastSeen).toLocaleString()}</td>
      </tr>`,
    )
    .join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><title>ProxiCore POINT report</title>
<style>
  body{font-family:ui-monospace,Menlo,monospace;margin:2rem;color:#0b1219}
  table{border-collapse:collapse;width:100%}td,th{border:1px solid #94a3b8;padding:4px 8px;font-size:12px}
  th{background:#e2e8f0;text-align:left}
  @media print{button{display:none}}
</style></head><body>
<h1>ProxiCore POINT — identity ledger</h1>
<p>Operator: <b>${operator}</b> · generated ${new Date().toLocaleString()} · ${identities.length} merged identities</p>
<p><small>Bearings shown are source-reported only. Broadcast names are not proof of a person.</small></p>
<table>
<tr><th>Label</th><th>Token</th><th>Adverts</th><th>RSSI avg</th><th>Dist last</th><th>Dist min</th><th>Bearing</th><th>Names</th><th>First seen</th><th>Last seen</th></tr>
${rows}
</table>
<button onclick="window.print()">Print</button>
</body></html>`;
}
