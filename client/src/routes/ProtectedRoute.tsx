import { Navigate, Outlet, useLocation } from "react-router-dom";
import { paths } from "../config/routes";
import { getToken } from "../lib/session";

export function ProtectedRoute() {
  const location = useLocation();
  if (!getToken()) {
    return <Navigate to={paths.login} replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return <Outlet />;
}
