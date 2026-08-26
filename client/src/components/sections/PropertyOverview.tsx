import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import check from "../../assets/landing/check.svg";
import fail from "../../assets/property/fail.svg";
import pending from "../../assets/property/timeline.svg";
import shield from "../../assets/landing/shield.svg";
import { Accordion } from "../patterns/Accordion";
import { Field } from "../patterns/Field";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Label } from "../ui/Label";
import { propertyPath, verifyPath } from "../../config/routes";
import { ui } from "../../config/ui";
import {
  addInterest,
  fetchInterested,
  mediaUrl,
  removeInterest,
  updateListing,
  type Property,
} from "../../lib/api";
import { getToken } from "../../lib/session";
import { useAuthGo } from "../../lib/useAuthGo";
import { areaLabel, auditChecklist, exposure, floorLevel, lawyerPending, ledgerHash, passportId } from "../../lib/propertyDetail";

const statusIcon = { pass: check, pending, fail };
const statusClass = {
  pass: "text-success",
  pending: "text-warn",
  fail: "text-danger",
};
const statusChip = {
  pass: "bg-success-soft text-success",
  pending: "bg-warn-soft text-warn",
  fail: "bg-danger-soft text-danger",
};

type Props = {
  item: Property;
  onItem: (item: Property) => void;
};

