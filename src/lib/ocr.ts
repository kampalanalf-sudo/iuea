// Screenshot import: OCR with tesseract.js, then human review before ingest.

import type { Observation } from './types';
import { parseCsv } from './csv';

export async function ocrImage(file: File): Promise<string> {
  const Tesseract = await import('tesseract.js');
  const result = await Tesseract.recognize(file, 'eng', {
    logger: () => undefined,
  });
  return result.data.text ?? '';
}

/**
 * Best-effort extraction of CSV-ish rows from OCR text.
 * Returns candidates for the operator to review/edit — nothing is auto-ingested.
 */
export function extractCandidateCsv(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const csvish = lines.filter((l) => {
    const parts = l.split(/[,\t;|]+/);
    const nums = parts.filter((p) => /^-?\d+(\.\d+)?$/.test(p.trim()));
    return parts.length >= 3 && nums.length >= 2;
  });
  if (csvish.length === 0) return '';
  const headerLooksPresent = /name/i.test(csvish[0]) && /rssi/i.test(csvish[0]);
  return (headerLooksPresent ? csvish : ['name,dist,rssi,bearing,timestamp,lat,lon', ...csvish])
    .map((l) => l.replace(/[;|]/g, ',').replace(/\t/g, ','))
    .join('\n');
}

export function candidateToObservations(csvText: string): Observation[] {
  return parseCsv(csvText).map((o) => ({ ...o, source: 'ocr' as const }));
}
