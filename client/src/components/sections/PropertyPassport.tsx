import shield from "../../assets/landing/shield.svg";
import verified from "../../assets/landing/verified.svg";
import passportBg from "../../assets/landing/passport-bg.png";
import { Icon } from "../ui/Icon";
import { ui } from "../../config/ui";

export function PropertyPassport() {
  const cfg = ui.landing.passport;
  return (
    <article className="flex flex-col border border-line bg-surface p-6 sm:p-8">
      <header className="mb-6 flex items-center gap-2">
        <Icon src={shield} size={15} />
        <h2 className="font-serif text-xl text-fg">{cfg.title}</h2>
        <span className="ml-auto border border-line px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
          {cfg.badge}
        </span>
      </header>
      <div className="relative min-h-64 overflow-hidden border border-line">
        <img src={passportBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="relative m-4 bg-surface/95 p-5 sm:m-6">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-[11px] text-muted">{cfg.id}</p>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-fg">
              {cfg.status}
              <Icon src={verified} size={16} />
            </span>
          </div>
          <dl className="mt-6 space-y-3">
            {cfg.rows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{row.label}</dt>
                <dd className="font-mono text-xs text-fg">{row.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 h-1 w-full bg-brand" />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{cfg.sync}</p>
        </div>
      </div>
    </article>
  );
}
