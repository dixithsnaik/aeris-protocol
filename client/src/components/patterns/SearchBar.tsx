import { Input } from "../ui/Input";
import { Icon } from "../ui/Icon";
import search from "../../assets/landing/search.svg";
import { mediaUrl, type Property } from "../../lib/api";
import { inr } from "../../lib/money";

type Props = {
  placeholder?: string;
  value: string;
  hits: Property[];
  open: boolean;
  viewMoreLabel: string;
  listId: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onViewMore: () => void;
  onPick?: (item: Property) => void;
  onOpenChange: (open: boolean) => void;
};

export function SearchBar({
  placeholder = "Search properties...",
  value,
  hits,
  open,
  viewMoreLabel,
  listId,
  onChange,
  onSubmit,
  onViewMore,
  onPick,
  onOpenChange,
}: Props) {
  const show = open && value.trim().length >= 2;

  return (
    <form
      data-header-search
      className="relative min-w-0"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label className="flex min-w-0 items-center gap-2 rounded-full border border-line bg-surface px-4 py-2">
        <Icon src={search} size={16} />
        <Input
          type="search"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          className="min-w-0 py-0 text-xs sm:text-sm"
          aria-label={placeholder}
          aria-expanded={show}
          aria-controls={listId}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (value.trim().length >= 2) onOpenChange(true);
          }}
        />
      </label>
      {show ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-md bg-surface py-1"
        >
          {hits.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-panel"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => (onPick ? onPick(item) : onViewMore())}
              >
                <img src={mediaUrl(item.image_url)} alt="" className="h-10 w-10 shrink-0 object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-sm text-fg">{item.title}</span>
                  <span className="block truncate font-mono text-[11px] text-muted">{item.location}</span>
                </span>
                <span className="shrink-0 font-mono text-xs text-fg">{inr(item.price)}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="w-full px-3 py-2 text-left font-mono text-sm text-brand hover:bg-panel"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onViewMore}
            >
              {viewMoreLabel}
            </button>
          </li>
        </ul>
      ) : null}
    </form>
  );
}
