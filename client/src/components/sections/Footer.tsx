import { Logo } from "../ui/Logo";
import { ui } from "../../config/ui";

export function Footer() {
  return (
    <footer className="mt-auto w-full shrink-0 border-t border-line bg-surface px-5 py-5 sm:px-8 sm:py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 lg:flex-row lg:justify-between lg:gap-8">
        <Logo size="sm">{ui.brand}</Logo>
        <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2">
          {ui.footer.links.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-fg sm:text-[11px]"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.12em] text-muted lg:text-right">
          {ui.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
