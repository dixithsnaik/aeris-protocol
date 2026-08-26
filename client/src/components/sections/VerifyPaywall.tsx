import lock from "../../assets/property/lock.svg";
import shield from "../../assets/landing/shield.svg";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { ui } from "../../config/ui";
import type { VerifyPackage, VerifyPackageId } from "../../lib/api";
import { inr } from "../../lib/money";

type Props = {
  packages: VerifyPackage[];
  feeRate: number;
  selected: VerifyPackageId;
  busy: boolean;
  error: string;
  onSelect: (id: VerifyPackageId) => void;
  onPay: () => void;
  onCancel: () => void;
};

export function VerifyPaywall({ packages, feeRate, selected, busy, error, onSelect, onPay, onCancel }: Props) {
  const copy = ui.verify;
  const pack = packages.find((row) => row.id === selected) ?? packages[0];
  if (!pack) return null;
  const feePct = `${(feeRate * 100).toFixed(1)}%`;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <div className="flex justify-end">
        <Button variant="inverse" className="px-4 py-2" onClick={onCancel}>
          {copy.cancel}
        </Button>
      </div>
      <h1 className="mt-6 font-serif text-3xl text-fg sm:text-5xl">{copy.title}</h1>
      <p className="mt-3 max-w-2xl font-mono text-xs text-muted">{copy.body}</p>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {packages.map((row) => {
          const meta = copy.packs[row.id];
          const on = row.id === selected;
          return (
            <article
              key={row.id}
              className={`flex flex-col border p-6 ${on ? "border-brand bg-brand text-brand-fg" : "border-line bg-surface text-fg"}`}
            >
              {row.recommended ? (
                <p className={`font-mono text-[10px] uppercase tracking-[0.16em] ${on ? "text-brand-fg/80" : "text-muted"}`}>
                  {copy.recommended}
                </p>
              ) : (
                <p className="h-4" />
              )}
              <h2 className="mt-3 font-serif text-3xl">{meta.name}</h2>
              <p className="mt-2 font-mono text-sm">{inr(row.price)}</p>
              <ul className="mt-6 flex-1 space-y-2 font-mono text-xs">
                {meta.features.map((line) => (
                  <li key={line}>— {line}</li>
                ))}
              </ul>
              <Button variant="outline" className="mt-8 w-full px-4 py-2" onClick={() => onSelect(row.id)}>
                {on ? copy.selected : meta.select}
              </Button>
            </article>
          );
        })}
      </div>
      <div className="mx-auto mt-12 max-w-xl border border-line bg-panel p-6 sm:p-8">
        <h2 className="font-serif text-2xl text-fg">{copy.checkout}</h2>
        <p className="mt-1 font-mono text-xs text-muted">{copy.checkoutBody}</p>
        <div className="mt-8">
          <div className="flex justify-between gap-4 font-mono text-sm text-fg">
            <span>
              {copy.packLabel}: {copy.packs[pack.id].name}
            </span>
            <span>{inr(pack.price)}</span>
          </div>
          <div className="mt-3 flex justify-between gap-4 font-mono text-xs text-muted">
            <span>{copy.fee.replace("2.9%", feePct)}</span>
            <span>{inr(pack.fee)}</span>
          </div>
          <div className="mt-4 flex justify-between gap-4 border-t border-line pt-4 font-serif text-2xl text-fg">
            <span>{copy.total}</span>
            <span>{inr(pack.total)}</span>
          </div>
          <p className="mt-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            <Icon src={lock} size={14} />
            {copy.ssl}
          </p>
          {error ? <p className="mt-4 font-mono text-xs text-danger">{error}</p> : null}
          <Button
            type="button"
            variant="primary"
            className="mt-6 flex w-full items-center justify-center gap-2 px-4 py-3"
            disabled={busy}
            onClick={onPay}
          >
            <Icon src={shield} size={16} className="brightness-0 invert" />
            {busy ? copy.paying : copy.pay}
          </Button>
        </div>
      </div>
    </div>
  );
}
