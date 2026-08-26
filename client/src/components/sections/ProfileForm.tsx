import { useEffect, useState, type FormEvent } from "react";
import { ui } from "../../config/ui";
import { fetchMe, saveMe } from "../../lib/api";
import { Input } from "../ui/Input";

export function ProfileForm() {
  const copy = ui.profile;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchMe().then((row) => {
      if (row) {
        setName(row.name);
        setEmail(row.email);
        setPhone(row.phone);
      }
      setLoading(false);
    });
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setSaved(false);
    const { ok, data } = await saveMe(name, email);
    setBusy(false);
    if (!ok) {
      setError(data.error ?? "Could not save");
      return;
    }
    setError("");
    setName(data.name ?? name);
    setEmail(data.email ?? email);
    setSaved(true);
  }

  if (loading) {
    return (
      <article className="border border-line bg-surface p-6 text-fg">
        <p className="font-mono text-sm text-muted">{copy.loading}</p>
      </article>
    );
  }

  return (
    <form className="border border-line bg-surface p-6 text-fg" onSubmit={onSubmit}>
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-serif text-3xl">{copy.details}</h2>
        <button
          type="submit"
          disabled={busy}
          className="font-mono text-xs uppercase tracking-[0.16em] underline disabled:opacity-40"
        >
          {copy.save}
        </button>
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <div>
          <dt>
            <label htmlFor="profile-name" className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              {copy.name}
            </label>
          </dt>
          <dd>
            <Input
              id="profile-name"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-b border-line py-1"
            />
          </dd>
        </div>
        <div>
          <dt>
            <label htmlFor="profile-email" className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              {copy.email}
            </label>
          </dt>
          <dd>
            <Input
              id="profile-email"
              type="email"
              required
              maxLength={120}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-b border-line py-1"
            />
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{copy.phone}</dt>
          <dd className="mt-1 font-mono text-sm">
            <span className="text-muted">+91</span> {phone || "—"}
          </dd>
        </div>
      </dl>
      {error ? <p className="mt-4 font-mono text-xs text-danger">{error}</p> : null}
      {saved ? <p className="mt-4 font-mono text-xs text-success">{copy.saved}</p> : null}
    </form>
  );
}
