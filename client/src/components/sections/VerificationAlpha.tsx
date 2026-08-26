import check from "../../assets/landing/check.svg";
import alphaImg from "../../assets/landing/verification-alpha.png";
import { Icon } from "../ui/Icon";
import { ui } from "../../config/ui";

export function VerificationAlpha() {
  const cfg = ui.landing.alpha;
  return (
    <section className="bg-panel">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-8 lg:grid-cols-2 lg:py-24">
        <div>
          <h2 className="font-serif text-4xl text-fg sm:text-5xl">{cfg.title}</h2>
          <p className="mt-6 max-w-md font-serif text-sm leading-relaxed text-muted sm:text-base">{cfg.body}</p>
          <ul className="mt-8 space-y-4">
            {cfg.points.map((point) => (
              <li key={point} className="flex items-center gap-3 font-serif text-sm text-fg sm:text-base">
                <Icon src={check} size={18} />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <img src={alphaImg} alt="" className="h-full w-full object-cover" />
      </div>
    </section>
  );
}
