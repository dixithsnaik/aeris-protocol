import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { paths } from "../../config/routes";
import { ui } from "../../config/ui";
import { useAuthGo } from "../../lib/useAuthGo";

export function Hero() {
  const go = useAuthGo();
  const navigate = useNavigate();
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
      <h1 className="font-serif text-4xl leading-tight text-fg sm:text-5xl md:text-6xl">
        {ui.landing.heroTitle}
      </h1>
      <p className="mx-auto mt-6 max-w-xl font-serif text-sm leading-relaxed text-muted sm:text-base">
        {ui.landing.heroBody}
      </p>
      <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <Button onClick={() => go(paths.sell)}>{ui.landing.sell}</Button>
        <Button variant="outline" onClick={() => navigate(paths.buy)}>
          {ui.landing.buy}
        </Button>
        <Button variant="outline" onClick={() => go(paths.passport)}>
          {ui.landing.verify}
        </Button>
      </div>
    </section>
  );
}
