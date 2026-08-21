import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

const LABELS: Record<string, string> = {
  app: "Workspace",
  dashboard: "Dashboard",
  analytics: "Analytics",
  notifications: "Notifications",
  repositories: "Repositories",
  ai: "AI Workspace",
  reports: "Reports",
  profile: "Profile",
  settings: "Settings",
};

export function Breadcrumbs({ pathname }: { pathname: string }) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-sm md:flex">
      <Link to="/" className="text-muted-foreground hover:text-foreground">
        DevPulse
      </Link>
      {parts.map((part, i) => {
        const href = "/" + parts.slice(0, i + 1).join("/");
        const isLast = i === parts.length - 1;
        const label = LABELS[part] ?? part.replace(/-/g, " ");
        return (
          <span key={href} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-border" />
            {isLast ? (
              <span className="font-medium capitalize text-foreground">{label}</span>
            ) : (
              <Link
                to={href}
                className="capitalize text-muted-foreground hover:text-foreground"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
