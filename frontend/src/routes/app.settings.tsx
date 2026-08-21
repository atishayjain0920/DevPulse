import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/devpulse/AppShell";
import { Card, CardHeader } from "@/components/ui-kit/Card";
import { QueryState } from "@/components/ui-kit/QueryState";
import { Skeleton } from "@/components/ui-kit/Skeleton";
import { Spinner } from "@/components/ui-kit/Spinner";
import { ErrorState } from "@/components/ui-kit/ErrorState";
import { queryKeys } from "@/lib/api/queryKeys";
import { settingsService } from "@/lib/api/services";
import type { UserSettings } from "@/lib/api/types";
import { useAuth, useLogout } from "@/hooks/useAuth";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — DevPulse" },
      {
        name: "description",
        content:
          "Manage appearance, notifications, AI behaviour, and GitHub synchronization preferences.",
      },
      { property: "og:title", content: "Settings — DevPulse" },
      {
        property: "og:description",
        content: "Appearance, notifications, AI behaviour, and sync preferences.",
      },
    ],
  }),
  component: Settings,
});

function Settings() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const logout = useLogout();

  const settingsQ = useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: () => settingsService.get(),
  });

  const update = useMutation({
    mutationFn: (patch: Partial<UserSettings>) => settingsService.update(patch),
    onSuccess: (next) => qc.setQueryData(queryKeys.settings.all, next),
  });

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Preferences are stored on your DevPulse account."
        actions={
          update.isPending ? (
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Spinner /> Saving…
            </span>
          ) : undefined
        }
      />

      {update.isError ? (
        <ErrorState
          error={update.error}
          title="Couldn't save your settings"
          onRetry={() => update.reset()}
          className="mb-4"
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <QueryState
          query={settingsQ}
          skeleton={
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </>
          }
          emptyTitle="Settings unavailable"
          emptyDescription="Your preferences could not be loaded."
        >
          {(s) => (
            <>
              <Card>
                <CardHeader title="Appearance" />
                <Select
                  label="Theme"
                  value={s.appearance.theme}
                  options={["dark", "light", "system"]}
                  onChange={(v) =>
                    update.mutate({
                      appearance: { ...s.appearance, theme: v as "dark" },
                    })
                  }
                />
                <Select
                  label="Density"
                  value={s.appearance.density}
                  options={["comfortable", "compact"]}
                  onChange={(v) =>
                    update.mutate({
                      appearance: { ...s.appearance, density: v as "compact" },
                    })
                  }
                />
              </Card>

              <Card>
                <CardHeader title="Notifications" />
                {(
                  [
                    ["weeklyDigest", "Weekly digest email"],
                    ["prIdleAlerts", "Idle pull request alerts"],
                    ["workflowFailures", "Workflow failure alerts"],
                  ] as const
                ).map(([key, label]) => (
                  <Toggle
                    key={key}
                    label={label}
                    checked={s.notifications[key]}
                    onChange={(checked) =>
                      update.mutate({
                        notifications: { ...s.notifications, [key]: checked },
                      })
                    }
                  />
                ))}
              </Card>

              <Card>
                <CardHeader title="AI assistant" />
                <Field label="Model">
                  <input
                    defaultValue={s.ai.model}
                    onBlur={(e) =>
                      e.target.value !== s.ai.model &&
                      update.mutate({ ai: { ...s.ai, model: e.target.value } })
                    }
                    className="w-40 rounded-md border border-input bg-background px-2 py-1 text-right font-mono text-xs focus:border-primary focus:outline-none"
                  />
                </Field>
                <Field label="Context window (days)">
                  <input
                    type="number"
                    min={1}
                    defaultValue={s.ai.contextDays}
                    onBlur={(e) =>
                      update.mutate({
                        ai: { ...s.ai, contextDays: Number(e.target.value) },
                      })
                    }
                    className="w-20 rounded-md border border-input bg-background px-2 py-1 text-right font-mono text-xs focus:border-primary focus:outline-none"
                  />
                </Field>
                <Select
                  label="Tone"
                  value={s.ai.tone}
                  options={["concise", "detailed", "friendly"]}
                  onChange={(v) =>
                    update.mutate({ ai: { ...s.ai, tone: v as "concise" } })
                  }
                />
              </Card>

              <Card>
                <CardHeader title="Synchronization" />
                <Select
                  label="Frequency"
                  value={s.sync.frequency}
                  options={["realtime", "hourly", "daily"]}
                  onChange={(v) =>
                    update.mutate({ sync: { frequency: v as "hourly" } })
                  }
                />
              </Card>
            </>
          )}
        </QueryState>

        <Card className="lg:col-span-2">
          <CardHeader title="Account" />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-medium">{user?.name || user?.username || "—"}</p>
              <p className="text-xs text-muted-foreground">
                {user?.email || "No email on file"}
              </p>
            </div>
            <button
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
            >
              {logout.isPending ? <Spinner /> : null}
              Sign out
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-input bg-background px-2 py-1 text-xs capitalize focus:border-primary focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Field label={label}>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </Field>
  );
}
