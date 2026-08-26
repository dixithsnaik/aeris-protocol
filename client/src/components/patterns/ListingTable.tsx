import { Link } from "react-router-dom";
import { propertyPath } from "../../config/routes";
import { ui } from "../../config/ui";
import type { SellerListing } from "../../lib/api";
import { inr } from "../../lib/money";
import { propertyCode } from "../../lib/propertyDetail";

const statusChip: Record<string, string> = {
  verified: "border-fg text-fg",
  pending: "border-fg text-fg",
  unverified: "border-fg text-fg",
  negotiation: "border-fg text-fg",
};

const statusLabel: Record<string, string> = {
  verified: ui.sell.live,
  pending: ui.sell.pending,
  unverified: ui.sell.unverified,
  negotiation: ui.sell.negotiation,
};

type Props = {
  items: SellerListing[];
  from: string;
  onRemove?: (id: number) => void;
  onDelete?: (id: number) => void;
};

export function ListingTable({ items, from, onRemove, onDelete }: Props) {
  const copy = ui.sell;
  const profile = ui.profile;
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left">
        <thead>
          <tr className="border-b border-line font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            <th className="py-3 font-normal">{copy.colProperty}</th>
            <th className="py-3 font-normal">{copy.colPrice}</th>
            <th className="py-3 font-normal">{copy.colStatus}</th>
            <th className="py-3 text-right font-normal">{copy.colActions}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-line">
              <td className="py-4">
                <p className="font-serif text-lg text-fg">{item.title}</p>
                <p className="font-mono text-[11px] text-muted">ID: {propertyCode(item.id)}</p>
              </td>
              <td className="py-4 font-mono text-sm text-fg">{inr(item.price)}</td>
              <td className="py-4">
                <span
                  className={`inline-block border px-3 py-1 font-mono text-xs uppercase tracking-[0.12em] ${statusChip[item.listing_status]}`}
                >
                  {statusLabel[item.listing_status]}
                </span>
              </td>
              <td className="py-4 text-right">
                <div className="flex justify-end gap-4">
                  <Link
                    to={propertyPath(item.id)}
                    state={{ from }}
                    className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg underline"
                  >
                    {profile.view}
                  </Link>
                  {onRemove ? (
                    <button
                      type="button"
                      className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted underline"
                      onClick={() => onRemove(item.id)}
                    >
                      {profile.remove}
                    </button>
                  ) : null}
                  {onDelete ? (
                    <button
                      type="button"
                      className="font-mono text-[11px] uppercase tracking-[0.16em] text-danger underline"
                      onClick={() => onDelete(item.id)}
                    >
                      {copy.delete}
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
