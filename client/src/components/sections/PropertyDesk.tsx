import { useEffect, useState, type FormEvent } from "react";
import { Button } from "../ui/Button";
import { Label } from "../ui/Label";
import { ui } from "../../config/ui";
import { fetchDesk, fetchThread, sendChat, type ChatLine, type DeskContact, type Property } from "../../lib/api";
import { inr } from "../../lib/money";

type Props = {
  item: Property;
};

function label(row: DeskContact) {
  return row.name || row.phone || `Buyer ${row.id}`;
}

export function PropertyDesk({ item }: Props) {
  const copy = ui.property;
  const [people, setPeople] = useState<DeskContact[]>([]);
  const [buyerId, setBuyerId] = useState<number | null>(null);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void fetchDesk(item.id).then((rows) => {
      setPeople(rows);
      setBuyerId((current) => current ?? rows[0]?.id ?? null);
      setLoading(false);
    });
  }, [item.id]);

  useEffect(() => {
    if (!buyerId) {
      setLines([]);
      return;
    }
    void fetchThread(item.id, buyerId).then(setLines);
  }, [item.id, buyerId]);

  async function onSend(event: FormEvent) {
    event.preventDefault();
    if (!buyerId || !body.trim() || busy) return;
    setBusy(true);
    const { ok } = await sendChat(item.id, body.trim(), buyerId);
    setBusy(false);
    if (!ok) return;
    setBody("");
    const [thread, desk] = await Promise.all([fetchThread(item.id, buyerId), fetchDesk(item.id)]);
    setLines(thread);
    setPeople(desk);
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-fg sm:text-4xl">{copy.deskTitle}</h1>
      <p className="mt-2 max-w-xl font-mono text-xs text-muted">{copy.deskBody}</p>
      <p className="mt-3 font-mono text-sm text-fg">
        {copy.ask} {inr(item.price)}
      </p>
      {loading ? (
        <p className="mt-8 font-mono text-sm text-muted">{ui.property.loading}</p>
      ) : people.length === 0 ? (
        <p className="mt-8 font-mono text-sm text-muted">{copy.deskEmpty}</p>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[18rem_1fr]">
          <ul className="flex flex-col gap-1">
            {people.map((row) => {
              const on = buyerId === row.id;
              const pct = item.price && row.offer ? Math.round((row.offer / item.price) * 100) : 0;
              return (
              <li key={row.id}>
                <button
                  type="button"
                  className={`w-full px-3 py-3 text-left ${on ? "bg-ink text-surface" : "border border-line bg-surface text-fg"}`}
                  onClick={() => setBuyerId(row.id)}
                >
                  <p className="font-serif text-lg">{label(row)}</p>
                  {row.offer ? (
                    <p className={`mt-1 font-mono text-[11px] ${on ? "text-surface/80" : "text-fg"}`}>
                      {copy.offer} {inr(row.offer)} · {pct}% {copy.ofAsk}
                    </p>
                  ) : null}
                  <p className={`mt-1 font-mono text-[11px] ${on ? "text-surface/70" : "text-muted"}`}>
                    {row.tracking ? copy.trackingNow : copy.inChat} · {row.messages} {copy.chatCount}
                  </p>
                </button>
              </li>
              );
            })}
          </ul>
          <div>
            {buyerId ? (
              <ChatBox lines={lines} body={body} busy={busy} onBody={setBody} onSend={onSend} />
            ) : (
              <p className="font-mono text-sm text-muted">{copy.pickBuyer}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type BoxProps = {
  lines: ChatLine[];
  body: string;
  busy: boolean;
  onBody: (value: string) => void;
  onSend: (event: FormEvent) => void;
};

export function ChatBox({ lines, body, busy, onBody, onSend }: BoxProps) {
  const copy = ui.property;
  return (
    <div>
      <div className="flex max-h-80 flex-col gap-3 overflow-y-auto border border-line bg-surface p-4">
        {lines.length === 0 ? (
          <p className="font-mono text-xs text-muted">{copy.threadEmpty}</p>
        ) : (
          lines.map((row) => (
            <p
              key={row.id}
              className={`max-w-[85%] font-mono text-sm ${row.mine ? "ml-auto bg-brand px-3 py-2 text-brand-fg" : "bg-panel px-3 py-2 text-fg"}`}
            >
              {row.body}
            </p>
          ))
        )}
      </div>
      <form className="mt-4 flex flex-col gap-3" onSubmit={onSend}>
        <Label htmlFor="desk-body">{copy.bodyLabel}</Label>
        <textarea
          id="desk-body"
          required
          rows={4}
          value={body}
          onChange={(e) => onBody(e.target.value)}
          className="w-full resize-y border border-line bg-surface p-3 font-mono text-sm text-fg outline-none focus:border-fg"
        />
        <Button type="submit" variant="primary" className="self-start px-4 py-2" disabled={busy}>
          {copy.send}
        </Button>
      </form>
    </div>
  );
}
