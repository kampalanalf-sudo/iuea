import { motion } from 'motion/react';
import {
  ArrowDownUp,
  BookOpen,
  Brain,
  Cloud,
  CloudOff,
  LogOut,
  Map as MapIcon,
  Radar,
  Settings,
  Smartphone,
  Users,
} from 'lucide-react';
import { useApp } from '@/hooks';
import { logout, setView } from '@/lib/store';
import type { ViewId } from '@/lib/types';
import { LoginView } from '@/components/LoginView';
import { ScanView } from '@/components/ScanView';
import { LedgerView } from '@/components/LedgerView';
import { MapView } from '@/components/MapView';
import { AnalysisView } from '@/components/AnalysisView';
import { IoView } from '@/components/IoView';
import { SettingsView } from '@/components/SettingsView';
import { ManualsView } from '@/components/ManualsView';
import { NativeView } from '@/components/NativeView';

const NAV: Array<{ id: ViewId; label: string; icon: typeof Radar; adminOnly?: boolean }> = [
  { id: 'scan', label: 'Scan', icon: Radar },
  { id: 'ledger', label: 'Identities', icon: Users },
  { id: 'map', label: 'P.O.I.N.T. map', icon: MapIcon, adminOnly: true },
  { id: 'analysis', label: 'Analysis', icon: Brain },
  { id: 'io', label: 'Import / Export', icon: ArrowDownUp },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'manuals', label: 'Manuals', icon: BookOpen },
  { id: 'native', label: 'APK / EXE', icon: Smartphone },
];

function CloudBadge() {
  const s = useApp();
  const styles: Record<string, string> = {
    ok: 'border-emerald-600/50 bg-emerald-500/10 text-emerald-400',
    syncing: 'border-sky-600/50 bg-sky-500/10 text-sky-400',
    error: 'border-rose-600/50 bg-rose-500/10 text-rose-400',
    idle: 'border-slate-700 bg-slate-800/50 text-slate-400',
    off: 'border-slate-800 bg-slate-900/50 text-slate-600',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${styles[s.cloud]}`} title={s.cloudMessage || `shared cloud: ${s.cloud}`}>
      {s.cloud === 'off' ? <CloudOff size={11} /> : <Cloud size={11} />}
      {s.cloud === 'off' ? 'local-first' : s.cloud}
    </span>
  );
}

export default function App() {
  const s = useApp();
  if (!s.user) return <LoginView />;

  const nav = NAV.filter((n) => !n.adminOnly || s.user?.role === 'admin');
  const view =
    s.view === 'scan' ? <ScanView /> :
    s.view === 'ledger' ? <LedgerView /> :
    s.view === 'map' ? <MapView /> :
    s.view === 'analysis' ? <AnalysisView /> :
    s.view === 'io' ? <IoView /> :
    s.view === 'settings' ? <SettingsView /> :
    s.view === 'manuals' ? <ManualsView /> :
    <NativeView />;

  return (
    <div className="flex min-h-screen">
      <aside className="print-hidden fixed inset-y-0 left-0 z-20 flex w-56 flex-col border-r border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="flex items-center gap-2.5 border-b border-slate-800 px-4 py-4">
          <span className="rounded-lg bg-emerald-500/15 p-2 text-emerald-400">
            <Radar size={18} />
          </span>
          <div className="min-w-0">
            <div className="truncate font-mono text-sm font-bold text-slate-100">ProxiCore POINT</div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">Person of Interest</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-auto p-3">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = s.view === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors ${
                  active ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Icon size={14} /> {n.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-slate-800 p-3">
          <div className="mb-2 px-1 font-mono text-[10px] uppercase tracking-widest text-slate-500">
            {s.user.name} · {s.user.role}
          </div>
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 font-mono text-xs text-slate-400 hover:bg-slate-800/60 hover:text-rose-400">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <div className="ml-56 flex min-h-screen flex-1 flex-col">
        <header className="print-hidden sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-6 py-3 backdrop-blur">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
            {s.scanning ? <span className="text-emerald-400">● live scan · </span> : null}session {s.settings.sessionId}
          </div>
          <CloudBadge />
        </header>
        <main className="flex-1 p-6">
          <motion.div key={s.view} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
            {view}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
