import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { paths } from "../../config/routes";
import { ui } from "../../config/ui";
import { fetchInterested, fetchMyListings, deleteListing, mediaUrl, removeInterest, type SellerListing } from "../../lib/api";
import { clearToken } from "../../lib/session";
import { ListingTable } from "../patterns/ListingTable";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { ProfileForm } from "./ProfileForm";

export function ProfileTrackLists() {
  const copy = ui.profile;
  const navigate = useNavigate();
  const [selling, setSelling] = useState<SellerListing[]>([]);
  const [watching, setWatching] = useState<SellerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;
    void Promise.all([fetchMyListings(), fetchInterested()]).then(([mine, watch]) => {
      if (!alive) return;
      setSelling(mine?.items ?? []);
      setWatching(watch);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function drop(id: number) {
    const { ok } = await removeInterest(id);
    if (ok) setWatching((rows) => rows.filter((row) => row.id !== id));
  }

  async function dropListing() {
    if (pending == null) return;
    setDeleting(true);
    const { ok } = await deleteListing(pending);
    if (ok) setSelling((rows) => rows.filter((row) => row.id !== pending));
    setDeleting(false);
    setPending(null);
  }

  const cover = selling[0]?.image_url ?? watching[0]?.image_url;

  return (
    <div className="flex-1 overflow-y-auto">
      <section className="bg-surface px-4 py-8 text-fg sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl">{copy.title}</h1>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-muted">{copy.body}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="px-4 py-2"
                onClick={() => {
                  clearToken();
                  navigate(paths.home, { replace: true });
                }}
              >
                {copy.logout}
              </Button>
              <Link to={paths.sell}>
                <Button variant="outline" className="px-4 py-2">
                  {ui.sell.title}
                </Button>
              </Link>
              <Link to={paths.sellNew}>
                <Button className="px-4 py-2">{ui.sell.add}</Button>
              </Link>
            </div>
          </div>
          <div className="mt-8">
            <ProfileForm />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <article className="border border-line bg-surface p-5 text-fg">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{copy.listed}</p>
              <p className="mt-3 font-serif text-4xl">{loading ? "—" : String(selling.length).padStart(2, "0")}</p>
              <p className="mt-2 font-mono text-xs text-muted">{copy.listedHint}</p>
            </article>
            <article className="border border-line bg-surface p-5 text-fg">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{copy.watching}</p>
              <p className="mt-3 font-serif text-4xl">{loading ? "—" : String(watching.length).padStart(2, "0")}</p>
              <p className="mt-2 font-mono text-xs text-muted">{copy.watchingHint}</p>
            </article>
            <article className="relative overflow-hidden bg-brand p-5">
              {cover ? (
                <img src={mediaUrl(cover)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
              ) : null}
              <p className="relative font-mono text-[10px] uppercase tracking-[0.16em] text-brand-fg/80">{copy.insightLabel}</p>
              <p className="relative mt-3 font-serif text-lg text-brand-fg">{copy.insight}</p>
            </article>
          </div>
        </div>
      </section>
      <section className="px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl space-y-12">
          <ListingBlock
            title={copy.selling}
            loading={loading}
            empty={copy.sellingEmpty}
            action={{ to: paths.sellNew, label: copy.addListing }}
            items={selling}
            onDelete={setPending}
          />
          <ListingBlock
            title={copy.interested}
            loading={loading}
            empty={copy.interestedEmpty}
            action={{ to: paths.buy, label: copy.browse }}
            items={watching}
            onRemove={drop}
          />
        </div>
      </section>
      <ConfirmDialog
        open={pending != null}
        title={ui.property.deleteTitle}
        body={ui.property.deleteConfirm}
        confirm={ui.property.deleteListing}
        cancel={ui.property.cancelEdit}
        busy={deleting}
        onConfirm={() => void dropListing()}
        onCancel={() => {
          if (!deleting) setPending(null);
        }}
      />
    </div>
  );
}

type BlockProps = {
  title: string;
  loading: boolean;
  empty: string;
  action: { to: string; label: string };
  items: SellerListing[];
  onRemove?: (id: number) => void;
  onDelete?: (id: number) => void;
};

function ListingBlock({ title, loading, empty, action, items, onRemove, onDelete }: BlockProps) {
  return (
    <div>
      <h2 className="font-serif text-2xl text-fg">{title}</h2>
      {loading ? (
        <p className="mt-6 font-mono text-sm text-muted">{ui.profile.loading}</p>
      ) : items.length === 0 ? (
        <p className="mt-6 font-mono text-sm text-muted">
          {empty}{" "}
          <Link to={action.to} className="text-fg underline">
            {action.label}
          </Link>
        </p>
      ) : (
        <ListingTable items={items} from={paths.profile} onRemove={onRemove} onDelete={onDelete} />
      )}
    </div>
  );
}
