import { useEffect, useRef } from "react";
import { Button } from "../ui/Button";
import { ui } from "../../config/ui";
import type { PropertyAnalytics } from "../../lib/api";

type PanelProps = {
  stats: PropertyAnalytics;
};

function pct(n: number, signed = false) {
  const value = `${n.toFixed(1)}%`;
  if (signed && n > 0) return `+${value}`;
  return value;
}

export function MarketAnalytics({ stats }: PanelProps) {
  const copy = ui.discover;
  const rows = [
    { label: copy.avgCap, value: pct(stats.avg_cap_rate) },
    { label: copy.vacancy, value: pct(stats.vacancy_rate) },
    { label: copy.yoy, value: pct(stats.yoy_growth, true) },
  ];
  return (
    <section className="flex flex-col justify-between bg-surface p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-serif text-2xl text-fg">{copy.analytics}</h2>
        <p className="font-mono text-xs text-muted">{copy.quarter}</p>
      </div>
      <dl className="mt-8 grid grid-cols-3 gap-3">
        {rows.map((row) => (
          <div key={row.label} className="bg-panel p-3 sm:p-4">
            <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{row.label}</dt>
            <dd className="mt-3 font-mono text-lg text-fg sm:text-2xl">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

type DialogProps = {
  stats: PropertyAnalytics | null;
  open: boolean;
  onClose: () => void;
};

export function AnalyticsDialog({ stats, open, onClose }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="m-auto w-[min(40rem,calc(100%-2rem))] border-0 bg-transparent p-0 text-fg backdrop:bg-fg/40"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="bg-surface">
        {stats ? <MarketAnalytics stats={stats} /> : null}
        <div className="flex justify-end px-5 pb-5">
          <Button variant="outline" className="px-4 py-2" onClick={onClose}>
            {ui.discover.close}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
