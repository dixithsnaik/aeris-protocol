import { ui } from "../../config/ui";
import type { Property } from "../../lib/api";
import { timeline } from "../../lib/propertyDetail";

type Props = {
  item: Property;
};

export function PropertyTimeline({ item }: Props) {
  const copy = ui.property;
  const events = timeline(item);
  return (
    <div>
      <h1 className="font-serif text-3xl text-fg sm:text-4xl">{copy.timelineTitle}</h1>
      <p className="mt-2 max-w-xl font-mono text-xs text-muted">{copy.timelineBody}</p>
      <ol className="mt-8 space-y-0 border-l border-line">
        {events.map((row) => (
          <li key={row.label} className="relative py-4 pl-6">
            <span
              className={`absolute top-6 -left-[5px] h-2.5 w-2.5 rounded-full ${row.done ? "bg-ink" : "bg-line"}`}
            />
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{row.at}</p>
            <p className="mt-1 font-serif text-xl text-fg">{row.label}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
