import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import bell from "../../assets/landing/bell.svg";
import { NotificationPanel } from "../patterns/NotificationPanel";
import { Icon } from "../ui/Icon";
import { ui } from "../../config/ui";
import { paths } from "../../config/routes";
import { fetchNotices, markNoticesRead, type Notice } from "../../lib/api";
import { getToken } from "../../lib/session";

export function NotificationBell() {
  const navigate = useNavigate();
  const location = useLocation();
  const signedIn = Boolean(getToken());
  const copy = ui.notifications;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!signedIn) {
      setItems([]);
      setUnread(0);
      return;
    }
    let alive = true;
    function load() {
      void fetchNotices().then((data) => {
        if (!alive) return;
        setItems(data.items);
        setUnread(data.unread);
      });
    }
    load();
    const timer = window.setInterval(load, 20_000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [signedIn]);

  useEffect(() => {
    function hide(event: MouseEvent) {
      if (box.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", hide);
    return () => document.removeEventListener("mousedown", hide);
  }, []);

  function toggle() {
    if (!signedIn) {
      navigate(paths.login, { state: { from: location.pathname } });
      return;
    }
    setOpen((on) => !on);
  }

  async function onPick(item: Notice) {
    setOpen(false);
    if (!item.read) {
      await markNoticesRead([item.id]);
      setItems((rows) => rows.map((row) => (row.id === item.id ? { ...row, read: true } : row)));
      setUnread((n) => Math.max(0, n - 1));
    }
    if (item.href.startsWith("/")) navigate(item.href);
  }

  async function onMarkAll() {
    await markNoticesRead();
    setItems((rows) => rows.map((row) => ({ ...row, read: true })));
    setUnread(0);
  }

  const count = unread > 9 ? "9+" : String(unread);

  return (
    <div className="relative" ref={box} data-header-notes>
      <button type="button" className="relative p-1" aria-label={copy.label} aria-expanded={open} onClick={toggle}>
        <Icon src={bell} size={18} />
        {signedIn && unread > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 bg-brand px-1 text-center font-mono text-[9px] leading-4 text-brand-fg">
            {count}
          </span>
        ) : null}
      </button>
      {open && signedIn ? (
        <NotificationPanel items={items} empty={copy.empty} markAll={copy.markAll} onPick={(row) => void onPick(row)} onMarkAll={() => void onMarkAll()} />
      ) : null}
    </div>
  );
}
