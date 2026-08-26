import { Outlet } from "react-router-dom";
import { Footer } from "../components/sections/Footer";

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
