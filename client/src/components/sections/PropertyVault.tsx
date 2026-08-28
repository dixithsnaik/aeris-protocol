import { useState } from "react";
import lock from "../../assets/property/lock.svg";
import truck from "../../assets/property/truck.svg";
import sofa from "../../assets/property/sofa.svg";
import shield from "../../assets/discover/shield.svg";
import check from "../../assets/landing/check.svg";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { ui } from "../../config/ui";
import { downloadPassport, type Property } from "../../lib/api";
import { inr } from "../../lib/money";
import { deedId, renewalDays, taxDue } from "../../lib/propertyDetail";

const serviceIcons: Record<string, string> = { move: truck, interior: sofa, protect: shield };

type Props = {
  item: Property;
};

export function PropertyVault({ item }: Props) {
  const copy = ui.property;
  const [note, setNote] = useState("");
  const days = renewalDays(item.id);
  return (
    <div>
      <h1 className="font-serif text-3xl text-fg sm:text-4xl">{copy.vaultTitle}</h1>
      <p className="mt-2 max-w-xl font-mono text-xs text-muted">{copy.vaultBody}</p>
      {note ? <p className="mt-4 font-mono text-xs text-muted">{note}</p> : null}
      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <article className="flex flex-col bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl text-fg">{copy.deedTitle}</h2>
              <p className="mt-1 font-mono text-xs text-muted">{deedId(item.id)}</p>
            </div>
            <span className="inline-flex items-center gap-1 bg-panel px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-success">
              <Icon src={check} size={14} />
              {copy.verifiedSeal}
            </span>
          </div>
          <div className="mt-8 flex flex-1 flex-col items-center justify-center bg-panel py-12">
            <Icon src={lock} size={28} />
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{copy.encrypted}</p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button variant="inverse" className="flex-1 px-4 py-2" onClick={() => setNote(copy.encrypted)}>
              {copy.viewDoc}
            </Button>
            <Button
              variant="outline"
              className="flex-1 px-4 py-2"
              onClick={() => void downloadPassport(item.id).then((ok) => setNote(ok ? copy.downloadPassport : copy.demoNote))}
            >
              {copy.downloadPassport}
            </Button>
          </div>
        </article>
        <article className="flex flex-col bg-surface p-5 sm:p-6">
          <h2 className="font-serif text-2xl text-fg">{copy.taxTitle}</h2>
          <dl className="mt-6 space-y-4">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{copy.nextAssessment}</dt>
              <dd className="mt-1 font-mono text-sm text-fg">{copy.assessmentValue}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{copy.estimatedDue}</dt>
              <dd className="mt-1 font-mono text-sm text-fg">{inr(taxDue(item.price))}</dd>
            </div>
          </dl>
          <p className="mt-6 bg-panel px-3 py-2 font-mono text-[11px] text-danger">
            {copy.renewal.replace("{n}", String(days))}
          </p>
          <Button variant="outline" className="mt-auto px-4 py-2" onClick={() => setNote(copy.demoNote)}>
            {copy.schedule}
          </Button>
        </article>
      </div>
      <h2 className="mt-10 font-serif text-2xl text-fg">{copy.concierge}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {copy.services.map((row) => (
          <article key={row.id} className="flex flex-col bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <Icon src={serviceIcons[row.id]} size={22} />
              {row.badge ? (
                <span className="bg-panel px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-badge">
                  {row.badge}
                </span>
              ) : null}
            </div>
            <h3 className="mt-4 font-serif text-xl text-fg">{row.title}</h3>
            <p className="mt-2 flex-1 font-mono text-xs text-muted">{row.body}</p>
            <button
              type="button"
              className="mt-4 text-left font-mono text-[11px] uppercase tracking-[0.16em] text-fg"
              onClick={() => setNote(copy.demoNote)}
            >
              {row.action} →
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
