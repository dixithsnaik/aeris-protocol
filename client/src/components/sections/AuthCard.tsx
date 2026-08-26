import type { ReactNode } from "react";
import { Badge } from "../ui/Badge";
import { Logo } from "../ui/Logo";

type Props = {
  brand: string;
  tagline: string;
  kyc: string;
  children: ReactNode;
};

export function AuthCard({ brand, tagline, kyc, children }: Props) {
  return (
    <div className="flex w-full max-w-90 flex-col items-center border border-line bg-surface px-7 py-10 sm:max-w-96 sm:px-12 sm:py-14">
      <header className="mb-12 text-center sm:mb-14">
        <Logo>{brand}</Logo>
        <p className="mt-3 font-serif text-sm text-fg">{tagline}</p>
      </header>
      <div className="flex w-full flex-col items-center gap-10">{children}</div>
      <div className="mt-12 sm:mt-14">
        <Badge>{kyc}</Badge>
      </div>
    </div>
  );
}
