import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import pin from "../../assets/discover/pin.svg";
import check from "../../assets/landing/check.svg";
import { Button } from "../ui/Button";
import { Field } from "../patterns/Field";
import { Icon } from "../ui/Icon";
import { Label } from "../ui/Label";
import { paths } from "../../config/routes";
import { ui } from "../../config/ui";
import { createListing } from "../../lib/api";
import { inr } from "../../lib/money";
import { mapEmbed } from "../../lib/propertyDetail";

const CONFIGS = ui.discover.configs;

export function AddPropertyForm() {
  const copy = ui.sell;
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [config, setConfig] = useState<string>(CONFIGS[0]);
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files, ...Array.from(list)].slice(0, 6);
    setFiles(next);
    setPreviews(next.map((file) => URL.createObjectURL(file)));
  }

  function removeAt(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    setPreviews(next.map((file) => URL.createObjectURL(file)));
  }

  function onBasic(event: FormEvent) {
    event.preventDefault();
    setError("");
    setStep(2);
  }

  async function onPublish() {
    setBusy(true);
    setError("");
    const { ok, data } = await createListing({
      title,
      location,
      config,
      price,
      area_sqft: area,
      images: files,
    });
    setBusy(false);
    if (!ok) {
      setError(data.error ?? "Could not publish");
      return;
    }
    navigate(paths.sell);
  }

  return (
    <div className="flex min-h-0 flex-1 bg-surface text-fg">
      <aside className="hidden w-48 shrink-0 flex-col gap-6 px-6 py-10 sm:flex">
        <p className={`flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] ${step === 1 ? "text-fg" : "text-muted"}`}>
          {step > 1 ? <Icon src={check} size={16} /> : <span className="inline-block h-3 w-3 rounded-full border border-fg" />}
          {copy.stepBasic}
        </p>
        <p className={`flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] ${step === 2 ? "text-fg" : "text-muted"}`}>
          <span className="inline-block h-3 w-3 rounded-full border border-fg" />
          {copy.stepPhotos}
        </p>
      </aside>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-8 sm:px-8">
        <button
          type="button"
          className="font-mono text-xs uppercase tracking-[0.14em] text-muted hover:text-fg"
          onClick={() => {
            const idx = (window.history.state as { idx?: number } | null)?.idx;
            if (typeof idx === "number" && idx > 0) navigate(-1);
            else navigate(paths.profile);
          }}
        >
          {copy.goBack}
        </button>
        {step === 1 ? (
          <form className="mt-8 max-w-xl border border-line bg-surface p-6 text-fg" onSubmit={onBasic}>
            <h1 className="font-serif text-3xl">{copy.details}</h1>
            <div className="mt-6 flex flex-col gap-5">
              <Field id="list-title" label={copy.titleField} value={title} required onChange={(e) => setTitle(e.target.value)} />
              <Field id="list-location" label={copy.locationField} value={location} required onChange={(e) => setLocation(e.target.value)} />
              <div>
                <Label htmlFor="list-config">{copy.type}</Label>
                <select
                  id="list-config"
                  value={config}
                  onChange={(e) => setConfig(e.target.value)}
                  className="w-full border-b border-line bg-transparent py-2 font-mono text-sm text-fg outline-none"
                >
                  {CONFIGS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <Field id="list-area" label={copy.area} inputMode="numeric" value={area} required onChange={(e) => setArea(e.target.value)} />
              <Field id="list-price" label={copy.price} inputMode="numeric" value={price} required onChange={(e) => setPrice(e.target.value)} />
            </div>
            <Button type="submit" variant="inverse" className="mt-8 px-4 py-2">
              {copy.nextPhotos}
            </Button>
          </form>
        ) : (
          <div className="mt-8 max-w-3xl">
            <article className="border border-line bg-surface p-6 text-fg">
              <div className="flex items-start justify-between gap-4">
                <h1 className="font-serif text-3xl">{copy.details}</h1>
                <button type="button" className="font-mono text-xs uppercase tracking-[0.16em] underline" onClick={() => setStep(1)}>
                  {copy.edit}
                </button>
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{copy.type}</dt>
                  <dd className="mt-1 font-mono text-sm">{config}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{copy.titleField}</dt>
                  <dd className="mt-1 font-mono text-sm">{title}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{copy.area}</dt>
                  <dd className="mt-1 font-mono text-sm">{Number(area).toLocaleString("en-IN")}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{copy.price}</dt>
                  <dd className="mt-1 font-mono text-sm">{inr(Number(price) || 0)}</dd>
                </div>
              </dl>
            </article>
            <div className="relative mt-4 h-56 overflow-hidden bg-panel">
              <iframe title="Map" src={mapEmbed(location)} className="h-full w-full border-0" />
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 bg-surface px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-fg">
                <Icon src={pin} size={14} />
                {copy.pin}
              </span>
            </div>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center border border-dashed border-line bg-surface px-6 py-12 text-fg">
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
              <p className="font-mono text-sm">{copy.drop}</p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{copy.dropHint}</p>
            </label>
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {previews.map((src, i) => (
                <div key={src} className="relative aspect-square overflow-hidden bg-panel">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-ink px-2 py-0.5 font-mono text-[10px] text-surface"
                    onClick={() => removeAt(i)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="aspect-square bg-panel font-serif text-3xl text-muted"
                onClick={() => document.getElementById("extra-photo")?.click()}
              >
                +
              </button>
              <input id="extra-photo" type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
            </div>
            {error ? <p className="mt-4 font-mono text-xs text-danger">{error}</p> : null}
            <div className="mt-8 flex justify-end">
              <Button variant="inverse" className="px-4 py-2" disabled={busy} onClick={() => void onPublish()}>
                {busy ? copy.publishing : copy.publish}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
