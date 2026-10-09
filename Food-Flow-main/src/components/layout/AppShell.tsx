import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";
import { AlertTicker } from "./AlertTicker";

// Top-nav application shell — no sidebar. Sticky header with the
// workflow stepper, a predictive-alert ticker, and the routed page.
export function AppShell() {
  return (
    <div className="min-h-screen bg-canvas">
      <TopNav />
      <AlertTicker />
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1360px] animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
