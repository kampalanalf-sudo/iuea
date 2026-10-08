import { useEffect, useState } from 'react';
import { AlertTriangle, Play, Radar, Square } from 'lucide-react';
import { useApp } from '@/hooks';
import { startScan, stopScan } from '@/lib/store';
import { sortIdentities, avgRssi } from '@/lib/ledger';
import { SHELL, SHELL_LABEL } from '@/lib/shell';
import { fmtAgo, fmtDist, fmtTime } from '@/lib/util';
import { Btn, Empty, Panel, Stat } from './ui';
import { RadarView } from './RadarView';

export function ScanView() {
  const s = useApp();
  const [rate, setRate] = useState(0);

  useEffect(() => {
    let prev = s.obsCount;
    const t = setInterval(() => {
      setRate(Math.max(0, s.obsCount - prev));
      prev = s.obsCount;
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.obsCount]);

  const recent = s.observations.slice(-25).reverse();
  const top = sortIdentities(Object.values(s.identities)).slice(0, 8);

  return (
    <div className="space-y-4">
      <RadarView />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <Panel title="Production radar — no simulated devices">
          <div className="flex flex-wrap items-center gap-3">
            {s.scanning ? (
              <Btn variant="danger" onClick={stopScan}>
                <Square size={14} /> Stop
              </Btn>
            ) : (
              <Btn variant="primary" onClick={() => void startScan()}>
                <Play size={14} /> Scan
              </Btn>
            )}
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-widest ${s.scanning ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 bg-slate-800/50 text-slate-400'}`}>
              <Radar size={12} className={s.scanning ? 'animate-pulse' : ''} />
              {s.scanning ? 'Scanning live BLE' : 'Standby'}
            </span>
            <span className="font-mono text-[11px] text-slate-500">shell: {SHELL_LABEL[SHELL]}</span>
          </div>

          {s.scanError && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-600/40 bg-amber-500/10 p-3 text-sm text-amber-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Scanner unavailable</p>
                <p className="mt-1 font-mono text-xs text-amber-200/80">{s.scanError}</p>
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Advertisements" value={String(s.obsCount)} accent />
            <Stat label="Rate /s" value={String(rate)} />
            <Stat label="Identities" value={String(Object.keys(s.identities).length)} />
            <Stat label="Last advert" value={s.lastObsAt ? fmtTime(s.lastObsAt) : '—'} />
          </div>
        </Panel>

        <Panel title="Live advertisements">
          {recent.length === 0 ? (
            <Empty text={s.scanning ? 'Listening… advertisements appear here in real time.' : 'Press Scan to start capturing live BLE advertisements.'} />
          ) : (
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full font-mono text-xs">
                <thead className="sticky top-0 bg-slate-900 text-left text-[10px] uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="py-1.5 pr-2">Time</th>
                    <th className="py-1.5 pr-2">Name</th>
                    <th className="py-1.5 pr-2">RSSI</th>
                    <th className="py-1.5 pr-2">Dist</th>
                    <th className="py-1.5">Beacon</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id} className="border-t border-slate-800/60 text-slate-300">
                      <td className="py-1.5 pr-2 text-slate-500">{fmtTime(o.ts)}</td>
                      <td className="max-w-[160px] truncate py-1.5 pr-2">{o.name ?? <span className="text-slate-600">—</span>}</td>
                      <td className="py-1.5 pr-2">{o.rssi} dBm</td>
                      <td className="py-1.5 pr-2 text-emerald-400">{fmtDist(o.dist)}</td>
                      <td className="py-1.5 text-slate-500">
                        {o.ibeacon ? `iBeacon ${o.ibeacon.major}/${o.ibeacon.minor}` : o.eddystone ? 'Eddystone UID' : o.manufacturer ? 'payload' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Top identities">
        {top.length === 0 ? (
          <Empty text="Merged identities appear here — repeats collapse onto stable tokens." />
        ) : (
          <ul className="space-y-2">
            {top.map((id) => (
              <li key={id.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-sm font-bold ${id.rotating ? 'text-amber-400' : 'text-emerald-400'}`}>{id.label}</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{id.tokenKind}</span>
                </div>
                <div className="mt-1.5 grid grid-cols-3 gap-1 font-mono text-[11px] text-slate-400">
                  <span>{id.count} adv</span>
                  <span>{avgRssi(id).toFixed(0)} dBm</span>
                  <span className="text-emerald-400">{fmtDist(id.distLast)}</span>
                </div>
                <div className="mt-1 font-mono text-[10px] text-slate-500">
                  {id.names.length ? id.names.join(', ') : 'no broadcast name'} · {fmtAgo(id.lastSeen)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      </div>
    </div>
  );
}
