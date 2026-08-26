import type { ReactNode } from "react";
import chevron from "../../assets/property/chevron.svg";
import { Icon } from "../ui/Icon";

type Props = {
  title: ReactNode;
  children?: ReactNode;
  open?: boolean;
};

export function Accordion({ title, children, open }: Props) {
  return (
    <details open={open} className="group border-b border-line">
      <summary className="flex cursor-pointer list-none items-center gap-3 py-4 font-mono text-sm text-fg [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">{title}</span>
        {children ? (
          <Icon src={chevron} size={12} className="shrink-0 transition group-open:rotate-180" />
        ) : null}
      </summary>
      {children ? <div className="pb-4 font-mono text-xs text-muted">{children}</div> : null}
    </details>
  );
}
