import { useState } from "react";
import calculator from "../../assets/landing/calculator.svg";
import { Icon } from "../ui/Icon";
import { Input } from "../ui/Input";
import { ui } from "../../config/ui";
import { parseMoney, inr } from "../../lib/money";

export function BrokerageCalculator() {
  const cfg = ui.landing.calculator;
  const [value, setValue] = useState<number>(cfg.defaultValue);
  const traditional = value * cfg.traditionalRate;
  const retained = Math.max(0, traditional - cfg.aerisFlat);

  return (
    <article className="flex flex-col border border-line bg-surface p-6 sm:p-8">
      <header className="mb-8 flex items-center gap-2">
        <Icon src={calculator} size={17} />
        <h2 className="font-serif text-xl text-fg">{cfg.title}</h2>
      </header>
      <label className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{cfg.valueLabel}</span>
        <Input
          className="w-44 py-0 text-right text-sm"
          value={inr(value)}
          onChange={(event) => setValue(parseMoney(event.target.value))}
        />
      </label>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="bg-panel p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{cfg.traditionalLabel}</p>
          <p className="mt-2 font-mono text-lg text-danger line-through">{inr(traditional)}</p>
        </div>
        <div className="bg-panel p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{cfg.aerisLabel}</p>
          <p className="mt-2 font-mono text-lg text-fg">{inr(cfg.aerisFlat)}</p>
        </div>
      </div>
      <div className="mt-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{cfg.retainedLabel}</p>
        <p className="mt-2 font-serif text-4xl text-fg sm:text-5xl">{inr(retained)}</p>
      </div>
    </article>
  );
}
