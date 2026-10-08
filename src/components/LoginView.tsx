import { useState } from 'react';
import { Radar, Shield, UserRound } from 'lucide-react';
import { login } from '@/lib/store';
import { Btn, inputCls } from './ui';

export function LoginView() {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'analyst' | 'admin'>('analyst');

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur"
        onSubmit={(e) => {
          e.preventDefault();
          login(name, role);
        }}
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded-xl bg-emerald-500/15 p-3 text-emerald-400">
            <Radar size={26} />
          </span>
          <div>
            <h1 className="font-mono text-lg font-bold tracking-wide text-slate-100">ProxiCore POINT</h1>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">Person Of Interest Tracking Tool</p>
          </div>
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.15em] text-slate-400">Operator name</span>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. analysis-01" autoFocus />
        </label>

        <div className="mb-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRole('analyst')}
            className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${
              role === 'analyst' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/40 hover:border-slate-500'
            }`}
          >
            <UserRound size={16} className="text-emerald-400" />
            <span className="font-mono text-xs font-bold text-slate-100">Analyst</span>
            <span className="text-[11px] text-slate-400">Own scan sessions on this device.</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${
              role === 'admin' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/40 hover:border-slate-500'
            }`}
          >
            <Shield size={16} className="text-emerald-400" />
            <span className="font-mono text-xs font-bold text-slate-100">Admin</span>
            <span className="text-[11px] text-slate-400">Reviews every published workspace.</span>
          </button>
        </div>

        <Btn type="submit" variant="primary" className="w-full justify-center py-2.5">
          Enter console
        </Btn>
        <p className="mt-4 text-center text-[11px] text-slate-500">
          Local-first. Login state stays on this device; shared data requires Supabase in Settings.
        </p>
      </form>
    </div>
  );
}
