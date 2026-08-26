import { session } from "../config/auth";

export function getToken() {
  const row = document.cookie.split("; ").find((part) => part.startsWith(`${session.cookie}=`));
  return row ? decodeURIComponent(row.slice(session.cookie.length + 1)) : null;
}

export function setToken(token: string) {
  document.cookie = `${session.cookie}=${encodeURIComponent(token)}; Path=/; Max-Age=${session.maxAge}; SameSite=Lax`;
}

export function clearToken() {
  document.cookie = `${session.cookie}=; Path=/; Max-Age=0`;
}
