import { useState } from 'react';
import { BookOpen, Printer } from 'lucide-react';
import { Btn, Panel } from './ui';

const OPERATOR = [
  ['Starting a session', 'Log in as Analyst. Press SCAN and approve the Bluetooth (and location, on Android) prompts. The radar shows every live advertisement — no simulated devices are ever generated.'],
  ['Reading distances', 'Distance comes from the RSSI path-loss model. When a beacon carries calibrated TX power (iBeacon / Eddystone) that value is used as the 1 m reference; otherwise a generic −59 dBm reference applies. Tune N and measured power in Settings for your environment.'],
  ['Bearings & the radar', 'Live bearings come from the console\'s own fused compass: each advert is tagged with the heading the phone was pointing at the moment of sighting (toggle in Settings). Imported CSV/JSON rows carry their own bearings. The live radar plots distance × bearing; hollow blips have signal but no direction yet — sweep the phone toward the target to capture one. POINT never derives a bearing from signal geometry: ordinary BLE has no AoA.'],
  ['Identity ledger', 'Repeats merge automatically: iBeacon UUID+major/minor, Eddystone UID namespace+instance, device address, then payload hashes. Devices with no stable token get rotating Person-N labels and stay separate — never merge them by hand on name alone.'],
  ['Imports', 'POINT CSV (name,dist,rssi,bearing,timestamp,lat,lon), JSON observation arrays, and screenshots via OCR. OCR output is never auto-ingested — you review and edit the candidate rows first.'],
  ['Exports', 'CSV and JSON carry raw observations; the printable HTML report carries the merged ledger. Coordinates are scanner positions, not target GPS.'],
  ['Publishing to the cloud', 'Configure Supabase once in Settings. From then on the console auto-pushes its workspace ~1.5 s after every change so Admin and P.O.I.N.T. see it.'],
  ['Discipline', 'A broadcast name is not proof of a person. Never present a Person-N label as personal identification; it marks an unattributed rotating device.'],
];

const ADMIN = [
  ['Logging in', 'Choose the Admin role. Admins keep their own scan sessions too, but additionally review every published workspace on the device and in the shared cloud.'],
  ['P.O.I.N.T. map', 'The operational map juxtaposes combined identities from every scanning console over OpenStreetMap around your live GPS. Amber markers are rotating identities; green markers carry stable tokens. Dashed rays are source-reported bearings.'],
  ['Refresh model', 'Workspaces refresh every 15 s and instantly via Supabase realtime when available. Manual refresh is on the map header.'],
  ['Supabase setup', 'Create a project, run supabase/schema.sql in the SQL Editor (creates point_operators, point_sessions, point_observations with open prototype policies), then distribute URL + anon key to operators.'],
  ['Groq analysis', 'Enter a Groq key (per user) and run analysis over the session snapshot: llama-3.3-70b-versatile ranks candidates, flags rotating devices and suggests operator actions.'],
  ['Evidence hygiene', 'Export the merged ledger as printable HTML for the record. Note scanner positions separately from any claimed target position.'],
];

export function ManualsView() {
  const [tab, setTab] = useState<'operator' | 'admin'>('operator');
  const rows = tab === 'operator' ? OPERATOR : ADMIN;

  return (
    <Panel
      title="In-app manuals"
      right={
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-slate-700">
            {(['operator', 'admin'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider ${tab === t ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <Btn className="px-2.5 py-1.5" onClick={() => window.print()}>
            <Printer size={13} />
          </Btn>
        </div>
      }
    >
      <div className="mb-4 flex items-center gap-2 text-slate-400">
        <BookOpen size={15} />
        <span className="font-mono text-xs uppercase tracking-widest">{tab === 'operator' ? 'Operator Manual' : 'Admin Manual'} — printable</span>
      </div>
      <div className="space-y-4">
        {rows.map(([h, body]) => (
          <article key={h} className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <h3 className="font-mono text-sm font-bold text-emerald-400">{h}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{body}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}
