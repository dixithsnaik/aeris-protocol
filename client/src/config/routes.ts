export const paths = {
  login: "/login",
  home: "/",
  buy: "/buy",
  sell: "/sell",
  sellNew: "/sell/new",
  profile: "/profile",
} as const;

export const propertyTabs = ["overview", "contracts", "financials", "timeline", "support", "message"] as const;
export type PropertyTab = (typeof propertyTabs)[number];

export function buyPath(q?: string) {
  const query = (q ?? "").trim();
  if (!query) return paths.buy;
  return `${paths.buy}?${new URLSearchParams({ q: query })}`;
}

export function propertyPath(id: number | string, tab: PropertyTab = "overview") {
  return `${paths.buy}/${id}/${tab}`;
}

export function verifyPath(id: number | string) {
  return `${paths.buy}/${id}/verify`;
}

export function propertyBackPath(from: unknown) {
  if (from === paths.profile || from === paths.sell || from === paths.buy) return from;
  if (typeof from === "string" && from.startsWith(`${paths.buy}?`) && !from.includes("://")) return from;
  return paths.buy;
}
