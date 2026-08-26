import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full bg-transparent py-2 font-mono text-sm text-fg outline-none placeholder:text-muted ${className}`}
      {...props}
    />
  );
}
