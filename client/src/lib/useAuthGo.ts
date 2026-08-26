import { useNavigate } from "react-router-dom";
import { paths } from "../config/routes";
import { getToken } from "../lib/session";

export function useAuthGo() {
  const navigate = useNavigate();
  return (to: string) => {
    if (getToken()) {
      navigate(to);
      return;
    }
    navigate(paths.login, { state: { from: to } });
  };
}
