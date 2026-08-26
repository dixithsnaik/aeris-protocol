import { useEffect, useState, type FormEvent } from "react";
import { ChatBox } from "./PropertyDesk";
import { ui } from "../../config/ui";
import { propertyPath } from "../../config/routes";
import { fetchMe, fetchThread, sendChat, type ChatLine, type Property } from "../../lib/api";
import { useAuthGo } from "../../lib/useAuthGo";
import { getToken } from "../../lib/session";

type Props = {
  item: Property;
};

export function PropertyMessage({ item }: Props) {
  const copy = ui.property;
  const go = useAuthGo();
  const [meId, setMeId] = useState<number | null>(null);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!getToken()) return;
    void fetchMe().then((me) => {
      if (!me) return;
      setMeId(me.id);
      void fetchThread(item.id, me.id).then(setLines);
    });
  }, [item.id]);

  async function onSend(event: FormEvent) {
    event.preventDefault();
    if (!getToken()) {
      go(propertyPath(item.id, "message"));
      return;
    }
    if (!body.trim() || busy) return;
    setBusy(true);
    const { ok } = await sendChat(item.id, body.trim());
    setBusy(false);
    if (!ok) return;
    setBody("");
    if (meId) setLines(await fetchThread(item.id, meId));
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-serif text-3xl text-fg sm:text-4xl">{copy.messageTitle}</h1>
      <p className="mt-2 font-mono text-xs text-muted">{copy.messageBody}</p>
      <div className="mt-8">
        <ChatBox lines={lines} body={body} busy={busy} onBody={setBody} onSend={onSend} />
      </div>
    </div>
  );
}
