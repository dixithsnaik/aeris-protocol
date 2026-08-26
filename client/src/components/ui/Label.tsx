import type { LabelHTMLAttributes, ReactNode } from "react";

type Props = LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode;
};

export function Label({ children, className = "", ...props }: Props) {
  return (
    <label
      className={`mb-3 block font-mono text-[11px] uppercase tracking-[0.2em] text-fg ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
