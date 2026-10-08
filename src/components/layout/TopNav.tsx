import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, LogOut, Menu, Settings, Store, User as UserIcon, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth";
import { TOOLS, WORKFLOW, stepIndex } from "@/data/workflow";
import { NotificationBell } from "./NotificationBell";

function useDismiss(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return ref;
}

export function TopNav() {
  const { pathname } = useLocation();
  const [mobile, setMobile] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1360px] items-center gap-4 px-4 sm:px-6">
        <div className="shrink-0">
          <Logo to="/dashboard" />
        </div>

        {/* Workflow stepper — label pills joined by arrows to show sequence */}
        <nav className="scroll-thin hidden min-w-0 flex-1 items-center justify-center overflow-x-auto lg:flex" aria-label="Workflow">
          {WORKFLOW.map((s, i) => {
            const active = stepIndex(pathname);
            const current = active === i;
            return (
              <div key={s.key} className="flex shrink-0 items-center">
                {i > 0 && <ChevronRight size={13} className={cn("mx-0.5 shrink-0", i <= active ? "text-brand-soft" : "text-line-strong")} />}
                <NavLink
                  to={s.to}
                  title={s.question}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                    current ? "bg-brand text-white shadow-card" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  {s.label}
                </NavLink>
              </div>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <NavLink
            to="/marketplace"
            className={({ isActive }) =>
              cn(
                "hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors lg:inline-flex",
                isActive ? "bg-brand-tint text-brand-strong" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
              )
            }
          >
            <Store size={15} /> Market
          </NavLink>
          <ToolsMenu />
          <NotificationBell />
          <ProfileMenu />
          <button
            className="rounded-lg p-2 text-ink-2 hover:bg-surface-2 lg:hidden"
            onClick={() => setMobile(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {mobile && <MobileMenu onClose={() => setMobile(false)} />}
    </header>
  );
}

function ToolsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(() => setOpen(false));
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
          open ? "bg-surface-2 text-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Tools <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-72 overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-pop">
          {TOOLS.filter((t) => t.to !== "/marketplace").map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn("flex items-start gap-3 rounded-lg p-2.5 transition-colors", isActive ? "bg-brand-tint" : "hover:bg-surface-2")
              }
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-tint text-brand">
                <t.icon size={16} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">{t.label}</span>
                <span className="block text-xs text-ink-3">{t.desc}</span>
              </span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useDismiss(() => setOpen(false));
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-line bg-surface py-1 pl-1 pr-1.5 transition-colors hover:bg-surface-2"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-xs font-semibold text-white">
          {user?.initials ?? "FF"}
        </span>
        <ChevronDown size={14} className="text-ink-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-60 overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
          <div className="border-b border-line p-3">
            <div className="text-sm font-semibold text-ink">{user?.name}</div>
            <div className="truncate text-xs text-ink-3">{user?.email}</div>
            <div className="mt-1.5 inline-flex rounded-full bg-brand-tint px-2 py-0.5 text-[11px] font-medium text-brand-strong">
              {user?.role} · {user?.org}
            </div>
          </div>
          <MenuRow icon={<UserIcon size={15} />} label="Profile" onClick={() => setOpen(false)} />
          <MenuRow icon={<Settings size={15} />} label="Settings" onClick={() => setOpen(false)} />
          <button
            onClick={() => (signOut(), navigate("/"))}
            className="flex w-full items-center gap-2.5 border-t border-line px-3 py-2.5 text-sm text-risk hover:bg-risk-soft"
          >
            <LogOut size={15} /> Sign out
          </button>
          <div className="border-t border-line px-3 py-2 text-[10px] text-ink-3">
            Sandbox · illustrative data
          </div>
        </div>
      )}
    </div>
  );
}

function MenuRow({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-ink-2 hover:bg-surface-2">
      {icon} {label}
    </button>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[300px] overflow-y-auto bg-surface p-4 shadow-pop">
        <div className="flex items-center justify-between">
          <Logo to="/dashboard" />
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-3 hover:bg-surface-2" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-3">Workflow</div>
        <div className="mt-2 space-y-0.5">
          {WORKFLOW.map((s) => (
            <NavLink
              key={s.key}
              to={s.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium", isActive ? "bg-brand text-white" : "text-ink-2 hover:bg-surface-2")
              }
            >
              <s.icon size={16} />
              {s.full}
            </NavLink>
          ))}
        </div>

        <div className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-3">Tools</div>
        <div className="mt-2 space-y-0.5">
          {TOOLS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium", isActive ? "bg-brand-tint text-brand-strong" : "text-ink-2 hover:bg-surface-2")
              }
            >
              <t.icon size={16} /> {t.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
