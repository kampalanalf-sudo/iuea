import type { ReactNode } from 'react';
import { clsx } from 'clsx';

export function Panel({ title, children, className, right }: { title?: string; children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <section className={clsx('rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm', className)}>
      {title && (
        <header className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</h2>
          {right}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Btn({
  children,
  onClick,
  variant = 'ghost',
  disabled,
  className,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'danger' | 'ghost';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        variant === 'primary' && 'bg-emerald-500 text-slate-950 hover:bg-emerald-400',
        variant === 'danger' && 'bg-rose-600 text-white hover:bg-rose-500',
        variant === 'ghost' && 'border border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700/60',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.15em] text-slate-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-500';

export function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className={clsx('font-mono text-lg font-bold', accent ? 'text-emerald-400' : 'text-slate-100')}>{value}</div>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center font-mono text-xs text-slate-500">{text}</div>;
}
