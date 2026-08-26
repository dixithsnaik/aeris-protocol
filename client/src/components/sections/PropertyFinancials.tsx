import { ui } from "../../config/ui";
import type { Property } from "../../lib/api";
import { inr } from "../../lib/money";
import { annualNet, taxDue } from "../../lib/propertyDetail";

type Props = {
  item: Property;
};

export function PropertyFinancials({ item }: Props) {
  const copy = ui.property;
  const yoy = item.yoy_pct ?? 0;
  const rows = [
    { label: copy.price, value: inr(item.price) },
    { label: copy.yieldLabel, value: `${item.yield_pct.toFixed(1)}%` },
    { label: copy.annualNet, value: inr(annualNet(item)) },
    { label: copy.yoy, value: `${yoy > 0 ? "+" : ""}${yoy.toFixed(1)}%` },
  ];
  return (
    <div>
      <h1 className="font-serif text-3xl text-fg sm:text-4xl">{copy.financialsTitle}</h1>
      <p className="mt-2 max-w-xl font-mono text-xs text-muted">{copy.financialsBody}</p>
      <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => (
          <div key={row.label} className="bg-surface p-5">
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{row.label}</dt>
            <dd className="mt-3 font-mono text-lg text-fg">{row.value}</dd>
          </div>
        ))}
      </dl>
      <dl className="mt-6 space-y-3 bg-surface p-5 sm:p-6">
        <div className="flex justify-between gap-4 border-b border-line pb-3 font-mono text-sm">
          <dt className="text-muted">{copy.aerisFee}</dt>
          <dd className="text-fg">{inr(ui.landing.calculator.aerisFlat)}</dd>
        </div>
        <div className="flex justify-between gap-4 font-mono text-sm">
          <dt className="text-muted">{copy.carrying}</dt>
          <dd className="text-fg">{inr(taxDue(item.price))}</dd>
        </div>
      </dl>
    </div>
  );
}
