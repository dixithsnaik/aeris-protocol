import { Link } from "react-router-dom";
import eye from "../../assets/sell/eye.svg";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { ListingTable } from "../patterns/ListingTable";
import { paths } from "../../config/routes";
import { ui } from "../../config/ui";
import type { SellerListing, SellerMetrics } from "../../lib/api";

type Props = {
  items: SellerListing[];
  metrics: SellerMetrics;
  loading: boolean;
  onDelete?: (id: number) => void;
};

export function SellerDashboard({ items, metrics, loading, onDelete }: Props) {
  const copy = ui.sell;
  return (
    <div className="flex-1 overflow-y-auto">
      <section className="bg-surface px-4 py-8 text-fg sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl">{copy.title}</h1>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-muted">{copy.subtitle}</p>
            </div>
            <Link to={paths.sellNew}>
              <Button className="px-4 py-2">{copy.add}</Button>
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="border border-line bg-surface p-5 text-fg">
              <div className="flex items-start justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{copy.views}</p>
                <Icon src={eye} size={18} />
              </div>
              <p className="mt-3 font-serif text-4xl">{metrics.views.toLocaleString("en-IN")}</p>
              <p className="mt-2 font-mono text-xs text-success">
                ↑ {metrics.views_delta}% {copy.viewsDelta}
              </p>
            </article>
            <article className="border border-line bg-surface p-5 text-fg">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{copy.offers}</p>
              <p className="mt-3 font-serif text-4xl">{String(metrics.offers).padStart(2, "0")}</p>
              <p className="mt-2 font-mono text-xs text-muted">{copy.offersHint}</p>
            </article>
            <article className="relative overflow-hidden bg-brand p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-fg/80">{copy.insight}</p>
              <p className="mt-3 font-serif text-lg text-brand-fg">{metrics.insight}</p>
            </article>
          </div>
        </div>
      </section>
      <section className="px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-2xl text-fg">{copy.listings}</h2>
          {loading ? (
            <p className="mt-6 font-mono text-sm text-muted">{copy.loading}</p>
          ) : items.length === 0 ? (
            <p className="mt-6 font-mono text-sm text-muted">{copy.empty}</p>
          ) : (
            <ListingTable items={items} from={paths.sell} onDelete={onDelete} />
          )}
        </div>
      </section>
    </div>
  );
}
