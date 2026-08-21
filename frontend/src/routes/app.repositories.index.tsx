import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GitBranch, Search, Star } from "lucide-react";
import { PageHeader } from "@/components/devpulse/AppShell";
import { QueryState } from "@/components/ui-kit/QueryState";
import { Skeleton } from "@/components/ui-kit/Skeleton";
import { queryKeys } from "@/lib/api/queryKeys";
import { repositoriesService } from "@/lib/api/services";
import { healthTone, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/app/repositories/")({
  component: Repositories,
});

function Repositories() {
  const [filter, setFilter] = useState("");
  const reposQ = useQuery({
    queryKey: queryKeys.repositories.all(),
    queryFn: () => repositoriesService.list(),
  });

  const term = filter.trim().toLowerCase();

  return (
    <>
      <PageHeader
        title="Repositories"
        subtitle="Health, activity, and AI summaries across every tracked repo."
        actions={
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter repositories…"
              className="w-full rounded-md border border-input bg-surface py-1.5 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:w-64"
            />
          </div>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="hidden grid-cols-[1fr_120px_120px_100px] gap-4 border-b border-border px-5 py-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground md:grid">
          <div>Repository</div>
          <div>Language</div>
          <div>Health</div>
          <div className="text-right">Open PRs</div>
        </div>
        <QueryState
          query={reposQ}
          skeleton={
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          }
          emptyTitle="No repositories synchronized"
          emptyDescription="Once DevPulse syncs your GitHub organization, repositories appear here."
        >
          {(repos) => {
            const visible = term
              ? repos.filter(
                  (r) =>
                    r.name.toLowerCase().includes(term) ||
                    r.fullName.toLowerCase().includes(term) ||
                    (r.description ?? "").toLowerCase().includes(term),
                )
              : repos;

            if (!visible.length)
              return (
                <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No repositories match “{filter}”.
                </p>
              );

            return (
              <ul className="divide-y divide-border">
                {visible.map((r) => (
                  <li key={r.id}>
                    <Link
                      to="/app/repositories/$id"
                      params={{ id: r.id }}
                      className="grid gap-2 px-5 py-4 text-sm transition-colors hover:bg-accent/40 md:grid-cols-[1fr_120px_120px_100px] md:items-center md:gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 font-medium">
                          <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-mono">{r.fullName || r.name}</span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3" />
                            {r.stars}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {r.forks} forks
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {r.description || "No description"} · synced{" "}
                          {timeAgo(r.lastSyncedAt)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.language ?? "—"}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-[width] duration-700 ${healthTone(r.healthScore)}`}
                            style={{ width: `${r.healthScore}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs">{r.healthScore}</span>
                      </div>
                      <div className="font-mono text-xs md:text-right">
                        {r.openPRs} open PRs
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            );
          }}
        </QueryState>
      </div>
    </>
  );
}
