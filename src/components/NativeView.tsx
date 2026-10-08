import { Monitor, Smartphone } from 'lucide-react';
import { useApp } from '@/hooks';
import { SHELL, SHELL_LABEL } from '@/lib/shell';
import { Empty, Panel } from './ui';

// The in-app 15-row Web vs APK vs EXE capability matrix.
const MATRIX: Array<[string, string, string, string]> = [
  ['Scan engine', 'Web Bluetooth requestLEScan', 'Capacitor BLE (unfiltered)', 'Web Bluetooth / node adapter'],
  ['Scan filter', 'Browser-restricted', 'Unfiltered, every packet', 'Browser-restricted'],
  ['MAC addresses', 'Hidden (opaque IDs)', 'Real MACs', 'Hidden (opaque IDs)'],
  ['AD structures', 'Partial', 'Complete', 'Partial'],
  ['Manufacturer data', 'Flag-gated', 'Always', 'Flag-gated'],
  ['Background scanning', 'No', 'Yes (foreground service)', 'No'],
  ['iBeacon / Eddystone parse', 'Yes', 'Yes', 'Yes'],
  ['Distance model', 'RSSI path-loss', 'RSSI path-loss + calibration', 'RSSI path-loss'],
  ['Bearing source', 'Imported only', 'Fused compass + imports', 'Imported only'],
  ['GPS', 'Browser geolocation', 'Fused location (high accuracy)', 'OS geolocation'],
  ['Offline use', 'Yes (local-first)', 'Yes (local-first)', 'Yes (local-first)'],
  ['Install', 'HTTPS URL', 'APK sideload / store', 'Setup EXE'],
  ['BLE permission UX', 'Per-gesture prompt', 'OS nearby-device prompt', 'Per-gesture prompt'],
  ['HTTPS requirement', 'Required', 'None', 'None'],
  ['Best for', 'Quick analysis', 'Field operations', 'Control-room consoles'],
];

export function NativeView() {
  const s = useApp();
  return (
    <div className="space-y-4">
      <Panel title="Native builds — one codebase, three shells">
        <p className="text-sm text-slate-300">
          The app auto-detects its shell (<span className="font-mono text-emerald-400">src/lib/shell.ts</span>) and picks the
          richest BLE engine. You are currently running the <b>{SHELL_LABEL[SHELL]}</b> shell.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-emerald-400">
              <Smartphone size={15} /> Android APK (Capacitor)
            </div>
            <ol className="mt-2 list-decimal space-y-1 pl-5 font-mono text-[11px] text-slate-400">
              <li>npm run build</li>
              <li>npx cap add android (once)</li>
              <li>npx cap sync android</li>
              <li>cd android && ./gradlew assembleDebug</li>
              <li>→ android/app/build/outputs/apk/debug/app-debug.apk</li>
            </ol>
            <p className="mt-2 text-[11px] text-slate-500">CI: .github/workflows/build-android.yml produces app-debug.apk on every push.</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-sky-400">
              <Monitor size={15} /> Windows EXE (Electron)
            </div>
            <ol className="mt-2 list-decimal space-y-1 pl-5 font-mono text-[11px] text-slate-400">
              <li>npm run build</li>
              <li>npx electron-builder --win</li>
              <li>→ dist-electron ProxiCore-POINT-Setup-*.exe</li>
            </ol>
            <p className="mt-2 text-[11px] text-slate-500">electron/main.cjs + electron/preload.cjs + electron-builder.yml. CI: build-windows.yml.</p>
          </div>
        </div>
      </Panel>

      <Panel title="Web vs APK vs EXE — capability matrix">
        <div className="overflow-auto">
          <table className="w-full font-mono text-xs">
            <thead className="text-left text-[10px] uppercase tracking-widest text-slate-500">
              <tr>
                <th className="py-1.5 pr-3">Capability</th>
                <th className="py-1.5 pr-3">Web</th>
                <th className="py-1.5 pr-3 text-emerald-400">APK</th>
                <th className="py-1.5">EXE</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX.map(([cap, web, apk, exe]) => (
                <tr key={cap} className="border-t border-slate-800/60 text-slate-300">
                  <td className="py-1.5 pr-3 text-slate-400">{cap}</td>
                  <td className="py-1.5 pr-3">{web}</td>
                  <td className="py-1.5 pr-3 text-emerald-300">{apk}</td>
                  <td className="py-1.5">{exe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          {s.user ? (
            <p className="text-[11px] text-slate-500">
              Does the APK give richer data? <b className="text-emerald-400">Yes, substantially</b> — unfiltered scan, every
              packet, real MACs, complete AD structures, background scanning, fused GPS + compass, no HTTPS/flag limits.
            </p>
          ) : (
            <Empty text="Log in to start scanning." />
          )}
        </div>
      </Panel>
    </div>
  );
}
