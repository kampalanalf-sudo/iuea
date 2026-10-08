import { useMemo, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { useApp } from '@/hooks';
import { clearSession } from '@/lib/store';
import { avgRssi, sortIdentities } from '@/lib/ledger';
import { fmtAgo, fmtDist, fmtTime } from '@/lib/util';
import { Btn, Empty, Panel, inputCls } from './ui';

export function LedgerView() {
  const s = useApp();
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const all = sortIdentities(Object.values(s.identities));
    const needle = q.trim().toLowerCase();
    if (!needle) return all;
    return all.filter(
      (id) =>
        id.label.toLowerCase().includes(needle) ||
        id.names.some((n) => n.toLowerCase().includes(needle)) ||
        id.id.toLowerCase().includes(needle),
    );
  }, [s.identities, q]);

  return (
    <Panel
      title={`Identity ledger — ${rows.length} merged`}
      right={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className={`${inputCls} w-48 py-1.5 pl-8 text-xs`} placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Btn variant="danger" onClick={clearSession} className="px-2.5 py-1.5">
            <Trash2 size={13} />
          </Btn>
        </div>
      }
    >
      <p className="mb-3 text-[11px] text-slate-500">
        Repeats merge on iBeacon UUID+major/minor, Eddystone UID, device address and payload hashes. Rotating
        <span className="text-amber-400"> Person-N</span> labels stay separate unless a stable token matches. Bearings are
        source-reported only — ordinary BLE cannot measure direction without AoA hardware.
      </p>
      {rows.length === 0 ? (
        <Empty text="No identities yet. Scan live, or import CSV / JSON / screenshots." />
      ) : (
        <div className="max-h-[65vh] overflow-auto">
          <table className="w-full font-mono text-xs">
            <thead className="sticky top-0 bg-slate-900 text-left text-[10px] uppercase tracking-widest text-slate-500">
              <tr>
                <th className="py-1.5 pr-2">Label</th>
                <th className="py-1.5 pr-2">Token</th>
                <th className="py-1.5 pr-2">Adverts</th>
                <th className="py-1.5 pr-2">RSSI avg</th>
                <th className="py-1.5 pr-2">Dist last</th>
                <th className="py-1.5 pr-2">Dist min</th>
                <th className="py-1.5 pr-2">Bearing</th>
                <th className="py-1.5 pr-2">Names</th>
                <th className="py-1.5 pr-2">First</th>
                <th className="py-1.5">Last</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((id) => (
                <tr key={id.id} className="border-t border-slate-800/60 text-slate-300">
                  <td className={`py-1.5 pr-2 font-bold ${id.rotating ? 'text-amber-400' : 'text-emerald-400'}`}>{id.label}</td>
                  <td className="py-1.5 pr-2 text-slate-500">{id.tokenKind}</td>
                  <td className="py-1.5 pr-2">{id.count}</td>
                  <td className="py-1.5 pr-2">{avgRssi(id).toFixed(0)} dBm</td>
                  <td className="py-1.5 pr-2">{fmtDist(id.distLast)}</td>
                  <td className="py-1.5 pr-2">{fmtDist(id.distMin)}</td>
                  <td className="py-1.5 pr-2">{id.bearing != null ? `${id.bearing}°` : '—'}</td>
                  <td className="max-w-[180px] truncate py-1.5 pr-2">{id.names.join(', ') || '—'}</td>
                  <td className="py-1.5 pr-2 text-slate-500">{fmtTime(id.firstSeen)}</td>
                  <td className="py-1.5 text-slate-400">{fmtAgo(id.lastSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
