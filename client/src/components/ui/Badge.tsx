import type { ReactNode } from "react";
import badge from "../../assets/badge.svg";

type Props = {
  children: ReactNode;
};

export function Badge({ children }: Props) {
  return (
    <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-badge">
      <img src={badge} alt="" width={15} height={15} />
      {children}
    </p>
  );
}
