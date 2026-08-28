import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import user from "../../assets/landing/user.svg";
import { SearchBar } from "../patterns/SearchBar";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Logo } from "../ui/Logo";
import { NotificationBell } from "./NotificationBell";
import { fetchProperties, type Property } from "../../lib/api";
import { getToken } from "../../lib/session";
import { buyPath, paths, propertyPath } from "../../config/routes";
import { ui } from "../../config/ui";

export function SiteHeader() {
  const navigate = useNavigate();
  const signedIn = Boolean(getToken());
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Property[]>([]);
  const [open, setOpen] = useState(false);
  const req = useRef(0);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setHits([]);
      setOpen(false);
      return;
    }
    const id = ++req.current;
    const timer = window.setTimeout(() => {
      void fetchProperties({
        q: query,
        maxBudget: "",
        configs: [],
        verified: false,
        offset: 0,
        limit: 3,
      }).then((data) => {
        if (id !== req.current) return;
        setHits(data?.items ?? []);
        setOpen(true);
      });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    function hide(event: MouseEvent) {
      if ((event.target as HTMLElement).closest("[data-header-search]")) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", hide);
    return () => document.removeEventListener("mousedown", hide);
  }, []);

  function goSearch() {
    setOpen(false);
    navigate(buyPath(q));
  }

  function goProperty(item: Property) {
    setOpen(false);
    navigate(propertyPath(item.id));
  }

  const searchProps = {
    placeholder: ui.landing.searchPlaceholder,
    value: q,
    hits,
    open,
    viewMoreLabel: ui.landing.viewMore,
    onChange: setQ,
    onSubmit: goSearch,
    onViewMore: goSearch,
    onPick: goProperty,
    onOpenChange: setOpen,
  };

  return (
    <header className="border-b border-line  px-4 py-3 sm:px-8">
      <div className="mx-auto flex max-w-6xl items-center gap-3 sm:gap-4">
        <Link to={paths.home} className="shrink-0">
          <Logo size="lg">{ui.brand}</Logo>
        </Link>
        {ui.header.nav.length > 0 ? (
          <nav className="flex items-center gap-3">
            {ui.header.nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg whitespace-nowrap sm:text-[11px]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
        <div className="hidden min-w-0 flex-1 sm:ml-auto sm:block sm:max-w-96">
          <SearchBar {...searchProps} listId="header-search-hits-desktop" />
        </div>
        <div className="ml-auto flex items-center gap-3 sm:ml-0">
          <NotificationBell />
          <button
            type="button"
            className="p-1"
            aria-label="Account"
            onClick={() => navigate(signedIn ? paths.profile : paths.login, { state: signedIn ? undefined : { from: paths.profile } })}
          >
            <Icon src={user} size={20} />
          </button>
          {signedIn ? null : (
            <Button className="px-4 py-2" onClick={() => navigate(paths.login, { state: { from: paths.home } })}>
              {ui.landing.signIn}
            </Button>
          )}
        </div>
      </div>
      <div className="mx-auto mt-3 max-w-6xl sm:hidden">
        <SearchBar {...searchProps} listId="header-search-hits-mobile" />
      </div>
    </header>
  );
}
