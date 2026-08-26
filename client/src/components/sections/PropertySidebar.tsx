import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import overview from "../../assets/property/overview.svg";
import contracts from "../../assets/property/contracts.svg";
import financials from "../../assets/property/financials.svg";
import timeline from "../../assets/property/timeline.svg";
import support from "../../assets/property/support.svg";
import chevron from "../../assets/property/chevron.svg";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Icon } from "../ui/Icon";
import { ui } from "../../config/ui";
import { paths, propertyBackPath, propertyPath, type PropertyTab } from "../../config/routes";
import { deleteListing, mediaUrl, type Property } from "../../lib/api";
import { propertyCode } from "../../lib/propertyDetail";

const icons: Record<string, string> = {
  overview,
  contracts,
  financials,
  timeline,
  support,
};

type Props = {
  item: Property;
};

export function PropertySidebar({ item }: Props) {
  const copy = ui.property;
  const location = useLocation();
  const navigate = useNavigate();
  const owned = Boolean(item.owned);
  const [askDelete, setAskDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const backTo = propertyBackPath((location.state as { from?: string } | null)?.from);
  const backLabel =
    backTo === paths.profile ? copy.backProfile : backTo === paths.sell ? ui.sell.back : copy.back;

  function onEdit() {
    navigate(propertyPath(item.id, "overview"), {
      state: { ...(location.state && typeof location.state === "object" ? location.state : {}), edit: true },
    });
  }

  async function onDelete() {
    setDeleting(true);
    const { ok } = await deleteListing(item.id);
    if (ok) {
      navigate(backTo, { replace: true });
      return;
    }
    setDeleting(false);
    setAskDelete(false);
  }

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-line bg-surface md:h-full md:w-64 md:border-r md:border-b-0">
      <Link
        to={backTo}
        className="mx-3 mt-4 flex items-center gap-3 px-3 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-fg hover:bg-panel"
      >
        <Icon src={chevron} size={16} className="rotate-90" />
        {backLabel}
      </Link>
      <div className="px-5 pt-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{copy.idLabel}</p>
        <p className="mt-1 font-mono text-xs text-fg">{propertyCode(item.id)}</p>
        <img
          src={mediaUrl(item.image_url)}
          alt=""
          className="mt-4 h-16 w-16 object-cover"
        />
      </div>
      <nav className="mt-6 flex gap-1 overflow-x-auto px-3 md:flex-col md:overflow-visible">
        {copy.nav.map((row) => (
          <NavLink
            key={row.id}
            to={propertyPath(item.id, row.id as PropertyTab)}
            state={location.state}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] whitespace-nowrap ${
                isActive ? "bg-ink text-surface" : "text-badge"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon src={icons[row.id]} size={16} className={isActive ? "brightness-0 invert" : ""} />
                {row.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-2 p-4">
        <NavLink
          to={propertyPath(item.id, "message")}
          state={location.state}
          className={({ isActive }) =>
            `block w-full px-3 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.2em] ${
              isActive ? "bg-ink text-surface" : "border border-line bg-surface text-fg"
            }`
          }
        >
          {owned ? copy.desk : copy.message}
        </NavLink>
        {owned ? (
          <div className="flex gap-2">
            <Button variant="outline" className="min-w-0 flex-1 px-2 py-2 text-[10px] tracking-[0.12em] sm:text-[10px]" onClick={onEdit}>
              {copy.editListing}
            </Button>
            <Button variant="danger" className="min-w-0 flex-1 px-2 py-2 text-[10px] tracking-[0.12em] sm:text-[10px]" onClick={() => setAskDelete(true)}>
              {copy.deleteListing}
            </Button>
          </div>
        ) : null}
      </div>
      <ConfirmDialog
        open={askDelete}
        title={copy.deleteTitle}
        body={copy.deleteConfirm}
        confirm={copy.deleteListing}
        cancel={copy.cancelEdit}
        busy={deleting}
        onConfirm={() => void onDelete()}
        onCancel={() => setAskDelete(false)}
      />
    </aside>
  );
}
