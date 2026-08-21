import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Plus } from "lucide-react";
import { PageHeader } from "@/components/devpulse/AppShell";
import { QueryState } from "@/components/ui-kit/QueryState";
import { Skeleton } from "@/components/ui-kit/Skeleton";
import { Spinner } from "@/components/ui-kit/Spinner";
import { ErrorState } from "@/components/ui-kit/ErrorState";
import { queryKeys } from "@/lib/api/queryKeys";
import { reportsService } from "@/lib/api/services";
import { formatDate, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/app/reports")({
  head: () => ({
    meta: [
      { title: "Reports — DevPulse" },
      {
        name: "description",
        content:
          "Generate and download engineering reports covering velocity, review load, and workflow reliability.",
      },
      { property: "og:title", content: "Reports — DevPulse" },
      {
        property: "og:description",
        content: "Generate and download engineering performance reports.",
      },
    ],
  }),
  component: Reports,
});

const RANGES = ["7d", "30d", "90d"] as const;

function Reports() {
  const qc = useQueryClient();
  const [range, setRange] = useState<(typeof RANGES)[number]>("30d");

  const reportsQ = useQuery({
    queryKey: queryKeys.reports.all,
    queryFn: () => reportsService.list(),
    refetchInterval: (q) =>
      (q.state.data ?? []).some((r) => r.status === "generating") ? 5_000 : false,
  });

  const generate = useMutation({
    mutationFn: () =>
      reportsService.generate({ name: `Engineering report (${range})`, range }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.reports.all }),
  });

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Exportable summaries of delivery performance and repository health."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-border bg-surface p-0.5">
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
                  {r}
                </button>
              ))}
            </div>
            <button
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {generate.isPending ? <Spinner /> : <Plus className="h-3.5 w-3.5" />}
              Generate report
            </button>
          </div>
        }
      />

      {generate.isError ? (
        <ErrorState
          error={generate.error}
          title="Couldn't generate the report"
          onRetry={() => generate.mutate()}
          className="mb-4"
        />
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <QueryState
          query={reportsQ}
          skeleton={
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          }
          emptyTitle="No reports yet"
          emptyDescription="Generate your first report to export delivery metrics for a date range."
        >
          {(reports) => (
            <ul className="divide-y divide-border">
              {reports.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(r.createdAt)} · {timeAgo(r.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs ${
                        r.status === "ready"
                          ? "text-success"
                          : r.status === "failed"
                            ? "text-destructive"
                            : "text-warning"
                      }`}
                    >
                      {r.status}
                    </span>
                    {r.status === "ready" && r.downloadUrl ? (
                      <a
                        href={r.downloadUrl}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs transition-colors hover:bg-accent"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {r.status === "generating" ? "Preparing…" : "Unavailable"}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </QueryState>
      </div>
    </>
  );
}
