import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "../lib/session";
import { safeNext } from "../lib/next";

export function PublicRoute() {
  const location = useLocation();
  if (getToken()) {
    return <Navigate to={safeNext((location.state as { from?: string } | null)?.from)} replace />;
  }
  return <Outlet />;
}
