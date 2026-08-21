import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui-kit/Skeleton";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserMenu() {
  const { user, isLoading } = useAuth();
  const logout = useLogout();
  const [open, setOpen] = useState(false);

  if (isLoading) return <Skeleton className="h-8 w-8 rounded-full" />;
  if (!user)
    return (
      <Link
        to="/login"
        className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground hover:bg-accent"
      >
        Sign in
      </Link>
    );

  const display = user.name || user.username;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-full transition-transform hover:scale-105"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={display}
            className="h-8 w-8 rounded-full border border-border object-cover"
          />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-xs font-medium text-primary">
            {initials(display)}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
            >
              <div className="border-b border-border px-4 py-3">
                <div className="text-sm font-medium">{display}</div>
                <div className="text-xs text-muted-foreground">
                  @{user.username}
                </div>
              </div>
              <div className="p-1">
                <Link
                  to="/app/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  Profile
                </Link>
                <Link
                  to="/app/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </Link>
                <button
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
