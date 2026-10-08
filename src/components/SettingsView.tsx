import { useState } from 'react';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useApp } from '@/hooks';
import { runCloudTest, updateSettings } from '@/lib/store';
import { fmtAgo } from '@/lib/util';
import { Btn, Field, Panel, inputCls } from './ui';

export function SettingsView() {
  const s = useApp();
  const [url, setUrl] = useState(s.settings.supabaseUrl);
  const [key, setKey] = useState(s.settings.supabaseAnonKey);
  const [groq, setGroq] = useState(s.settings.groqKey);
  const [n, setN] = useState(String(s.settings.pathLossN));
  const [mp, setMp] = useState(String(s.settings.measuredPower));
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);

  const save = () => {
    updateSettings({
      supabaseUrl: url.trim(),
      supabaseAnonKey: key.trim(),
      groqKey: groq.trim(),
      pathLossN: Number(n) > 0 ? Number(n) : 2,
      measuredPower: Number(mp) < 0 ? Number(mp) : -59,
    });
    setTestMsg('Saved.');
  };

  const test = async () => {
    updateSettings({ supabaseUrl: url.trim(), supabaseAnonKey: key.trim() });
    setTesting(true);
    setTestMsg(null);
    const r = await runCloudTest();
    setTestMsg(r.message);
    setTesting(false);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Shared cloud (Supabase) — all users, one backend">
        <div className="space-y-3">
          <Field label="Project URL" hint="supabase.com → project → Settings → API">
            <input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" />
          </Field>
          <Field label="anon public key">
            <input className={inputCls} value={key} onChange={(e) => setKey(e.target.value)} placeholder="eyJhbGciOi…" />
          </Field>
          <div className="flex items-center gap-2">
            <Btn onClick={() => void test()} disabled={testing}>
              {testing ? <Loader2 size={14} className="animate-spin" /> : <Cloud size={14} />} Test connection
            </Btn>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${
                s.cloud === 'ok'
                  ? 'border-emerald-600/50 bg-emerald-500/10 text-emerald-400'
                  : s.cloud === 'off'
                    ? 'border-slate-700 bg-slate-800/50 text-slate-500'
                    : s.cloud === 'error'
                      ? 'border-rose-600/50 bg-rose-500/10 text-rose-400'
                      : 'border-sky-600/50 bg-sky-500/10 text-sky-400'
              }`}
            >
              {s.cloud === 'off' ? <CloudOff size={11} /> : <Cloud size={11} />} {s.cloud}
              {s.lastSyncAt ? ` · synced ${fmtAgo(s.lastSyncAt)}` : ''}
            </span>
          </div>
          {testMsg && <p className="font-mono text-xs text-slate-300">{testMsg}</p>}
          {s.cloudMessage && <p className="font-mono text-xs text-rose-300">{s.cloudMessage}</p>}
          <ol className="list-decimal space-y-1 pl-5 text-[11px] text-slate-500">
            <li>Create a free project at supabase.com → copy Project URL + anon public key.</li>
            <li>SQL Editor → paste and Run <span className="font-mono text-slate-300">supabase/schema.sql</span>.</li>
            <li>Paste URL + key here → Save → Test connection.</li>
            <li>Each console auto-pushes its workspace ~1.5 s after every change; Admin refreshes every 15 s + realtime.</li>
          </ol>
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel title="Analysis">
          <Field label="Groq API key" hint="Used for llama-3.3-70b-versatile analysis. Stored only on this device.">
            <input className={inputCls} type="password" value={groq} onChange={(e) => setGroq(e.target.value)} placeholder="gsk_…" />
          </Field>
        </Panel>

        <Panel title="Bearing">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-emerald-500"
              checked={s.settings.captureBearing}
              onChange={(e) => updateSettings({ captureBearing: e.target.checked })}
            />
            <span>
              <span className="block font-mono text-xs font-bold text-slate-200">Capture live bearing from device compass</span>
              <span className="mt-0.5 block text-[11px] text-slate-500">
                Tags each live advert with the heading this console was pointing at the moment of sighting. Sweep the phone
                toward a target to place it on the radar. Not AoA — ordinary BLE cannot measure direction by itself.
              </span>
            </span>
          </label>
        </Panel>

        <Panel title="RF model">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Path-loss exponent N" hint="2 = free space, 2.7–3 indoors">
              <input className={inputCls} value={n} onChange={(e) => setN(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Measured power @1 m (dBm)" hint="Fallback when no calibrated TX power">
              <input className={inputCls} value={mp} onChange={(e) => setMp(e.target.value)} inputMode="numeric" />
            </Field>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Distance = 10^((P<sub>ref</sub> − RSSI) / (10·N)). iBeacon / Eddystone calibration overrides the reference power.
          </p>
        </Panel>

        <Panel title="This console">
          <div className="space-y-1 font-mono text-xs text-slate-400">
            <p>session id: <span className="text-slate-200">{s.settings.sessionId}</span></p>
            <p>operator: <span className="text-slate-200">{s.user?.name} ({s.user?.role})</span></p>
          </div>
          <div className="mt-3 flex justify-end">
            <Btn variant="primary" onClick={save}>Save settings</Btn>
          </div>
        </Panel>
      </div>
    </div>
  );
}
