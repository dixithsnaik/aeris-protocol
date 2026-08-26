import type { ReactNode } from "react";
import mark from "../../assets/logo.svg";

type Props = {
  children: ReactNode;
  className?: string;
  size?: "lg" | "sm";
};

const sizes = {
  lg: { text: "text-[2.35rem] tracking-[0.22em] sm:text-[2.6rem]", mark: "h-9 w-auto sm:h-10" },
  sm: { text: "text-lg tracking-[0.2em] sm:text-xl", mark: "h-6 w-auto" },
};

export function Logo({ children, className = "", size = "lg" }: Props) {
  const s = sizes[size];
  return (
    <span className={`inline-flex items-center gap-2 font-serif font-bold leading-none text-brand sm:gap-3 ${s.text} ${className}`}>
      <img src={mark} alt="" className={`shrink-0 ${s.mark}`} />
      {children}
    </span>
  );
}
