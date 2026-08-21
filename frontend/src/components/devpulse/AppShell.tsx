import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  ChevronsLeft,
  ChevronsRight,
  FileBarChart,
  FolderGit2,
  Home,
  Menu,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import { Logo } from "./Logo";
import { Breadcrumbs } from "./nav/Breadcrumbs";
import { GlobalSearch } from "./nav/GlobalSearch";
import { NotificationCenter } from "./nav/NotificationCenter";
import { UserMenu } from "./nav/UserMenu";
import { ThemeToggle } from "./nav/ThemeToggle";
import { PageTransition } from "@/components/ui-kit/PageTransition";

type NavItem = {
  to:
    | "/app/dashboard"
    | "/app/repositories"
    | "/app/analytics"
    | "/app/ai"
    | "/app/reports"
    | "/app/notifications"
    | "/app/profile"
    | "/app/settings";
  label: string;
  icon: typeof Home;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: Home },
  { to: "/app/repositories", label: "Repositories", icon: FolderGit2 },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/ai", label: "AI workspace", icon: Sparkles },
  { to: "/app/reports", label: "Reports", icon: FileBarChart },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
  { to: "/app/profile", label: "Profile", icon: User },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:flex ${
          collapsed ? "w-[64px]" : "w-[232px]"
        }`}
      >
        <SidebarInner collapsed={collapsed} pathname={pathname} />
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="m-3 mt-auto inline-flex items-center justify-center gap-2 rounded-md border border-sidebar-border bg-background px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {collapsed ? (
            <ChevronsRight className="h-3.5 w-3.5" />
          ) : (
            <>
              <ChevronsLeft className="h-3.5 w-3.5" /> Collapse
            </>
          )}
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-[260px] flex-col border-r border-sidebar-border bg-sidebar">
            <SidebarInner
              collapsed={false}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          pathname={pathname}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarInner({
  collapsed,
  pathname,
  onNavigate,
}: {
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className={`flex h-14 items-center border-b border-sidebar-border px-4 ${collapsed ? "justify-center px-2" : ""}`}>
        {collapsed ? (
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <Activity className="h-4 w-4" />
          </span>
        ) : (
          <Logo />
        )}
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.to
            : pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              } ${collapsed ? "justify-center px-0" : ""}`}
            >
              <item.icon
                className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && active ? (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function TopBar({
  pathname,
  onOpenMobile,
}: {
  pathname: string;
  onOpenMobile: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-8">
      <button
        onClick={onOpenMobile}
        aria-label="Open menu"
        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>
      <Breadcrumbs pathname={pathname} />
      <div className="ml-auto flex items-center gap-2">
        <GlobalSearch />
        <ThemeToggle />
        <NotificationCenter />
        <UserMenu />
      </div>
    </header>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
