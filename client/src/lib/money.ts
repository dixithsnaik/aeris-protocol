export function inr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function parseMoney(raw: string) {
  const n = Number(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
