import { Outlet } from "react-router-dom";
import { Footer } from "../components/sections/Footer";
import { SiteHeader } from "../components/sections/SiteHeader";

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface md:h-dvh md:overflow-hidden">
      <SiteHeader />
      <main className="flex flex-1 flex-col md:min-h-0 md:overflow-y-auto">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
