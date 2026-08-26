import type { Notice } from "../../lib/api";

type Props = {
  items: Notice[];
  empty: string;
  markAll: string;
  onPick: (item: Notice) => void;
  onMarkAll: () => void;
};

function ago(iso: string) {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (!Number.isFinite(s) || s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function NotificationPanel({ items, empty, markAll, onPick, onMarkAll }: Props) {
  const unread = items.some((row) => !row.read);
  return (
    <div className="absolute right-0 z-30 mt-1 w-[min(22rem,calc(100vw-2rem))] border border-line bg-surface">
      {unread ? (
        <div className="flex justify-end border-b border-line px-3 py-2">
          <button type="button" className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand" onClick={onMarkAll}>
            {markAll}
          </button>
        </div>
      ) : null}
      {items.length === 0 ? (
        <p className="px-3 py-6 font-mono text-xs text-muted">{empty}</p>
      ) : (
        <ul className="max-h-80 overflow-y-auto py-1">
          {items.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className={`flex w-full flex-col gap-1 px-3 py-2.5 text-left hover:bg-panel ${row.read ? "" : "bg-panel"}`}
                onClick={() => onPick(row)}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-xs text-fg">{row.title}</span>
                  <span className="shrink-0 font-mono text-[10px] text-muted">{ago(row.at)}</span>
                </span>
                <span className="line-clamp-2 font-mono text-[11px] text-muted">{row.body}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
