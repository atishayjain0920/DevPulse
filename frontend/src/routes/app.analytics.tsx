import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/devpulse/AppShell";
import { Card, CardHeader, ListSkeleton } from "@/components/ui-kit/Card";
import { QueryState } from "@/components/ui-kit/QueryState";
import { Skeleton } from "@/components/ui-kit/Skeleton";
import { queryKeys } from "@/lib/api/queryKeys";
import { analyticsService, repositoriesService } from "@/lib/api/services";
import { healthTone } from "@/lib/format";
import type { AnalyticsTimeseriesPoint } from "@/lib/api/types";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — DevPulse" },
      {
        name: "description",
        content:
          "Delivery analytics across repositories and developers: throughput, review latency, and workflow reliability.",
      },
      { property: "og:title", content: "Analytics — DevPulse" },
      {
        property: "og:description",
        content: "Throughput, review latency, and reliability analytics for your GitHub org.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const RANGES = ["7d", "30d", "90d"] as const;

function AnalyticsPage() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("30d");
  const [repositoryId, setRepositoryId] = useState<string>("");
  const [developer, setDeveloper] = useState<string>("");

  const filters = {
    range,
    repositoryId: repositoryId || undefined,
    developer: developer || undefined,
  };

  const reposQ = useQuery({
    queryKey: queryKeys.repositories.all(),
    queryFn: () => repositoriesService.list(),
  });
  const overviewQ = useQuery({
    queryKey: queryKeys.analytics.overview(filters),
    queryFn: () => analyticsService.overview(filters),
  });
  const seriesQ = useQuery({
    queryKey: queryKeys.analytics.timeseries(filters),
    queryFn: () => analyticsService.timeseries(filters),
  });
  const contributorsQ = useQuery({
    queryKey: queryKeys.analytics.contributors(filters),
    queryFn: () => analyticsService.contributors(filters),
  });
  const repoBreakdownQ = useQuery({
    queryKey: queryKeys.analytics.repositories(filters),
    queryFn: () => analyticsService.repositories(filters),
  });

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Delivery performance across repositories, developers, and workflows."
        actions={
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
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <select
          value={repositoryId}
          onChange={(e) => setRepositoryId(e.target.value)}
          aria-label="Filter by repository"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm sm:w-64"
        >
          <option value="">All repositories</option>
          {(reposQ.data ?? []).map((r) => (
            <option key={r.id} value={r.id}>
              {r.fullName}
            </option>
          ))}
        </select>
        <input
          value={developer}
          onChange={(e) => setDeveloper(e.target.value)}
          placeholder="Filter by developer username"
          aria-label="Filter by developer"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm sm:w-64"
        />
      </div>

      <QueryState
        query={overviewQ}
        skeleton={
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-3 h-7 w-24" />
              </div>
            ))}
          </div>
        }
        emptyTitle="No analytics yet"
        emptyDescription="Analytics appear once GitHub synchronization has completed."
        errorTitle="Analytics unavailable"
      >
        {(o) => (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Commits" value={o.commits} />
            <Stat label="Pull requests" value={o.pullRequests} />
            <Stat label="Review latency" value={o.reviewLatencyHours} suffix="h" />
            <Stat label="Workflow success" value={o.workflowSuccessRate} suffix="%" />
          </div>
        )}
      </QueryState>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Activity over time" hint={`Last ${range}`} />
          <QueryState
            query={seriesQ}
            skeleton={<Skeleton className="h-48 w-full" />}
            emptyTitle="No time series data"
            emptyDescription="Charts render as soon as activity is available for these filters."
            errorTitle="Chart data unavailable"
          >
            {(points) => <SeriesChart points={points} />}
          </QueryState>
        </Card>

        <Card>
          <CardHeader title="Top developers" />
          <QueryState
            query={contributorsQ}
            skeleton={<ListSkeleton />}
            emptyTitle="No contributor data"
            emptyDescription="Contributor analytics appear after the next sync."
            errorTitle="Contributor analytics unavailable"
          >
            {(rows) => (
              <ul className="space-y-3">
                {rows.slice(0, 6).map((c) => (
                  <li key={c.username} className="flex items-center gap-3 text-sm">
                    <span className="min-w-0 flex-1 truncate">{c.username}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {c.commits} commits · {c.prs} PRs
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </QueryState>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Repository breakdown" />
        <QueryState
          query={repoBreakdownQ}
          skeleton={<ListSkeleton rows={6} />}
          emptyTitle="No repository analytics"
          emptyDescription="Repository-level analytics appear once data is synced."
          errorTitle="Repository analytics unavailable"
        >
          {(rows) => (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <th className="pb-3 font-medium">Repository</th>
                    <th className="pb-3 font-medium">Commits</th>
                    <th className="pb-3 font-medium">PRs merged</th>
                    <th className="pb-3 font-medium">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => (
                    <tr key={r.repositoryId}>
                      <td className="py-3 font-mono text-xs">{r.name}</td>
                      <td className="py-3">{r.commits}</td>
                      <td className="py-3">{r.prsMerged}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${healthTone(r.healthScore)}`}
                              style={{ width: `${r.healthScore}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">
                            {r.healthScore}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </QueryState>
      </Card>
    </>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong">
      <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold tracking-tight">
        {value}
        {suffix ? <span className="text-base text-muted-foreground">{suffix}</span> : null}
      </div>
    </div>
  );
}

function SeriesChart({ points }: { points: AnalyticsTimeseriesPoint[] }) {
  const width = 460;
  const height = 120;
  const max = Math.max(1, ...points.map((p) => Math.max(p.commits, p.pullRequests)));
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const toPath = (key: "commits" | "pullRequests") =>
    points
      .map(
        (p, i) =>
          `${(i * step).toFixed(1)},${(height - (p[key] / max) * (height - 12)).toFixed(1)}`,
      )
      .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full">
      {[24, 48, 72, 96].map((y) => (
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
        points={toPath("commits")}
      />
      <polyline
        fill="none"
        stroke="var(--color-info)"
        strokeWidth="1.4"
        strokeDasharray="4 3"
        points={toPath("pullRequests")}
      />
    </svg>
  );
}
