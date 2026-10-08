import { useState } from 'react';
import { Brain, Loader2 } from 'lucide-react';
import { useApp } from '@/hooks';
import { buildSnapshot, groqAnalyze } from '@/lib/groq';
import { setView, updateSettings } from '@/lib/store';
import { Btn, Empty, Field, Panel, inputCls } from './ui';

export function AnalysisView() {
  const s = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [key, setKey] = useState(s.settings.groqKey);

  const identities = Object.values(s.identities);
  const snapshot = buildSnapshot(identities, (Date.now() - s.sessionStartedAt) / 1000);

  const run = async () => {
    if (key && key !== s.settings.groqKey) updateSettings({ groqKey: key });
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const text = await groqAnalyze(key || s.settings.groqKey, snapshot);
      setResult(text);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Session snapshot">
        {identities.length === 0 ? (
          <Empty text="Nothing to analyse yet — run a scan or import data first." />
        ) : (
          <pre className="max-h-[52vh] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950/70 p-3 font-mono text-[11px] leading-relaxed text-slate-300">
            {snapshot}
          </pre>
        )}
      </Panel>

      <div className="space-y-4">
        <Panel title="Groq live analysis — llama-3.3-70b-versatile">
          <div className="space-y-3">
            <Field label="Groq API key (per user, stored on this device)">
              <input className={inputCls} type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="gsk_…" />
            </Field>
            <div className="flex items-center gap-3">
              <Btn variant="primary" disabled={busy || identities.length === 0} onClick={() => void run()}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                {busy ? 'Analysing…' : 'Run analysis'}
              </Btn>
              {!s.settings.groqKey && !key && (
                <button className="font-mono text-xs text-slate-500 underline" onClick={() => setView('settings')}>
                  or set it in Settings
                </button>
              )}
            </div>
            {error && <p className="rounded-lg border border-rose-700/50 bg-rose-500/10 p-3 font-mono text-xs text-rose-300">{error}</p>}
          </div>
        </Panel>

        {result && (
          <Panel title="Analyst output">
            <pre className="max-h-[42vh] overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-200">{result}</pre>
          </Panel>
        )}
      </div>
    </div>
  );
}
