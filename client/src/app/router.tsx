import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { paths } from "../config/routes";
import { AppLayout } from "../layouts/AppLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { BuyPage } from "../pages/buy/BuyPage";
import { PropertyPage } from "../pages/property/PropertyPage";
import { OverviewPage } from "../pages/property/OverviewPage";
import { ContractsPage } from "../pages/property/ContractsPage";
import { FinancialsPage } from "../pages/property/FinancialsPage";
import { TimelinePage } from "../pages/property/TimelinePage";
import { SupportPage } from "../pages/property/SupportPage";
import { MessagePage } from "../pages/property/MessagePage";
import { SellPage } from "../pages/sell/SellPage";
import { AddPropertyPage } from "../pages/sell/AddPropertyPage";
import { ProfilePage } from "../pages/profile/ProfilePage";
import { VerifyPage } from "../pages/property/VerifyPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { LandingPage } from "../pages/landing/LandingPage";
import { ProtectedRoute } from "../routes/ProtectedRoute";
import { PublicRoute } from "../routes/PublicRoute";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path={paths.home} element={<LandingPage />} />
          <Route path={paths.buy} element={<BuyPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path={`${paths.buy}/:id/verify`} element={<VerifyPage />} />
            <Route path={paths.sell} element={<SellPage />} />
            <Route path={paths.sellNew} element={<AddPropertyPage />} />
            <Route path={paths.profile} element={<ProfilePage />} />
          </Route>
          <Route path={`${paths.buy}/:id`} element={<PropertyPage />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="contracts" element={<ContractsPage />} />
            <Route path="financials" element={<FinancialsPage />} />
            <Route path="timeline" element={<TimelinePage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="message" element={<MessagePage />} />
          </Route>
        </Route>
        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route path={paths.login} element={<LoginPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={paths.home} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
