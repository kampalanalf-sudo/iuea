import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, RefreshCw } from 'lucide-react';
import { useApp } from '@/hooks';
import { fmtAgo, fmtDist } from '@/lib/util';
import type { Identity, Workspace } from '@/lib/types';
import { Btn, Empty, Panel } from './ui';

interface MapPoint {
  key: string;
  label: string;
  lat: number;
  lon: number;
  bearing?: number;
  dist?: number;
  operator: string;
  rotating: boolean;
  lastSeen: number;
  count: number;
}

export function MapView() {
  const s = useApp();
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const meRef = useRef<L.CircleMarker | null>(null);
  const [tick, setTick] = useState(0);

  // Combined identities: admin sees every published workspace (cloud + this console).
  const points = useMemo<MapPoint[]>(() => {
    const out: MapPoint[] = [];
    const push = (ws: Workspace, operator: string) => {
      for (const id of ws.identities) {
        if (typeof id.lat !== 'number' || typeof id.lon !== 'number') continue;
        out.push({
          key: `${ws.id}:${id.id}`,
          label: id.label,
          lat: id.lat,
          lon: id.lon,
          bearing: id.bearing,
          dist: id.distLast,
          operator,
          rotating: id.rotating,
          lastSeen: id.lastSeen,
          count: id.count,
        });
      }
    };
    if (s.user) {
      push({ id: 'local', operatorId: '', operatorName: s.user.name, deviceLabel: 'this console', updatedAt: Date.now(), identities: Object.values(s.identities) as Identity[] }, `${s.user.name} (local)`);
      for (const ws of s.cloudWorkspaces) push(ws, ws.operatorName);
    }
    return out;
  }, [s.identities, s.cloudWorkspaces, s.user]);

  useEffect(() => {
    if (!divRef.current || mapRef.current) return;
    const map = L.map(divRef.current, { zoomControl: true }).setView([0.3476, 32.5825], 15); // Kampala fallback
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    // Center on admin GPS once available.
    const t = setInterval(() => {
      if (!mapRef.current) return;
      const ev = new CustomEvent('point-center-check');
      divRef.current?.dispatchEvent(ev);
    }, 5000);
    return () => {
      clearInterval(t);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Render markers whenever points or GPS fixes change.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    let centered = false;
    for (const p of points) {
      const color = p.rotating ? '#f59e0b' : '#10b981';
      const m = L.circleMarker([p.lat, p.lon], {
        radius: Math.min(11, 5 + Math.log2(1 + p.count)),
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.25,
      })
        .bindPopup(
          `<b style="font-family:monospace">${p.label}</b><br/>operator: ${p.operator}<br/>adverts: ${p.count} · seen ${fmtAgo(p.lastSeen)}${p.dist != null ? `<br/>dist ${fmtDist(p.dist)}` : ''}${p.bearing != null ? `<br/>bearing ${p.bearing}° (source-reported)` : ''}`,
        )
        .addTo(layer);
      // Source-reported bearing ray (never derived).
      if (p.bearing != null && p.dist != null) {
        const rad = (p.bearing * Math.PI) / 180;
        const dLat = (p.dist * Math.cos(rad)) / 111320;
        const dLon = (p.dist * Math.sin(rad)) / (111320 * Math.cos((p.lat * Math.PI) / 180) || 1);
        L.polyline(
          [
            [p.lat, p.lon],
            [p.lat + dLat, p.lon + dLon],
          ],
          { color, weight: 1.5, dashArray: '4 4', opacity: 0.7 },
        ).addTo(layer);
      }
      if (!centered) {
        map.setView([p.lat, p.lon], Math.max(map.getZoom(), 16));
        centered = true;
      }
    }
  }, [points, tick]);

  // Admin live GPS marker.
  useEffect(() => {
    const t = setInterval(() => {
      setTick((x) => x + 1);
      const map = mapRef.current;
      if (!map) return;
      import('@/lib/geo').then(({ getFix }) => {
        const fix = getFix();
        if (!fix) return;
        if (!meRef.current) {
          meRef.current = L.circleMarker([fix.lat, fix.lon], {
            radius: 7,
            color: '#38bdf8',
            weight: 2,
            fillColor: '#38bdf8',
            fillOpacity: 0.5,
          })
            .bindPopup('Admin console GPS')
            .addTo(map);
          map.setView([fix.lat, fix.lon], 16);
        } else {
          meRef.current.setLatLng([fix.lat, fix.lon]);
        }
      });
    }, 4000);
    return () => clearInterval(t);
  }, []);

  if (s.user?.role !== 'admin') {
    return <Empty text="P.O.I.N.T. operational map is admin-only. Log in as Admin to review every published workspace." />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <Panel
        title="P.O.I.N.T. operational map — OpenStreetMap"
        right={
          <Btn className="px-2.5 py-1.5" onClick={() => setTick((x) => x + 1)}>
            <RefreshCw size={13} /> Refresh
          </Btn>
        }
      >
        <div ref={divRef} className="h-[62vh] w-full overflow-hidden rounded-lg border border-slate-800" />
        <p className="mt-2 font-mono text-[10px] text-slate-500">
          Cloud refresh: 15 s + realtime. Markers: amber = rotating identity, green = stable token. Bearing rays are source-reported only.
        </p>
      </Panel>
      <Panel title={`Combined workspaces (${s.cloudWorkspaces.length + 1})`}>
        <ul className="max-h-[62vh] space-y-2 overflow-auto">
          <li className="rounded-lg border border-emerald-700/40 bg-emerald-500/5 p-3">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-emerald-400">{s.user?.name} — this console</span>
              <span className="text-slate-500">{Object.keys(s.identities).length} ids</span>
            </div>
            <div className="mt-1 font-mono text-[10px] text-slate-500">local session · live</div>
          </li>
          {s.cloudWorkspaces.map((ws) => (
            <li key={ws.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="font-bold text-slate-200">{ws.operatorName}</span>
                <span className="text-slate-500">{ws.identities.length} ids</span>
              </div>
              <div className="mt-1 flex items-center gap-1 font-mono text-[10px] text-slate-500">
                <MapPin size={10} /> {ws.deviceLabel} · updated {fmtAgo(ws.updatedAt)}
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
