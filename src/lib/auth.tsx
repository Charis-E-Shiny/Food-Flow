import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// ============================================================
// Lightweight client-side auth for the prototype. Sessions persist
// in localStorage. This is a sandbox — no real backend, no password
// storage; any credentials are accepted so judges/users can get in
// instantly. Swap AuthProvider's methods for real API calls later.
// ============================================================

export interface User {
  name: string;
  email: string;
  org: string;
  role: string;
  initials: string;
}

interface AuthState {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: { name: string; email: string; org: string; role: string }) => Promise<void>;
  signOut: () => void;
}

const KEY = "foodflow.session.v1";
const AuthContext = createContext<AuthState | null>(null);

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "FF";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] || "there";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (user) localStorage.setItem(KEY, JSON.stringify(user));
      else localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable — session stays in memory */
    }
  }, [user]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      async signIn(email) {
        const name = nameFromEmail(email);
        setUser({ name, email, org: "FoodFlow Workspace", role: "Operations", initials: initials(name) });
      },
      async signUp({ name, email, org, role }) {
        setUser({ name, email, org: org || "FoodFlow Workspace", role: role || "Operations", initials: initials(name) });
      },
      signOut() {
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
