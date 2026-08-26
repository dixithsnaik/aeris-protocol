import type { InputHTMLAttributes, ReactNode } from "react";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  prefix?: ReactNode;
  error?: string;
};

export function Field({ label, id, prefix, error = "", className = "", ...props }: Props) {
  const describedBy = error ? `${id}-error` : undefined;
  return (
    <div className="w-full">
      <Label htmlFor={id}>{label}</Label>
      <div
        className={`flex items-baseline gap-2 border-b ${error ? "border-danger" : "border-line focus-within:border-fg"}`}
      >
        {prefix ? <span className="shrink-0 font-mono text-sm text-muted">{prefix}</span> : null}
        <Input
          id={id}
          className={className}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
      </div>
      <p id={describedBy} className="mt-2 min-h-4 font-mono text-[11px] leading-4 text-danger">
        {error}
      </p>
    </div>
  );
}
