import { Suspense, lazy, useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import Landing from "@/features/landing/Landing";
import Login from "@/features/auth/Login";
import Signup from "@/features/auth/Signup";

// Workflow pages
const Overview = lazy(() => import("@/features/overview/Overview"));
const Predict = lazy(() => import("@/features/surplus-radar/SurplusRadar"));
const RiskBoard = lazy(() => import("@/features/risk/RiskBoard"));
const Demand = lazy(() => import("@/features/need-map/NeedMap"));
const Optimization = lazy(() => import("@/features/optimization/Optimization"));
const Operations = lazy(() => import("@/features/operations/Operations"));
const Traceability = lazy(() => import("@/features/traceability/Traceability"));
const Verify = lazy(() => import("@/features/recipient/RecipientView"));
const ImpactCenter = lazy(() => import("@/features/impact/ImpactCenter"));
const EventDetail = lazy(() => import("@/features/event-detail/EventDetail"));
// Tools
const Simulator = lazy(() => import("@/features/simulator/Simulator"));
const NetworkMap = lazy(() => import("@/features/network-map/NetworkMap"));
const FarmerView = lazy(() => import("@/features/farmer/FarmerView"));
const Marketplace = lazy(() => import("@/features/marketplace/Marketplace"));

function PageLoader() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-ink-3">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-brand" />
        Loading…
      </div>
    </div>
  );
}

const S = (el: ReactNode) => <Suspense fallback={<PageLoader />}>{el}</Suspense>;

export default function App() {
  return (
    <ScrollToTop>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          {/* Workflow */}
          <Route path="/dashboard" element={S(<Overview />)} />
          <Route path="/predict" element={S(<Predict />)} />
          <Route path="/risk" element={S(<RiskBoard />)} />
          <Route path="/demand" element={S(<Demand />)} />
          <Route path="/optimize" element={S(<Optimization />)} />
          <Route path="/operations" element={S(<Operations />)} />
          <Route path="/trace" element={S(<Traceability />)} />
          <Route path="/verify" element={S(<Verify />)} />
          <Route path="/impact" element={S(<ImpactCenter />)} />
          <Route path="/event/:id" element={S(<EventDetail />)} />
          {/* Tools */}
          <Route path="/simulator" element={S(<Simulator />)} />
          <Route path="/map" element={S(<NetworkMap />)} />
          <Route path="/farmer" element={S(<FarmerView />)} />
          <Route path="/marketplace" element={S(<Marketplace />)} />

          {/* Redirects from the previous structure */}
          <Route path="/command" element={<Navigate to="/dashboard" replace />} />
          <Route path="/radar" element={<Navigate to="/predict" replace />} />
          <Route path="/need-map" element={<Navigate to="/demand" replace />} />
          <Route path="/recipient" element={<Navigate to="/verify" replace />} />
          <Route path="/demo" element={<Navigate to="/simulator" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ScrollToTop>
  );
}

function ScrollToTop({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return <>{children}</>;
}
