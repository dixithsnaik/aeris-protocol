import { paths } from "../config/routes";

const allowed = new Set<string>([paths.buy, paths.sell, paths.sellNew, paths.profile, paths.home]);

export function safeNext(raw: unknown) {
  if (typeof raw !== "string") return paths.home;
  if (allowed.has(raw)) return raw;
  if (raw.startsWith(`${paths.buy}/`) && !raw.includes("://")) return raw;
  if (raw.startsWith(`${paths.sell}/`) && !raw.includes("://")) return raw;
  return paths.home;
}
