import { Link, useLocation } from "react-router-dom";
import { Accordion } from "../patterns/Accordion";
import { ui } from "../../config/ui";
import { propertyPath } from "../../config/routes";
import type { Property } from "../../lib/api";

type Props = {
  item: Property;
};

export function PropertySupport({ item }: Props) {
  const copy = ui.property;
  const location = useLocation();
  return (
    <div>
      <h1 className="font-serif text-3xl text-fg sm:text-4xl">{copy.supportTitle}</h1>
      <p className="mt-2 max-w-xl font-mono text-xs text-muted">{copy.supportBody}</p>
      <p className="mt-4 font-mono text-xs text-fg">{copy.hours}</p>
      <div className="mt-8 max-w-xl bg-surface px-5">
        {copy.faqs.map((row, i) => (
          <Accordion key={row.q} open={i === 0} title={row.q}>
            <p>{row.a}</p>
          </Accordion>
        ))}
      </div>
      <Link
        to={propertyPath(item.id, "message")}
        state={location.state}
        className="mt-8 inline-block font-mono text-[11px] uppercase tracking-[0.16em] text-fg underline"
      >
        {item.owned ? copy.desk : copy.message} →
      </Link>
    </div>
  );
}
