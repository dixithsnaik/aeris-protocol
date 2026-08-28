import { useState, type FormEvent } from "react";
import check from "../../assets/landing/check.svg";
import fail from "../../assets/property/fail.svg";
import pending from "../../assets/property/timeline.svg";
import { Label } from "../ui/Label";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { ui } from "../../config/ui";
import { verifyPassportFile, type PassportVerdict } from "../../lib/api";

const chip: Record<string, string> = {
  forged: "bg-danger-soft text-danger",
  authentic: "bg-success-soft text-success",
  stale: "bg-warn-soft text-warn",
  unanchored: "bg-success-soft text-success",
};

const icon: Record<string, string> = {
  forged: fail,
  authentic: check,
  stale: pending,
  unanchored: check,
};

export function PassportVerify() {
  const copy = ui.passport;
  const findings = copy.findings;
  const labels: Record<string, string> = {
    forged: copy.forged,
    authentic: copy.authentic,
    stale: copy.stale,
    unanchored: copy.unanchored,
  };
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PassportVerdict | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError(copy.noFile);
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    const { data } = await verifyPassportFile(file);
    setBusy(false);
    if (!data.verdict) {
      setError(data.error ?? copy.badFile);
      return;
    }
    setResult(data);
  }

  const verdict = result?.verdict ?? "";
  const ok = verdict === "authentic" || verdict === "unanchored";
  const finding = findings[verdict as keyof typeof findings];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
      <h1 className="font-serif text-3xl text-fg sm:text-4xl">{copy.title}</h1>
      <p className="mt-3 max-w-xl font-mono text-xs leading-relaxed text-muted">{copy.body}</p>
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.1fr)]">
        <form className="flex flex-col gap-5 bg-surface p-5 sm:p-6" onSubmit={(e) => void onSubmit(e)}>
          <div>
            <Label htmlFor="passport-file">{copy.fileLabel}</Label>
            <input
              id="passport-file"
              type="file"
              accept="application/pdf,.pdf,application/json,.json"
              className="w-full border border-line bg-panel p-3 font-mono text-sm text-fg file:mr-3 file:border-0 file:bg-brand file:px-3 file:py-1 file:font-mono file:text-xs file:uppercase file:tracking-[0.12em] file:text-brand-fg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {error ? <p className="font-mono text-xs text-danger">{error}</p> : null}
          <Button type="submit" variant="primary" className="self-start px-4 py-2" disabled={busy}>
            {copy.check}
          </Button>
        </form>
        <article className="bg-surface p-5 sm:p-6">
          {!result?.verdict ? (
            <p className="font-mono text-xs text-muted">{copy.empty}</p>
          ) : (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-serif text-2xl text-fg">{result.title || result.code || labels[verdict]}</h2>
                  {result.code ? <p className="mt-1 font-mono text-xs text-muted">{result.code}</p> : null}
                </div>
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${chip[verdict] ?? "bg-panel text-fg"}`}
                >
                  <Icon src={icon[verdict] ?? pending} size={14} />
                  {labels[verdict] ?? verdict}
                </span>
              </div>
              {finding ? <p className="mt-4 font-mono text-xs leading-relaxed text-muted">{finding}</p> : null}
              {ok && result.seals && result.seals.length > 0 ? (
                <div className="mt-6 border-t border-line pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{copy.sealsLabel}</p>
                  <ul className="mt-3 space-y-3">
                    {result.seals.map((row) => (
                      <li key={row.id} className="flex items-start gap-3 border-b border-line pb-3">
                        <Icon src={check} size={16} className="mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-success">{row.label}</p>
                          <p className="mt-1 font-mono text-[11px] text-muted">{copy.sealOk}</p>
                        </div>
                        <span className="ml-auto shrink-0 bg-success-soft px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-success">
                          {ui.property.auditPass}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
