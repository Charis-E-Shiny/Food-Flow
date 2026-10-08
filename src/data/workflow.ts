import {
  Activity,
  BadgeCheck,
  GitBranch,
  LayoutDashboard,
  Leaf,
  MapPin,
  Radar,
  Route,
  Sprout,
  Store,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

// ============================================================
// FoodFlow workflow + tools — the single source of truth for
// navigation, progress and prev/next across the app.
// ============================================================

export interface Step {
  n: string;
  key: string;
  label: string; // compact nav label
  full: string; // page title
  to: string;
  question: string; // the one question the page answers
  icon: typeof Radar;
}

export const WORKFLOW: Step[] = [
  { n: "00", key: "overview", label: "Overview", full: "Overview", to: "/dashboard", question: "What's happening across the network?", icon: LayoutDashboard },
  { n: "01", key: "predict", label: "Predict", full: "Predict", to: "/predict", question: "Where will surplus happen?", icon: Radar },
  { n: "02", key: "risk", label: "Risk", full: "Assess Risk", to: "/risk", question: "How serious is it?", icon: TrendingUp },
  { n: "03", key: "demand", label: "Demand", full: "Find Demand", to: "/demand", question: "Who needs the food?", icon: Activity },
  { n: "04", key: "optimize", label: "Optimize", full: "Optimize", to: "/optimize", question: "Where should it go?", icon: Target },
  { n: "05", key: "route", label: "Route", full: "Route", to: "/operations", question: "Is it moving?", icon: Route },
  { n: "06", key: "trace", label: "Trace", full: "Trace", to: "/trace", question: "Where has it been?", icon: GitBranch },
  { n: "07", key: "verify", label: "Verify", full: "Verify", to: "/verify", question: "Did it arrive?", icon: BadgeCheck },
  { n: "08", key: "impact", label: "Impact", full: "Measure Impact", to: "/impact", question: "What difference did we make?", icon: Leaf },
];

export interface Tool {
  label: string;
  to: string;
  desc: string;
  icon: typeof Radar;
}

export const TOOLS: Tool[] = [
  { label: "Scenario Simulator", to: "/simulator", desc: "Test supply, demand & weather conditions", icon: Sprout },
  { label: "Network Map", to: "/map", desc: "Explore surplus, demand & routes geographically", icon: MapPin },
  { label: "Farmer View", to: "/farmer", desc: "FoodFlow from a farmer's perspective", icon: Users },
  { label: "Market", to: "/marketplace", desc: "Live commodity prices, buyers & organizations", icon: Store },
];

export function stepIndex(pathname: string): number {
  // longest-prefix match so /event/* etc. resolve sensibly
  const i = WORKFLOW.findIndex((s) => pathname === s.to || pathname.startsWith(s.to + "/"));
  return i;
}
