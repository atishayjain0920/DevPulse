import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CircleAlert,
  GitCommit,
  GitPullRequest,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/devpulse/AppShell";
import { QueryState } from "@/components/ui-kit/QueryState";
import { Card, CardHeader, ListSkeleton } from "@/components/ui-kit/Card";
import { Skeleton } from "@/components/ui-kit/Skeleton";
import { AnimatedCounter } from "@/components/ui-kit/AnimatedCounter";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  aiService,
  dashboardService,
  repositoriesService,
} from "@/lib/api/services";
import { useAuth } from "@/hooks/useAuth";
import { formatDelta, healthTone, timeAgo } from "@/lib/format";
import type { DashboardTrendPoint } from "@/lib/api/types";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — DevPulse" },
      {
        name: "description",
        content:
          "Engineering health overview: cycle time, PR throughput, workflow reliability, and AI recommendations.",
      },
      { property: "og:title", content: "Dashboard — DevPulse" },
      {
        property: "og:description",
        content:
          "Engineering health overview: cycle time, PR throughput, workflow reliability, and AI recommendations.",
      },
    ],
  }),
  component: Dashboard,
});

const RANGES = ["7d", "30d", "90d"] as const;

function Dashboard() {
  const { user } = useAuth();
  const [range, setRange] = useState<(typeof RANGES)[number]>("30d");

  const metricsQ = useQuery({
    queryKey: queryKeys.dashboard.metrics(range),
    queryFn: () => dashboardService.metrics(range),
  });
  const trendsQ = useQuery({
    queryKey: queryKeys.dashboard.trends(range),
    queryFn: () => dashboardService.trends(range),
  });
  const activityQ = useQuery({
    queryKey: queryKeys.dashboard.activity,
    queryFn: () => dashboardService.activity(),
  });
  const reposQ = useQuery({
    queryKey: queryKeys.repositories.all(),
    queryFn: () => repositoriesService.list(),
  });
  const prsQ = useQuery({
    queryKey: queryKeys.dashboard.recentPRs,
    queryFn: () => dashboardService.recentPRs(),
  });
  const insightsQ = useQuery({
    queryKey: queryKeys.ai.insights,
    queryFn: () => aiService.insights(),
  });
  const syncQ = useQuery({
    queryKey: queryKeys.dashboard.sync,
    queryFn: () => dashboardService.syncStatus(),
    refetchInterval: 60_000,
  });

  const displayName = user?.name || user?.username;

  return (
    <>
      <PageHeader
        title={displayName ? `Welcome back, ${displayName}` : "Dashboard"}
        subtitle="Here's what's happening across your engineering org."
        actions={
          <>
            <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded px-2.5 py-1 text-xs transition-colors ${
                    range === r
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Last {r}
                </button>
              ))}
            </div>
            <Link
              to="/app/reports"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
            >
              Generate report
            </Link>
          </>
        }
      />

      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <RefreshCw
          className={`h-3 w-3 ${syncQ.data?.inProgress ? "animate-spin" : ""}`}
        />
        {syncQ.isPending ? (
          <Skeleton className="h-3 w-40" />
        ) : syncQ.isError ? (
          <span>Sync status unavailable</span>
        ) : syncQ.data?.inProgress ? (
          <span>Syncing… {syncQ.data.progress}%</span>
        ) : (
          <span>Last synced {timeAgo(syncQ.data?.lastSyncedAt)}</span>
        )}
      </div>

      {/* KPI cards */}
      <QueryState
        query={metricsQ}
        skeleton={
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-3 h-7 w-24" />
                <Skeleton className="mt-3 h-3 w-12" />
              </div>
            ))}
          </div>
        }
        emptyTitle="No metrics yet"
        emptyDescription="Metrics appear once your first sync completes."
      >
        {(m) => (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Kpi
              label="Cycle time"
              value={m.cycleTimeHours}
              format={(n) => `${(n / 24).toFixed(1)}d`}
              delta={formatDelta(m.cycleTimeDelta)}
            />
            <Kpi
              label="PRs merged"
              value={m.prsMerged}
              delta={formatDelta(m.prsMergedDelta)}
            />
            <Kpi
              label="Health score"
              value={m.healthScore}
              delta={formatDelta(m.healthScoreDelta)}
            />
            <Kpi
              label="Active contributors"
              value={m.activeContributors}
              delta={formatDelta(m.activeContributorsDelta)}
            />
          </div>
        )}
      </QueryState>

      {/* Main grid */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Deployment velocity" hint={`Commits & PRs, last ${range}`} />
          <QueryState
            query={trendsQ}
            skeleton={<Skeleton className="h-40 w-full" />}
            emptyTitle="No trend data"
            emptyDescription="Trend charts render as soon as activity is synced."
          >
            {(points) => <VelocityChart points={points} />}
          </QueryState>
        </Card>

        <Card>
          <CardHeader
            title="AI insights"
            icon={<Sparkles className="h-3.5 w-3.5 text-primary" />}
          />
          <QueryState
            query={insightsQ}
            skeleton={
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            }
            emptyTitle="No insights yet"
            emptyDescription="AI insights appear after your activity is analyzed."
          >
            {(insights) => (
              <div className="space-y-3">
                {insights.slice(0, 3).map((insight) => (
                  <div
                    key={insight.id}
                    className="rounded-lg border border-border bg-background p-3"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                      {insight.title}
                    </div>
                    <p className="mt-1 text-sm text-foreground/90">{insight.body}</p>
                  </div>
                ))}
              </div>
            )}
          </QueryState>
          <Link
            to="/app/ai"
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Bot className="h-3.5 w-3.5" /> Open AI workspace
          </Link>
        </Card>
      </div>

      {/* Second row */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Recent activity" />
          <QueryState
            query={activityQ}
            skeleton={<ListSkeleton />}
            emptyTitle="No recent activity"
            emptyDescription="Commits, PRs, and reviews will appear here after syncing."
          >
            {(items) => (
              <ul className="divide-y divide-border">
                {items.slice(0, 6).map((a: any) => (
                  <li key={a.id} className="flex items-start gap-3 py-3 text-sm">
                    <GitCommit className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate">
                        <span className="font-medium">{a.actor.username}</span>{" "}
                        <span className="text-muted-foreground">
                          {a.type.replace("_", " ")}
                        </span>{" "}
                        {a.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{a.repository}</span> ·{" "}
                        {timeAgo(a.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </QueryState>
        </Card>

        <Card>
          <CardHeader title="Repository health" />
          <QueryState
            query={reposQ}
            skeleton={<ListSkeleton />}
            emptyTitle="No repositories"
            emptyDescription="Connect repositories to see health scores."
          >
            {(repos) => (
              <ul className="space-y-3">
                {repos.slice(0, 5).map((r) => (
                  <li key={r.id} className="flex items-center gap-3">
                    <span className="w-28 truncate font-mono text-sm">{r.name}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-[width] duration-700 ${healthTone(r.healthScore)}`}
                        style={{ width: `${r.healthScore}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-xs text-muted-foreground">
                      {r.healthScore}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </QueryState>
        </Card>

        <Card>
          <CardHeader title="Open pull requests" />
          <QueryState
            query={prsQ}
            skeleton={<ListSkeleton />}
            emptyTitle="No open pull requests"
            emptyDescription="Open PRs across your repositories will be listed here."
          >
            {(prs) => (
              <ul className="space-y-3">
                {prs.slice(0, 5).map((pr) => (
                  <li key={pr.id} className="flex items-start gap-3 text-sm">
                    <GitPullRequest className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="truncate">{pr.title}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">#{pr.number}</span> ·{" "}
                        {timeAgo(pr.updatedAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </QueryState>
        </Card>
      </div>
    </>
  );
}

function Kpi({
  label,
  value,
  delta,
  format,
}: {
  label: string;
  value: number;
  delta: string;
  format?: (n: number) => string;
}) {
  const toneClass = delta.startsWith("-")
    ? "text-destructive"
    : delta.startsWith("+")
      ? "text-success"
      : "text-info";
  return (
    <div className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong">
      <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold tracking-tight">
        <AnimatedCounter value={value} format={format} />
      </div>
      <div className={`mt-2 flex items-center gap-1 text-xs ${toneClass}`}>
        {delta.startsWith("+") ? (
          <ArrowUpRight className="h-3 w-3" />
        ) : delta.startsWith("-") ? (
          <ArrowDownRight className="h-3 w-3" />
        ) : (
          <CircleAlert className="h-3 w-3" />
        )}
        {delta}
      </div>
    </div>
  );
}

function VelocityChart({ points }: { points: DashboardTrendPoint[] }) {
  const width = 460;
  const height = 100;
  const max = Math.max(1, ...points.map((p) => p.commits));
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const path = points
    .map((p, i) => `${(i * step).toFixed(1)},${(height - (p.commits / max) * (height - 10)).toFixed(1)}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full">
      <defs>
        <linearGradient id="v-lg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[20, 40, 60, 80].map((y) => (
        <line
          key={y}
          x1="0"
          x2={width}
          y1={y}
          y2={y}
          stroke="var(--color-border)"
          strokeDasharray="2 4"
        />
      ))}
      <polyline
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={path}
        className="animate-[fade-in_0.6s_ease-out]"
      />
      <polygon points={`${path} ${width},${height} 0,${height}`} fill="url(#v-lg)" />
    </svg>
  );
}
