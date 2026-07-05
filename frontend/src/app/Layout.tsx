import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Bell, Bot, ChartNoAxesCombined, GitPullRequest, LayoutDashboard, Lock, LogOut, Moon, Search, Settings, Shield, Sun, UserRound } from "lucide-react";
import { Button } from "../components/ui";
import { applyTheme, useTheme } from "./useTheme";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/repositories", label: "Repositories", icon: ChartNoAxesCombined },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/executive", label: "Executive", icon: Shield },
  { to: "/ai", label: "AI Assistant", icon: Bot },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/reports", label: "Reports", icon: GitPullRequest },
  { to: "/security", label: "Security", icon: Lock },
  { to: "/settings", label: "Settings", icon: Settings }
];

export function Layout() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");

  useEffect(() => applyTheme(theme), [theme]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span>DP</span>
          <strong>DevPulse</strong>
        </div>
        <nav>
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/dashboard"}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <form
            className="search"
            onSubmit={(event) => {
              event.preventDefault();
              if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
            }}
          >
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Global search" />
          </form>
          <span className="sync">{user?.displayName ?? user?.username}</span>
          <Button variant="ghost" aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          <Button variant="ghost" aria-label="Notifications" onClick={() => navigate("/notifications")}>
            <Bell size={18} />
          </Button>
          <Button variant="ghost" aria-label="Logout" onClick={() => void logout().then(() => navigate("/welcome", { replace: true }))}>
            <LogOut size={18} />
          </Button>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
