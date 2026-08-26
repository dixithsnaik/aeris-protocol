import { useEffect, useRef, useState } from "react";
import pin from "../../assets/discover/pin.svg";
import { Icon } from "../ui/Icon";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { ui } from "../../config/ui";
import { fetchLocationSuggest, type LocationSuggestion } from "../../lib/api";

type Props = {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  corrected: string;
  onCorrected: (value: string) => void;
};

export function LocationSuggest({ id, label, value, placeholder, onChange, corrected, onCorrected }: Props) {
  const copy = ui.discover;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LocationSuggestion[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const req = useRef(0);
  const onCorrectedRef = useRef(onCorrected);
  onCorrectedRef.current = onCorrected;

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setItems([]);
      onCorrectedRef.current("");
      return;
    }
    const idn = ++req.current;
    const timer = window.setTimeout(() => {
      void fetchLocationSuggest(q).then((data) => {
        if (idn !== req.current) return;
        onCorrectedRef.current(data.corrected);
        setItems(data.suggestions);
        setOpen(data.suggestions.length > 0);
      });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    function hide(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", hide);
    return () => document.removeEventListener("mousedown", hide);
  }, []);

  function pick(text: string) {
    onChange(text);
    onCorrected("");
    setOpen(false);
    setItems([]);
  }

  return (
    <div ref={box} className="relative">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2 border-b border-line focus-within:border-fg">
        <Icon src={pin} size={16} className="shrink-0" />
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (items.length) setOpen(true);
          }}
        />
      </div>
      {corrected && corrected.toLowerCase() !== value.trim().toLowerCase() ? (
        <button
          type="button"
          className="mt-2 text-left font-mono text-[11px] text-brand underline"
          onClick={() => pick(corrected)}
        >
          {copy.didYouMean} {corrected}
        </button>
      ) : null}
      {open && items.filter((item) => item.kind !== "correct").length > 0 ? (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute z-20 mt-1 w-full bg-surface py-1"
        >
          {items
            .filter((item) => item.kind !== "correct")
            .map((item) => (
              <li key={item.text}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left font-mono text-sm text-fg hover:bg-panel"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(item.text)}
                >
                  {item.text}
                </button>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}
