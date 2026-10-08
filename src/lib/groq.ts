// Groq live analysis (llama-3.3-70b-versatile) over a session snapshot.

import type { Identity } from './types';
import { avgRssi, sortIdentities } from './ledger';
import { fmtDist } from './util';

export function buildSnapshot(identities: Identity[], scanSeconds: number): string {
  const list = sortIdentities(identities).slice(0, 40);
  const lines = list.map((id) => {
    const tokens =
      id.tokenKind === 'ibeacon'
        ? 'iBeacon'
        : id.tokenKind === 'eddystone'
          ? 'Eddystone-UID'
          : id.tokenKind === 'address'
            ? 'address-stable'
            : id.tokenKind === 'payload'
              ? 'payload-hash'
              : 'rotating';
    return [
      `- ${id.label} [${tokens}] adverts=${id.count} rssiAvg=${avgRssi(id).toFixed(0)}dBm`,
      ` dist=${fmtDist(id.distLast)} distMin=${fmtDist(id.distMin)}`,
      id.bearing != null ? ` bearing=${id.bearing}°` : '',
      id.names.length ? ` names=${id.names.join('/')}` : '',
    ].join('');
  });
  return [
    `Session: ${Math.round(scanSeconds)}s of scanning, ${identities.length} merged identities.`,
    'Identities (most recently seen first):',
    ...lines,
  ].join('\n');
}

export async function groqAnalyze(apiKey: string, snapshot: string): Promise<string> {
  if (!apiKey) throw new Error('No Groq API key set — add one in Settings.');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 900,
      messages: [
        {
          role: 'system',
          content:
            'You are a BLE operations analyst for ProxiCore POINT. Interpret the scan snapshot: rank which identities look like tracked persons of interest vs static infrastructure, flag rotating-address devices, note closest approach distances, and give 3 concrete operator recommendations. Remember: ordinary BLE cannot measure bearing without AoA hardware, and broadcast names are not proof of identity.',
        },
        { role: 'user', content: snapshot },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Groq error ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? '(empty response)';
}
