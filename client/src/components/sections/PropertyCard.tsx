import { useNavigate } from "react-router-dom";
import shield from "../../assets/discover/shield.svg";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { ui } from "../../config/ui";
import { propertyPath } from "../../config/routes";
import { mediaUrl, type Property } from "../../lib/api";
import { inr } from "../../lib/money";

type Props = {
  item: Property;
  large?: boolean;
};

function area(n: number) {
  return `${new Intl.NumberFormat("en-IN").format(n)} sqft`;
}

export function PropertyCard({ item, large = false }: Props) {
  const copy = ui.discover;
  const navigate = useNavigate();
  const open = () => navigate(propertyPath(item.id));
  return (
    <article className="flex h-full flex-col bg-surface">
      <div className="relative h-52 overflow-hidden sm:h-64">
        <img src={mediaUrl(item.image_url)} alt="" className="h-full w-full object-cover" />
        {item.verified ? (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-brand px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-brand-fg">
            <Icon src={shield} size={10} />
            Verified
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className={`flex gap-4 ${large ? "items-start justify-between" : "flex-col"}`}>
          <div>
            <h2 className="font-serif text-xl text-fg sm:text-2xl">{item.title}</h2>
            <p className="mt-1 font-mono text-xs text-muted">{item.location}</p>
          </div>
          {large ? (
            <div className="shrink-0 text-right">
              <p className="font-mono text-sm font-medium text-fg">{inr(item.price)}</p>
              <p className="mt-1 font-mono text-[11px] text-muted">
                {copy.yieldLabel}: {item.yield_pct.toFixed(1)}%
              </p>
            </div>
          ) : (
            <p className="font-mono text-xs text-fg">
              {copy.price}: {inr(item.price)}
            </p>
          )}
        </div>
        {large ? (
          <p className="font-mono text-xs text-muted">
            {copy.area}: {area(item.area_sqft)}
            <span className="mx-3 text-line">|</span>
            {copy.status}: {item.status}
          </p>
        ) : (
          <p className="font-mono text-xs text-muted">
            {copy.area}: {area(item.area_sqft)}
          </p>
        )}
        <div className={`mt-auto ${large ? "flex justify-end" : ""}`}>
          {large ? (
            <button
              type="button"
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg underline"
              onClick={open}
            >
              {copy.viewDetails}
            </button>
          ) : (
            <Button variant="outline" className="w-full px-4 py-2" onClick={open}>
              {copy.analyze}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
