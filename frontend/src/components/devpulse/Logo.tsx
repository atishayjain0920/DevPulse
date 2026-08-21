import { Link } from "@tanstack/react-router";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link to={href} className="group inline-flex items-center gap-2.5">
      <span className="relative grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h3l2-6 4 12 2-6h7" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        DevPulse
      </span>
    </Link>
  );
}
