import { useEffect, useState } from "react";
import { SellerDashboard } from "../../components/sections/SellerDashboard";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { deleteListing, fetchMyListings, type SellerListing, type SellerMetrics } from "../../lib/api";
import { ui } from "../../config/ui";

const empty: SellerMetrics = { views: 0, views_delta: 0, offers: 0, insight: "" };

export function SellPage() {
  const [items, setItems] = useState<SellerListing[]>([]);
  const [metrics, setMetrics] = useState<SellerMetrics>(empty);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void fetchMyListings().then((data) => {
      if (data) {
        setItems(data.items);
        setMetrics(data.metrics);
      }
      setLoading(false);
    });
  }, []);

  async function onDelete() {
    if (pending == null) return;
    setDeleting(true);
    const { ok } = await deleteListing(pending);
    if (ok) setItems((rows) => rows.filter((row) => row.id !== pending));
    setDeleting(false);
    setPending(null);
  }

  return (
    <>
      <SellerDashboard items={items} metrics={metrics} loading={loading} onDelete={setPending} />
      <ConfirmDialog
        open={pending != null}
        title={ui.property.deleteTitle}
        body={ui.property.deleteConfirm}
        confirm={ui.property.deleteListing}
        cancel={ui.property.cancelEdit}
        busy={deleting}
        onConfirm={() => void onDelete()}
        onCancel={() => {
          if (!deleting) setPending(null);
        }}
      />
    </>
  );
}
