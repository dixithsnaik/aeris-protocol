import { useEffect, useRef } from "react";
import { Button } from "./Button";

type Props = {
  open: boolean;
  title: string;
  body: string;
  confirm: string;
  cancel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ open, title, body, confirm, cancel, busy, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="m-auto w-[min(24rem,calc(100%-2rem))] border-0 bg-transparent p-0 text-fg backdrop:bg-fg/40"
      onCancel={(event) => {
        if (busy) event.preventDefault();
      }}
      onClose={() => {
        if (!busy) onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div className="border border-line bg-surface p-6">
        <h2 className="font-serif text-2xl text-fg">{title}</h2>
        <p className="mt-2 font-mono text-xs text-muted">{body}</p>
        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="min-w-0 flex-1 px-4 py-2" disabled={busy} onClick={onCancel}>
            {cancel}
          </Button>
          <Button variant="danger" className="min-w-0 flex-1 px-4 py-2" disabled={busy} onClick={onConfirm}>
            {confirm}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
