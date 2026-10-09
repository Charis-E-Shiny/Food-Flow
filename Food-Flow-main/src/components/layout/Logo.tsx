import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";

export function Logo({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
          <path d="M12 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="6" r="2.4" fill="currentColor" />
          <path d="M12 9l-5 4M12 9l5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="6.5" cy="14" r="2" fill="#8cc5a3" />
          <circle cx="17.5" cy="14" r="2" fill="#e0962a" />
        </svg>
      </span>
      <span className="text-[17px] font-bold tracking-tight text-ink">FoodFlow</span>
    </Link>
  );
}