export function PropertyOverview({ item, onItem }: Props) {
  const copy = ui.property;
  const go = useAuthGo();
  const wantEdit = Boolean((useLocation().state as { edit?: boolean } | null)?.edit);
  const owned = Boolean(item.owned);
  const [hashOpen, setHashOpen] = useState(false);
  const [watching, setWatching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [location, setLocation] = useState(item.location);
  const [config, setConfig] = useState(item.config);
  const [price, setPrice] = useState(String(item.price));
  const [area, setArea] = useState(String(item.area_sqft));
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(item.title);
    setLocation(item.location);
    setConfig(item.config);
    setPrice(String(item.price));
    setArea(String(item.area_sqft));
  }, [item]);

  useEffect(() => {
    if (wantEdit) setEditing(true);
  }, [wantEdit]);

  useEffect(() => {
    if (!getToken()) return;
    void fetchInterested().then((rows) => {
      setWatching(rows.some((row) => row.id === item.id));
    });
  }, [item.id]);

  async function onTrack() {
    if (!getToken()) {
      go(propertyPath(item.id));
      return;
    }
    setBusy(true);
    if (watching) {
      const { ok } = await removeInterest(item.id);
      if (ok) setWatching(false);
    } else {
      const { ok } = await addInterest(item.id);
      if (ok) setWatching(true);
    }
    setBusy(false);
  }

  async function onSave() {
    setBusy(true);
    setError("");
    const { ok, data } = await updateListing(item.id, {
      title,
      location,
      config,
      price,
      area_sqft: area,
    });
    setBusy(false);
    if (!ok) {
      setError(data.error ?? "Could not save");
      return;
    }
    onItem({ ...data, owned: true });
    setEditing(false);
  }
  const stats = [
    { label: copy.carpet, value: areaLabel(item.area_sqft) },
    { label: copy.floor, value: floorLevel(item.id) },
    { label: copy.exposure, value: exposure(item.id) },
  ];
  const audits = auditChecklist(item);
  const statusLabel = { pass: copy.auditPass, pending: copy.auditPending, fail: copy.auditFail };
  const awaiting = lawyerPending(item);
  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="min-w-0 font-serif text-3xl text-fg sm:text-4xl">{passportId(item)}</h1>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {owned && !item.verified && !awaiting ? (
            <Button variant="primary" className="px-4 py-2" onClick={() => go(verifyPath(item.id))}>
              {copy.subscribeVerify}
            </Button>
          ) : null}
          {owned ? null : (
            <Button variant="outline" className="px-4 py-2" disabled={busy} onClick={() => void onTrack()}>
              {watching ? ui.profile.tracking : ui.profile.track}
            </Button>
          )}
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] whitespace-nowrap sm:text-sm ${
              item.verified ? "bg-success-soft text-success" : "bg-warn-soft text-warn"
            }`}
          >
            <Icon src={item.verified ? check : pending} size={18} />
            {item.verified ? copy.certified : awaiting ? copy.awaitingLawyer : copy.pendingReview}
          </span>
        </div>
      </header>
      {error && !editing ? <p className="mt-4 font-mono text-xs text-danger">{error}</p> : null}
      {owned && editing ? (
        <form
          className="mt-8 grid gap-5 border border-line bg-surface p-6 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void onSave();
          }}
        >
          <Field id="edit-title" label={ui.sell.titleField} value={title} required onChange={(e) => setTitle(e.target.value)} />
          <Field id="edit-location" label={ui.sell.locationField} value={location} required onChange={(e) => setLocation(e.target.value)} />
          <div>
            <Label htmlFor="edit-config">{ui.sell.type}</Label>
            <select
              id="edit-config"
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              className="w-full border-b border-line bg-transparent py-2 font-mono text-sm text-fg outline-none"
            >
              {ui.discover.configs.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <Field id="edit-area" label={ui.sell.area} inputMode="numeric" value={area} required onChange={(e) => setArea(e.target.value)} />
          <Field id="edit-price" label={ui.sell.price} inputMode="numeric" value={price} required onChange={(e) => setPrice(e.target.value)} />
          {error ? <p className="font-mono text-xs text-danger sm:col-span-2">{error}</p> : null}
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <Button type="submit" variant="inverse" className="px-4 py-2" disabled={busy}>
              {copy.saveListing}
            </Button>
            <Button type="button" variant="outline" className="px-4 py-2" disabled={busy} onClick={() => setEditing(false)}>
              {copy.cancelEdit}
            </Button>
          </div>
        </form>
      ) : null}
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <div>
          <img src={mediaUrl(item.image_url)} alt="" className="aspect-[16/10] w-full object-cover" />
          <dl className="grid grid-cols-3 divide-x divide-line bg-panel">
            {stats.map((row) => (
              <div key={row.label} className="px-3 py-4 sm:px-4">
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{row.label}</dt>
                <dd className="mt-1 font-mono text-xs text-fg sm:text-sm">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="font-serif text-2xl text-fg">{copy.auditTitle}</h2>
          <p className="mt-1 font-mono text-xs text-muted">{copy.auditBody}</p>
          <div className="mt-4">
            {audits.map((row) => {
              const label = copy.audit.find((entry) => entry.id === row.id)?.label ?? row.id;
              return (
                <Accordion
                  key={row.id}
                  open={row.status !== "pass"}
                  title={
                    <span className="flex w-full items-center gap-2">
                      <Icon src={statusIcon[row.status]} size={16} />
                      <span className={statusClass[row.status]}>{label}</span>
                      <span
                        className={`ml-auto px-3 py-1 font-mono text-xs uppercase tracking-[0.12em] whitespace-nowrap ${statusChip[row.status]}`}
                      >
                        {statusLabel[row.status]}
                      </span>
                    </span>
                  }
                >
                  <dl className="space-y-2">
                    {row.rows.map((line) => (
                      <div key={line.label} className="flex justify-between gap-4">
                        <dt>{line.label}</dt>
                        <dd className={line.tone === "danger" ? "text-danger" : "text-fg"}>{line.value}</dd>
                      </div>
                    ))}
                  </dl>
                </Accordion>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-4 bg-panel p-5 sm:flex-row sm:items-center sm:p-6">
        <Icon src={shield} size={22} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-xl text-fg">{copy.ledgerTitle}</h2>
          <p className="mt-1 font-mono text-xs text-muted">{copy.ledgerBody}</p>
          {hashOpen ? (
            <p className="mt-2 break-all font-mono text-xs text-fg">
              {copy.hashLabel}: {ledgerHash(item.id)}
            </p>
          ) : null}
        </div>
        <Button variant="outline" className="shrink-0 px-4 py-2" onClick={() => setHashOpen((v) => !v)}>
          {copy.viewLedger}
        </Button>
      </div>
    </div>
  );
}
