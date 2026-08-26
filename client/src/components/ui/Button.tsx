import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "outline" | "inverse" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
};

const variants: Record<Variant, string> = {
  primary: "bg-brand text-brand-fg",
  outline: "border border-line bg-surface text-fg",
  inverse: "bg-fg text-surface",
  danger: "bg-danger text-brand-fg",
};

export function Button({
  children,
  className = "",
  type = "button",
  variant = "primary",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] sm:text-sm ${variants[variant]} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
