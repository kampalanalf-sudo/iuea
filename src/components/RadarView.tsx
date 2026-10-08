import { useEffect, useRef } from 'react';
import { useApp } from '@/hooks';
import type { Identity } from '@/lib/types';
import { sortIdentities } from '@/lib/ledger';
import { getHeading } from '@/lib/heading';
import { hashStr } from '@/lib/util';
import { Panel, Stat } from './ui';

const FADE_MS = 60000; // blips fade out over 60 s
const NICE_RANGES = [2, 5, 10, 20, 30, 50, 75, 100, 150, 200];

function niceRange(maxDist: number): number {
  for (const r of NICE_RANGES) if (r >= maxDist * 1.15) return r;
  return 200;
}

interface Blip {
  id: Identity;
  dist: number;
  angle: number; // degrees clockwise from north
  hasBearing: boolean;
  age: number;
}

function toBlips(identities: Identity[], now: number): Blip[] {
  const out: Blip[] = [];
  for (const id of identities) {
    const age = now - id.lastSeen;
    if (age > FADE_MS) continue;
    const dist = id.distLast ?? id.distMin ?? 0;
    let angle: number;
    let hasBearing = false;
    if (id.bearing != null && isFinite(id.bearing)) {
      angle = id.bearing;
      hasBearing = true;
    } else {
      // No bearing reported: pin to a deterministic pseudo-angle so the blip is
      // still visible, drawn hollow to mark "no direction data".
      angle = parseInt(hashStr(id.id).slice(0, 6), 16) % 360;
    }
    out.push({ id, dist, angle, hasBearing, age });
  }
  return out;
}

function drawScope(canvas: HTMLCanvasElement, blips: Blip[], range: number, now: number): void {
  const parent = canvas.parentElement;
  if (!parent) return;
  const cssSize = Math.min(parent.clientWidth, 560);
  if (cssSize <= 0) return;
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(cssSize * dpr)) {
    canvas.width = Math.round(cssSize * dpr);
    canvas.height = Math.round(cssSize * dpr);
    canvas.style.width = `${cssSize}px`;
    canvas.style.height = `${cssSize}px`;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cx = cssSize / 2;
  const cy = cssSize / 2;
  const R = cssSize / 2 - 26;

  // Background
  ctx.fillStyle = '#060b11';
  ctx.fillRect(0, 0, cssSize, cssSize);

  // Range rings
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.18)';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
  ctx.font = '10px "IBM Plex Mono", monospace';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const rr = (R * i) / 4;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillText(`${((range * i) / 4).toFixed(range < 10 ? 1 : 0)}m`, cx + 4, cy - rr - 3);
  }
  // Crosshair
  ctx.beginPath();
  ctx.moveTo(cx - R, cy);
  ctx.lineTo(cx + R, cy);
  ctx.moveTo(cx, cy - R);
  ctx.lineTo(cx, cy + R);
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
  ctx.stroke();
  // Cardinal marks (0° = up = true north)
  ctx.fillStyle = 'rgba(226, 232, 240, 0.7)';
  ctx.font = 'bold 11px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('N', cx, cy - R - 8);
  ctx.fillText('S', cx, cy + R + 15);
  ctx.fillText('E', cx + R + 12, cy + 4);
  ctx.fillText('W', cx - R - 12, cy + 4);
  ctx.textAlign = 'left';

  // Rotating sweep
  const sweep = ((now / 1000) * 60 * (Math.PI / 180)) % (Math.PI * 2); // 60°/s
  const mkConic = (ctx as CanvasRenderingContext2D & { createConicGradient?: (a: number, x: number, y: number) => CanvasGradient }).createConicGradient;
  const grad = typeof mkConic === 'function' ? mkConic.call(ctx, sweep - Math.PI / 2, cx, cy) : null;
  if (grad) {
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.30)');
    grad.addColorStop(0.12, 'rgba(16, 185, 129, 0.0)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
  }
  // Sweep edge line
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.65)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + R * Math.sin(sweep), cy - R * Math.cos(sweep));
  ctx.stroke();

  // Phone heading indicator (where the console is pointing right now)
  const h = getHeading();
  if (h !== null) {
    const hr = (h * Math.PI) / 180;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.sin(hr), cy - R * Math.cos(hr));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Blips
  for (const b of blips) {
    const fresh = 1 - b.age / FADE_MS;
    const alpha = Math.max(0.12, fresh);
    const rad = (b.angle * Math.PI) / 180;
    const r = Math.min(b.dist / range, 1) * R;
    const x = cx + r * Math.sin(rad);
    const y = cy - r * Math.cos(rad);
    const color = b.id.rotating ? '245, 158, 11' : '16, 185, 129';

    ctx.beginPath();
    ctx.arc(x, y, b.hasBearing ? 4.5 : 4, 0, Math.PI * 2);
    if (b.hasBearing) {
      ctx.fillStyle = `rgba(${color}, ${0.25 + 0.55 * alpha})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${color}, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      // hollow = no direction data
      ctx.strokeStyle = `rgba(${color}, ${0.7 * alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = `rgba(${color}, ${Math.max(0.35, alpha)})`;
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.fillText(b.id.label, x + 7, y - 6);
    if (b.hasBearing) {
      ctx.fillStyle = `rgba(148, 163, 184, ${Math.max(0.3, alpha)})`;
      ctx.fillText(`${b.dist.toFixed(1)}m ${Math.round(b.angle)}°`, x + 7, y + 5);
    }
  }

  // Center = operator console
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '9px "IBM Plex Mono", monospace';
  ctx.fillText('YOU', cx + 6, cy + 12);
}

export function RadarView() {
  const s = useApp();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dataRef = useRef<{ identities: Record<string, Identity>; range: number }>({ identities: {}, range: 10 });

  const recent = sortIdentities(Object.values(s.identities)).filter((i) => Date.now() - i.lastSeen < FADE_MS);
  const maxDist = recent.reduce((m, i) => Math.max(m, i.distLast ?? i.distMin ?? 0), 3);
  const range = niceRange(maxDist);
  dataRef.current = { identities: s.identities, range };

  const heading = getHeading();

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const now = Date.now();
        const blips = toBlips(Object.values(dataRef.current.identities), now);
        drawScope(canvas, blips, dataRef.current.range, now);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const bearingCount = recent.filter((b) => b.bearing != null).length;

  return (
    <Panel title="Live radar — bearing × distance scope">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Range" value={`${range} m`} accent />
        <Stat label="On scope" value={String(recent.length)} />
        <Stat label="With bearing" value={String(bearingCount)} />
        <Stat label="Phone heading" value={heading !== null ? `${Math.round(heading)}°` : '—'} />
      </div>
      <div className="mt-3 flex justify-center">
        <canvas ref={canvasRef} className="rounded-full border border-slate-800" />
      </div>
      <p className="mt-3 font-mono text-[10px] leading-relaxed text-slate-500">
        Solid blips carry a bearing (device compass heading at sighting, or imported). Hollow blips have signal but no
        direction data — sweep the phone toward the target to capture one. Centre = this console; 0° = true north.
      </p>
    </Panel>
  );
}
