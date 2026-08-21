import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { notificationsService } from "@/lib/api/services";
import { Skeleton } from "@/components/ui-kit/Skeleton";
import { EmptyState } from "@/components/ui-kit/EmptyState";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const listQ = useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: () => notificationsService.list(),
    enabled: open,
  });

  const unreadQ = useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: () => notificationsService.unreadCount(),
    refetchInterval: 60_000,
    retry: false,
  });

  const markAll = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
      qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
  };

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: invalidate,
  });

  /** REQUIRES BACKEND IMPLEMENTATION: DELETE /api/notifications/:id */
  const remove = useMutation({
    mutationFn: (id: string) => notificationsService.remove(id),
    onSuccess: invalidate,
  });

  const unread = unreadQ.data?.count ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative rounded-md border border-border bg-surface p-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-2 w-[360px] overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="text-sm font-semibold">Notifications</div>
                <button
                  onClick={() => markAll.mutate()}
                  disabled={markAll.isPending || unread === 0}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {listQ.isLoading ? (
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : listQ.isError ? (
                  <div className="space-y-2 p-6 text-center text-xs text-destructive">
                    <p>Couldn't load notifications.</p>
                    <button
                      onClick={() => listQ.refetch()}
                      className="rounded-md border border-border px-2 py-1 text-muted-foreground hover:text-foreground"
                    >
                      Retry
                    </button>
                  </div>
                ) : !listQ.data?.length ? (
                  <EmptyState
                    title="You're all caught up"
                    description="New activity will show up here."
                    className="border-0"
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {listQ.data.map((n) => (
                      <li
                        key={n.id}
                        className={`group flex items-start gap-2 px-4 py-3 text-sm ${
                          !n.read ? "bg-primary/5" : ""
                        }`}
                      >
                        <button
                          onClick={() => {
                            if (!n.read) markRead.mutate(n.id);
                            if (n.href) {
                              setOpen(false);
                              window.location.href = n.href;
                            }
                          }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="font-medium">{n.title}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {n.body}
                          </div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                            {new Date(n.createdAt).toLocaleString()}
                          </div>
                        </button>
                        <button
                          aria-label="Dismiss notification"
                          onClick={() => remove.mutate(n.id)}
                          disabled={remove.isPending}
                          className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 disabled:opacity-40"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
