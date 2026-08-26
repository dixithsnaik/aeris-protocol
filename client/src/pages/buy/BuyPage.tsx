import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DiscoverFilter } from "../../components/sections/DiscoverFilter";
import { AnalyticsDialog } from "../../components/sections/MarketAnalytics";
import { PropertyCard } from "../../components/sections/PropertyCard";
import { Pagination } from "../../components/patterns/Pagination";
import { ui } from "../../config/ui";
import {
  fetchProperties,
  type Property,
  type PropertyAnalytics,
  type PropertyFilters,
} from "../../lib/api";

const PAGE = 12;
const emptyFilters: PropertyFilters = { q: "", maxBudget: "", configs: [], verified: false };

export function BuyPage() {
  const copy = ui.discover;
  const [params, setParams] = useSearchParams();
  const qParam = params.get("q") ?? "";
  const syncedQ = useRef(qParam);
  const [draft, setDraft] = useState<PropertyFilters>(() => ({ ...emptyFilters, q: qParam }));
  const [filters, setFilters] = useState<PropertyFilters>(() => ({ ...emptyFilters, q: qParam }));
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [analytics, setAnalytics] = useState<PropertyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const req = useRef(0);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const load = useCallback(async (p: number) => {
    const id = ++req.current;
    setLoading(true);
    const data = await fetchProperties({ ...filtersRef.current, offset: (p - 1) * PAGE, limit: PAGE });
    if (id !== req.current) return;
    if (data) {
      setItems(data.items);
      setTotal(data.total);
      setAnalytics(data.analytics);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(page);
  }, [page, filters, load]);

  useEffect(() => {
    if (syncedQ.current === qParam) return;
    syncedQ.current = qParam;
    const next = { ...emptyFilters, q: qParam };
    setDraft(next);
    setFilters(next);
    setPage(1);
  }, [qParam]);

  const applyFilters = (next: PropertyFilters) => {
    const query = next.q.trim();
    syncedQ.current = query;
    setFilters(next);
    setPage(1);
    setParams(query ? { q: query } : {}, { replace: true });
  };

  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div className="flex-1 bg-bg px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-serif text-3xl text-fg sm:text-4xl">{copy.title}</h1>
        <div className="mt-6">
          <DiscoverFilter
            draft={draft}
            onDraft={setDraft}
            onApply={(next) => applyFilters(next)}
            onVerified={(verified) => {
              const next = { ...draft, verified };
              setDraft(next);
              applyFilters(next);
            }}
            onAnalytics={() => setAnalyticsOpen(true)}
            analyticsDisabled={!analytics}
          />
        </div>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          {loading && items.length === 0 ? copy.loading : `${total} listings`}
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <PropertyCard key={item.id} item={item} />
          ))}
        </div>
        {!loading && items.length === 0 ? (
          <p className="mt-10 font-mono text-sm text-muted">{copy.empty}</p>
        ) : null}
        <div className="mt-8">
          <Pagination page={page} pages={total === 0 ? 0 : pages} onPage={setPage} />
        </div>
      </div>
      <AnalyticsDialog stats={analytics} open={analyticsOpen} onClose={() => setAnalyticsOpen(false)} />
    </div>
  );
}
