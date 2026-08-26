import { parseMoney } from "./money";
import { getToken } from "./session";
import tunnel from "../config/tunnel.json" with { type: "json" };

function apiBase() {
  const env = String(import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
  const remote = String(tunnel.baseUrl ?? "").replace(/\/$/, "");
  const host = globalThis.location?.hostname ?? "";
  const local = !host || host === "localhost" || host === "127.0.0.1";
  if (local) return env;
  if (env && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(env)) return env;
  return remote || globalThis.location.origin.replace(/\/$/, "");
}

export type Property = {
  id: number;
  title: string;
  location: string;
  config: string;
  price: number;
  area_sqft: number;
  status: string;
  yield_pct: number;
  verified: boolean;
  verify_pending?: boolean;
  featured: boolean;
  image_url: string;
  yoy_pct?: number;
  owned?: boolean;
  watchers?: number;
};

export type PropertyAnalytics = {
  avg_cap_rate: number;
  vacancy_rate: number;
  yoy_growth: number;
};

export type PropertyFilters = {
  q: string;
  maxBudget: string;
  configs: string[];
  verified: boolean;
};

type Json = { error?: string; token?: string; ok?: boolean; name?: string; email?: string; phone?: string; id?: number };

function headers(json = false) {
  const out: Record<string, string> = {};
  if (json) out["Content-Type"] = "application/json";
  const token = getToken();
  if (token) out.Authorization = `Bearer ${token}`;
  if (/ngrok/i.test(apiBase())) out["ngrok-skip-browser-warning"] = "1";
  return out;
}

function apiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${apiBase()}${suffix}`;
}

export function mediaUrl(path: string) {
  return apiUrl(path);
}

async function getJson<T>(path: string) {
  const res = await fetch(apiUrl(path), { headers: headers() });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

async function postJson(path: string, body: unknown) {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Json;
  return { ok: res.ok, status: res.status, data };
}

async function patchJson<T>(path: string, body: unknown) {
  const res = await fetch(apiUrl(path), {
    method: "PATCH",
    headers: headers(true),
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export function requestOtp(phone: string) {
  return postJson("/auth/otp", { phone });
}

export function verifyOtp(phone: string, otp: string) {
  return postJson("/auth/verify", { phone, otp });
}

type ListResponse = {
  items?: Property[];
  total?: number;
  has_more?: boolean;
  analytics?: PropertyAnalytics;
};

export async function fetchProperties(opts: PropertyFilters & { offset: number; limit: number }) {
  const params = new URLSearchParams();
  if (opts.q.trim()) params.set("q", opts.q.trim());
  if (opts.maxBudget.trim()) {
    const budget = parseMoney(opts.maxBudget);
    if (budget > 0) params.set("max_budget", String(budget));
  }
  if (opts.configs.length) {
    for (const name of opts.configs) params.append("config", name);
  }
  if (opts.verified) params.set("verified", "1");
  params.set("offset", String(opts.offset));
    params.set("limit", String(opts.limit));
  const { ok, data } = await getJson<ListResponse>(`/properties?${params}`);
  if (!ok) return null;
  return {
    items: data.items ?? [],
    total: data.total ?? 0,
    hasMore: Boolean(data.has_more),
    analytics: data.analytics ?? { avg_cap_rate: 0, vacancy_rate: 0, yoy_growth: 0 },
  };
}

export type LocationSuggestion = {
  text: string;
  kind?: string;
};

export async function fetchLocationSuggest(q: string) {
  const params = new URLSearchParams({ q });
  const { ok, data } = await getJson<{
    corrected?: string;
    suggestions?: LocationSuggestion[];
  }>(`/properties/suggest?${params}`);
  if (!ok) return { corrected: "", suggestions: [] as LocationSuggestion[] };
  return {
    corrected: data.corrected ?? "",
    suggestions: data.suggestions ?? [],
  };
}

export async function fetchProperty(id: number) {
  const { ok, data } = await getJson<Property & { error?: string }>(`/properties/${id}`);
  if (!ok) return null;
  return data;
}

export async function updateListing(
  id: number,
  input: { title: string; location: string; config: string; price: string; area_sqft: string },
) {
  return patchJson<Property & { error?: string }>(`/properties/${id}`, input);
}

export type VerifyPackageId = "basic" | "verified" | "escrow";

export type VerifyPackage = {
  id: VerifyPackageId;
  price: number;
  fee: number;
  total: number;
  amount_paise: number;
  recommended: boolean;
};

export type VerifyCatalog = {
  fee_rate: number;
  default: VerifyPackageId;
  packages: VerifyPackage[];
};

export type VerifyCheckout = {
  package_id: VerifyPackageId;
  price: number;
  fee: number;
  total: number;
  amount_paise: number;
  checkout_id: string;
  order_id: string;
  key_id: string;
  error?: string;
};

export async function fetchVerifyCatalog(id: number) {
  const { ok, status, data } = await getJson<VerifyCatalog & { error?: string }>(`/properties/${id}/verify`);
  if (!ok) return { ok: false as const, status, data };
  return { ok: true as const, status, data };
}

export async function startVerifyCheckout(id: number, packageId: VerifyPackageId) {
  const res = await fetch(apiUrl(`/properties/${id}/verify/checkout`), {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({ package_id: packageId }),
  });
  const data = (await res.json().catch(() => ({}))) as VerifyCheckout;
  return { ok: res.ok, status: res.status, data };
}

export async function completeVerify(
  id: number,
  input: {
    package_id: VerifyPackageId;
    checkout_id: string;
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  },
) {
  const res = await fetch(apiUrl(`/properties/${id}/verify`), {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({
      package_id: input.package_id,
      checkout_id: input.checkout_id,
      razorpay_payment_id: input.razorpay_payment_id,
      razorpay_order_id: input.razorpay_order_id,
      razorpay_signature: input.razorpay_signature,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as Property & { error?: string };
  return { ok: res.ok, status: res.status, data };
}

export async function deleteListing(id: number) {
  const res = await fetch(apiUrl(`/properties/${id}`), {
    method: "DELETE",
    headers: headers(),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
  return { ok: res.ok, status: res.status, data };
}

export type Profile = {
  id: number;
  phone: string;
  name: string;
  email: string;
};

export async function fetchMe() {
  const { ok, data } = await getJson<Profile & { error?: string }>("/auth/me");
  if (!ok) return null;
  return data;
}

export async function saveMe(name: string, email: string) {
  return patchJson<Profile & { error?: string }>("/auth/me", { name, email });
}

export type Notice = {
  id: number;
  kind: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  at: string;
};

export async function fetchNotices() {
  const { ok, data } = await getJson<{ items?: Notice[]; unread?: number; error?: string }>("/notifications");
  if (!ok) return { items: [] as Notice[], unread: 0 };
  return { items: data.items ?? [], unread: data.unread ?? 0 };
}

export async function markNoticesRead(ids?: number[]) {
  return postJson("/notifications/read", ids?.length ? { ids } : {});
}

export type ListingStatus = "verified" | "pending" | "unverified" | "negotiation";

export type SellerListing = Property & { listing_status: ListingStatus; watchers?: number; chats?: number };

export type SellerMetrics = {
  views: number;
  views_delta: number;
  offers: number;
  chats?: number;
  insight: string;
};

export async function fetchMyListings() {
  const { ok, data } = await getJson<{
    items?: SellerListing[];
    metrics?: SellerMetrics;
    error?: string;
  }>("/properties/mine");
  if (!ok) return null;
  return {
    items: data.items ?? [],
    metrics: data.metrics ?? { views: 0, views_delta: 0, offers: 0, insight: "" },
  };
}

export async function createListing(input: {
  title: string;
  location: string;
  config: string;
  price: string;
  area_sqft: string;
  images: File[];
}) {
  const body = new FormData();
  body.set("title", input.title);
  body.set("location", input.location);
  body.set("config", input.config);
  body.set("price", input.price);
  body.set("area_sqft", input.area_sqft);
  for (const file of input.images) body.append("images", file);
  const res = await fetch(apiUrl("/properties"), {
    method: "POST",
    headers: headers(),
    body,
  });
  const data = (await res.json().catch(() => ({}))) as SellerListing & { error?: string };
  return { ok: res.ok, status: res.status, data };
}

export async function fetchInterested() {
  const { ok, data } = await getJson<{ items?: SellerListing[]; error?: string }>("/properties/interested");
  if (!ok) return [];
  return data.items ?? [];
}

export async function addInterest(propertyId: number) {
  return postJson("/properties/interested", { property_id: propertyId });
}

export async function removeInterest(propertyId: number) {
  const res = await fetch(apiUrl(`/properties/interested/${propertyId}`), {
    method: "DELETE",
    headers: headers(),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
  return { ok: res.ok, status: res.status, data };
}

export type DeskContact = {
  id: number;
  name: string;
  phone: string;
  email: string;
  tracking: boolean;
  messages: number;
  offer?: number;
  last_at: string;
};

export type ChatLine = {
  id: number;
  mine: boolean;
  body: string;
  at: string;
};

export async function fetchDesk(id: number) {
  const { ok, data } = await getJson<{ items?: DeskContact[]; error?: string }>(`/properties/${id}/desk`);
  if (!ok) return [];
  return data.items ?? [];
}

export async function fetchThread(id: number, buyerId: number) {
  const { ok, data } = await getJson<{ items?: ChatLine[]; error?: string }>(`/properties/${id}/chats/${buyerId}`);
  if (!ok) return [];
  return data.items ?? [];
}

export async function sendChat(id: number, body: string, buyerId?: number) {
  return postJson(`/properties/${id}/chats`, buyerId ? { body, buyer_id: buyerId } : { body });
}
