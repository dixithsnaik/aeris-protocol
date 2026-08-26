import { Label } from "../ui/Label";

type Props = {
  id: string;
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  emptyLabel: string;
};

export function MultiSelect({ id, label, options, value, onChange, emptyLabel }: Props) {
  const summary = value.length ? value.join(", ") : emptyLabel;
  function toggle(item: string) {
    onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);
  }
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <details className="relative border-b border-line open:border-fg">
        <summary id={id} className="cursor-pointer list-none py-2 font-mono text-sm text-fg marker:hidden [&::-webkit-details-marker]:hidden">
          {summary}
        </summary>
        <div className="absolute z-20 mt-1 w-full min-w-48 bg-surface p-3">
          {options.map((item) => (
            <label key={item} className="flex cursor-pointer items-center gap-2 py-1 font-mono text-sm text-fg">
              <input
                type="checkbox"
                checked={value.includes(item)}
                onChange={() => toggle(item)}
              />
              {item}
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}
