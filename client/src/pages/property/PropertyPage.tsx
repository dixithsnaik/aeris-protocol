import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useParams } from "react-router-dom";
import { PropertySidebar } from "../../components/sections/PropertySidebar";
import { paths, propertyBackPath } from "../../config/routes";
import { ui } from "../../config/ui";
import { fetchProperty, type Property } from "../../lib/api";
import { lawyerPending } from "../../lib/propertyDetail";

export type PropertyOutlet = { item: Property; onItem: (item: Property) => void };

export function PropertyPage() {
  const { id } = useParams();
  const location = useLocation();
  const backTo = propertyBackPath((location.state as { from?: string } | null)?.from);
  const [item, setItem] = useState<Property | null>(null);
  const [missing, setMissing] = useState(false);
  const copy = ui.property;

  useEffect(() => {
    const n = Number(id);
    setItem(null);
    setMissing(false);
    if (!Number.isInteger(n) || n < 1) {
      setMissing(true);
      return;
    }
    void fetchProperty(n).then((row) => {
      if (!row) setMissing(true);
      else setItem(row);
    });
  }, [id]);

  const pendingId = item && lawyerPending(item) ? item.id : 0;
  useEffect(() => {
    if (!pendingId) return;
    const tick = window.setInterval(() => {
      void fetchProperty(pendingId).then((row) => {
        if (row) setItem(row);
      });
    }, 5000);
    return () => window.clearInterval(tick);
  }, [pendingId]);

  if (missing) {
    return (
      <div className="flex flex-1 flex-col items-start gap-4 bg-surface px-4 py-16 sm:px-8">
        <p className="font-mono text-sm text-muted">{copy.missing}</p>
        <Link to={backTo} className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg underline">
          {backTo === paths.profile ? copy.backProfile : backTo === paths.sell ? ui.sell.back : copy.back}
        </Link>
      </div>
    );
  }

  if (!item) {
    return (
      <p className="flex-1 bg-surface px-4 py-16 font-mono text-sm text-muted sm:px-8">{copy.loading}</p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface md:h-full md:flex-row md:overflow-hidden">
      <PropertySidebar item={item} />
      <div className="min-h-0 min-w-0 flex-1 px-4 py-8 sm:px-8 md:overflow-y-auto">
        <Outlet context={{ item, onItem: setItem } satisfies PropertyOutlet} />
      </div>
    </div>
  );
}
