import { useRef, useState } from 'react';
import { Download, FileJson, FileSpreadsheet, FileText, Image as ImageIcon, Loader2, Printer, Upload } from 'lucide-react';
import { useApp } from '@/hooks';
import { ingestObservations } from '@/lib/store';
import { parseCsv, parseJsonObs, toCsv, toHtmlReport, toJson, CSV_HEADER } from '@/lib/csv';
import { ocrImage, extractCandidateCsv, candidateToObservations } from '@/lib/ocr';
import { downloadFile } from '@/lib/util';
import { Btn, Empty, Field, Panel, inputCls } from './ui';

export function IoView() {
  const s = useApp();
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [candidate, setCandidate] = useState('');
  const [paste, setPaste] = useState('');
  const csvFile = useRef<HTMLInputElement | null>(null);
  const jsonFile = useRef<HTMLInputElement | null>(null);
  const imgFile = useRef<HTMLInputElement | null>(null);

  const flash = (m: string) => {
    setNote(m);
    setTimeout(() => setNote(null), 4000);
  };

  const onCsvFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const n = ingestObservations(parseCsv(await f.text()));
      flash(`Imported ${n} observations from ${f.name}`);
    } catch (e) {
      flash(`CSV error: ${(e as Error).message}`);
    }
  };

  const onJsonFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const n = ingestObservations(parseJsonObs(await f.text()));
      flash(`Imported ${n} observations from ${f.name}`);
    } catch (e) {
      flash(`JSON error: ${(e as Error).message}`);
    }
  };

  const onImage = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setOcrText(null);
    try {
      const text = await ocrImage(f);
      setOcrText(text || '(no text recognised)');
      setCandidate(extractCandidateCsv(text));
    } catch (e) {
      flash(`OCR error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const importCandidate = () => {
    const rows = candidateToObservations(candidate);
    if (rows.length === 0) {
      flash('No rows to import — edit the reviewed CSV first.');
      return;
    }
    ingestObservations(rows);
    flash(`Imported ${rows.length} reviewed OCR rows.`);
    setOcrText(null);
    setCandidate('');
  };

  const importPaste = () => {
    try {
      const rows = parseCsv(paste);
      if (rows.length === 0) throw new Error('no rows found');
      ingestObservations(rows);
      flash(`Imported ${rows.length} pasted rows.`);
      setPaste('');
    } catch (e) {
      flash(`Paste error: ${(e as Error).message}`);
    }
  };

  const exportHtml = () => {
    const html = toHtmlReport(Object.values(s.identities), s.user?.name ?? 'operator');
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    } else {
      downloadFile('point-report.html', html, 'text/html');
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <Panel title="Import">
          <div className="flex flex-wrap gap-2">
            <Btn onClick={() => csvFile.current?.click()}>
              <FileSpreadsheet size={14} /> POINT CSV
            </Btn>
            <Btn onClick={() => jsonFile.current?.click()}>
              <FileJson size={14} /> JSON observations
            </Btn>
            <Btn onClick={() => imgFile.current?.click()}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />} Screenshot OCR
            </Btn>
            <input ref={csvFile} type="file" accept=".csv,text/csv" hidden onChange={(e) => void onCsvFile(e.target.files?.[0])} />
            <input ref={jsonFile} type="file" accept=".json,application/json" hidden onChange={(e) => void onJsonFile(e.target.files?.[0])} />
            <input ref={imgFile} type="file" accept="image/*" hidden onChange={(e) => void onImage(e.target.files?.[0])} />
          </div>
          <p className="mt-3 font-mono text-[10px] text-slate-500">CSV format: {CSV_HEADER}. OCR rows are never auto-ingested — review below first.</p>

          <div className="mt-4">
            <Field label="Paste CSV rows">
              <textarea className={`${inputCls} h-24 resize-y`} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={'name,dist,rssi,bearing,timestamp,lat,lon\nTAG-12,3.4,-71,90,1759900000,0.3476,32.5825'} />
            </Field>
            <div className="mt-2 flex justify-end">
              <Btn onClick={importPaste} disabled={!paste.trim()}>
                <Upload size={13} /> Import pasted
              </Btn>
            </div>
          </div>
        </Panel>

        {ocrText !== null && (
          <Panel title="OCR review — nothing is auto-ingested">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-slate-500">Recognised text</div>
                <pre className="max-h-44 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950/70 p-2 font-mono text-[10px] text-slate-400">{ocrText}</pre>
              </div>
              <div>
                <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-slate-500">Candidate rows (editable)</div>
                <textarea className={`${inputCls} h-44 resize-y`} value={candidate} onChange={(e) => setCandidate(e.target.value)} />
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Btn onClick={() => { setOcrText(null); setCandidate(''); }}>Discard</Btn>
              <Btn variant="primary" onClick={importCandidate} disabled={!candidate.trim()}>
                <Upload size={13} /> Import reviewed rows
              </Btn>
            </div>
          </Panel>
        )}

        {note && <div className="rounded-lg border border-emerald-600/40 bg-emerald-500/10 p-3 font-mono text-xs text-emerald-300">{note}</div>}
      </div>

      <Panel title="Export">
        {s.observations.length === 0 ? (
          <Empty text="No observations in this session yet." />
        ) : (
          <div className="space-y-3">
            <p className="font-mono text-xs text-slate-400">
              {s.observations.length} observations · {Object.keys(s.identities).length} merged identities
            </p>
            <div className="flex flex-wrap gap-2">
              <Btn onClick={() => downloadFile('point-session.csv', toCsv(s.observations), 'text/csv')}>
                <Download size={14} /> CSV
              </Btn>
              <Btn onClick={() => downloadFile('point-session.json', toJson(s.observations), 'application/json')}>
                <FileJson size={14} /> JSON
              </Btn>
              <Btn onClick={exportHtml}>
                <Printer size={14} /> Printable HTML
              </Btn>
            </div>
            <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">
                <FileText size={11} /> Interpretation guardrail
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Coordinates in exports are scanner positions, not target GPS. Broadcast names are not proof of a person —
                never present a <span className="text-amber-400">Person-</span> label as personal identification.
              </p>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
