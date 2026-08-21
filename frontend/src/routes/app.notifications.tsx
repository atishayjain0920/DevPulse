import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/devpulse/AppShell";
import { QueryState } from "@/components/ui-kit/QueryState";
import { ListSkeleton } from "@/components/ui-kit/Card";
import { queryKeys } from "@/lib/api/queryKeys";
import { notificationsService } from "@/lib/api/services";
import { timeAgo } from "@/lib/format";
import type { Notification } from "@/lib/api/types";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — DevPulse" },
      {
        name: "description",
        content:
          "Review DevPulse alerts: workflow failures, idle pull requests, sync results, and AI digests.",
      },
      { property: "og:title", content: "Notifications — DevPulse" },
      {
        property: "og:description",
        content: "Workflow failures, idle pull requests, and AI digests in one inbox.",
      },
    ],
  }),
  component: NotificationsPage,
});

const TABS = ["all", "unread", "read"] as const;

function NotificationsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");

  const listQ = useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: () => notificationsService.list(),
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    void qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
  };

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: invalidate,
  });
  const markAllRead = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => notificationsService.remove(id),
    onSuccess: invalidate,
  });

  const filter = (items: Notification[]) =>
    tab === "all" ? items : items.filter((n) => (tab === "unread" ? !n.read : n.read));

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Everything DevPulse flagged across your repositories."
        actions={
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        }
      />

      <div className="mb-4 flex items-center gap-1 rounded-md border border-border bg-surface p-0.5 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-3 py-1 text-xs capitalize transition-colors ${
              tab === t
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <QueryState
        query={listQ}
        skeleton={<ListSkeleton rows={6} />}
        isEmpty={(items) => filter(items).length === 0}
        emptyTitle="No notifications"
        emptyDescription="You're all caught up. New alerts appear here after each sync."
        errorTitle="Notifications unavailable"
      >
        {(items) => (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {filter(items).map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-3 p-4 transition-colors hover:bg-accent/40 ${
                  n.read ? "opacity-70" : ""
                }`}
              >
                <Bell
                  className={`mt-0.5 h-4 w-4 shrink-0 ${n.read ? "text-muted-foreground" : "text-primary"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{n.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!n.read ? (
                    <button
                      onClick={() => markRead.mutate(n.id)}
                      aria-label="Mark as read"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  <button
                    onClick={() => remove.mutate(n.id)}
                    aria-label="Delete notification"
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </QueryState>

      {remove.isError ? (
        <p className="mt-3 text-xs text-destructive">
          Deleting notifications requires the backend endpoint DELETE
          /api/notifications/:id.
        </p>
      ) : null}
    </>
  );
}
