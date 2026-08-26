import type { InputHTMLAttributes, ReactNode } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  icon?: ReactNode;
};

export function Toggle({ label, icon, className = "", id, checked = false, ...props }: Props) {
  return (
    <label htmlFor={id} className={`flex cursor-pointer items-center gap-3 ${className}`}>
      <span className="relative inline-block h-5 w-9 shrink-0">
        <input id={id} type="checkbox" className="sr-only" checked={checked} {...props} />
        <span className={`absolute inset-0 rounded-full ${checked ? "bg-verify" : "bg-line"}`} />
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-surface transition-transform ${checked ? "translate-x-4" : ""}`}
        />
      </span>
      {icon}
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{label}</span>
    </label>
  );
}
