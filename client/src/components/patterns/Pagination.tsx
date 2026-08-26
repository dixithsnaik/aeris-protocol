import { Button } from "../ui/Button";
import { ui } from "../../config/ui";

type Props = {
  page: number;
  pages: number;
  onPage: (page: number) => void;
};

export function Pagination({ page, pages, onPage }: Props) {
  if (pages <= 1) return null;
  const copy = ui.discover;
  return (
    <nav className="flex flex-wrap items-center justify-center gap-2" aria-label={copy.pagination}>
      <Button variant="outline" className="px-4 py-2" disabled={page === 1} onClick={() => onPage(page - 1)}>
        {copy.prev}
      </Button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          aria-current={n === page ? "page" : undefined}
          className={`min-w-10 px-3 py-2 font-mono text-xs ${n === page ? "bg-brand text-brand-fg" : "bg-panel text-fg"}`}
          onClick={() => onPage(n)}
        >
          {n}
        </button>
      ))}
      <Button variant="outline" className="px-4 py-2" disabled={page === pages} onClick={() => onPage(page + 1)}>
        {copy.next}
      </Button>
    </nav>
  );
}
