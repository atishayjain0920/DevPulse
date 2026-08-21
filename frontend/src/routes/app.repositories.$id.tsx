import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, GitBranch, Star } from "lucide-react";
import { PageHeader } from "@/components/devpulse/AppShell";
import { Card, CardHeader, ListSkeleton } from "@/components/ui-kit/Card";
import { QueryState } from "@/components/ui-kit/QueryState";
import { Skeleton } from "@/components/ui-kit/Skeleton";
import { queryKeys } from "@/lib/api/queryKeys";
import { repositoriesService } from "@/lib/api/services";
import { healthTone, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/app/repositories/$id")({
  component: RepositoryDetail,
  errorComponent: ({ error }) => (
    <p role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </p>
  ),
  notFoundComponent: () => (
    <p className="p-6 text-sm text-muted-foreground">Repository not found.</p>
  ),
});

function RepositoryDetail() {
  const { id } = Route.useParams();

  const repoQ = useQuery({
    queryKey: queryKeys.repositories.detail(id),
    queryFn: () => repositoriesService.get(id),
  });
  const commitsQ = useQuery({
    queryKey: queryKeys.repositories.commits(id),
    queryFn: () => repositoriesService.commits(id),
  });
  const prsQ = useQuery({
    queryKey: queryKeys.repositories.prs(id),
    queryFn: () => repositoriesService.pullRequests(id),
  });
  const issuesQ = useQuery({
    queryKey: queryKeys.repositories.issues(id),
    queryFn: () => repositoriesService.issues(id),
  });
  const workflowsQ = useQuery({
    queryKey: queryKeys.repositories.workflows(id),
    queryFn: () => repositoriesService.workflows(id),
  });
  const contributorsQ = useQuery({
    queryKey: queryKeys.repositories.contributors(id),
    queryFn: () => repositoriesService.contributors(id),
  });
  const languagesQ = useQuery({
    queryKey: queryKeys.repositories.languages(id),
    queryFn: () => repositoriesService.languages(id),
  });
  const aiQ = useQuery({
    queryKey: queryKeys.repositories.aiSummary(id),
    queryFn: () => repositoriesService.aiSummary(id),
  });

  return (
    <>
      <Link
        to="/app/repositories"
        className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All repositories
      </Link>

      <QueryState
        query={repoQ}
        skeleton={<Skeleton className="mb-6 h-16 w-full" />}
        emptyTitle="Repository unavailable"
        emptyDescription="This repository has not been synchronized yet."
      >
        {(repo) => (
          <PageHeader
            title={repo.name}
            subtitle={repo.description || repo.fullName}
            actions={
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" /> {repo.stars}
                </span>
                <span className="inline-flex items-center gap-1">
                  <GitBranch className="h-3.5 w-3.5" /> {repo.forks}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <span
                      className={`block h-full rounded-full ${healthTone(repo.healthScore)}`}
                      style={{ width: `${repo.healthScore}%` }}
                    />
                  </span>
                  <span className="font-mono">{repo.healthScore}</span>
                </span>
                <span>synced {timeAgo(repo.lastSyncedAt)}</span>
              </div>
            }
          />
        )}
      </QueryState>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="AI summary" />
          <QueryState
            query={aiQ}
            skeleton={<ListSkeleton rows={3} />}
            emptyTitle="No AI summary available"
            emptyDescription="A summary is generated after this repository is analyzed."
          >
            {(ai) => (
              <div className="space-y-4 text-sm">
                <p className="text-foreground/90">{ai.summary}</p>
                {ai.risks?.length ? (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-warning">
                      Risks
                    </div>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                      {ai.risks.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {ai.recommendations?.length ? (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                      Recommendations
                    </div>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                      {ai.recommendations.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </QueryState>
        </Card>

        <Card>
          <CardHeader title="Languages" />
          <QueryState
            query={languagesQ}
            skeleton={<ListSkeleton rows={4} />}
            emptyTitle="No language data"
            emptyDescription="Language breakdown appears after the next sync."
          >
            {(langs) => (
              <div className="space-y-3">
                {langs.map((l) => (
                  <div key={l.name}>
                    <div className="flex justify-between text-xs">
                      <span>{l.name}</span>
                      <span className="font-mono text-muted-foreground">
                        {l.percentage}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-700"
                        style={{ width: `${l.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </QueryState>
        </Card>

        <Card>
          <CardHeader title="Pull requests" />
          <QueryState
            query={prsQ}
            skeleton={<ListSkeleton />}
            emptyTitle="No pull requests"
            emptyDescription="Pull requests for this repository will be listed here."
          >
            {(prs) => (
              <ul className="space-y-3 text-sm">
                {prs.slice(0, 8).map((pr) => (
                  <li key={pr.id} className="min-w-0">
                    <p className="truncate">{pr.title}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">#{pr.number}</span> · {pr.status} ·{" "}
                      {timeAgo(pr.updatedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </QueryState>
        </Card>

        <Card>
          <CardHeader title="Commits" />
          <QueryState
            query={commitsQ}
            skeleton={<ListSkeleton />}
            emptyTitle="No commits"
            emptyDescription="Commit history appears after synchronization."
          >
            {(commits) => (
              <ul className="space-y-3 text-sm">
                {commits.slice(0, 8).map((c) => (
                  <li key={c.sha} className="min-w-0">
                    <p className="truncate">{c.message}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">{c.sha.slice(0, 7)}</span> ·{" "}
                      {c.author.username} · {timeAgo(c.committedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </QueryState>
        </Card>

        <Card>
          <CardHeader title="Issues" />
          <QueryState
            query={issuesQ}
            skeleton={<ListSkeleton />}
            errorTitle="Issues endpoint unavailable"
            emptyTitle="No issues"
            emptyDescription="Open issues for this repository will be listed here."
          >
            {(issues) => (
              <ul className="space-y-3 text-sm">
                {issues.slice(0, 8).map((issue) => (
                  <li key={issue.id} className="min-w-0">
                    <p className="truncate">{issue.title}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">#{issue.number}</span> · {issue.state}{" "}
                      · {timeAgo(issue.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </QueryState>
        </Card>

        <Card>
          <CardHeader title="Workflows" />
          <QueryState
            query={workflowsQ}
            skeleton={<ListSkeleton />}
            emptyTitle="No workflow runs"
            emptyDescription="CI runs appear here once GitHub Actions data is synced."
          >
            {(runs) => (
              <ul className="space-y-3 text-sm">
                {runs.slice(0, 8).map((w) => (
                  <li key={w.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">{w.name}</span>
                    <span
                      className={`shrink-0 text-xs ${
                        w.status === "success"
                          ? "text-success"
                          : w.status === "failure"
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }`}
                    >
                      {w.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </QueryState>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Contributors" />
          <QueryState
            query={contributorsQ}
            skeleton={<ListSkeleton />}
            emptyTitle="No contributors"
            emptyDescription="Contributor stats appear after commits are synchronized."
          >
            {(people) => (
              <ul className="grid gap-3 sm:grid-cols-2">
                {people.map((c) => (
                  <li key={c.username} className="flex items-center gap-3 text-sm">
                    {c.avatarUrl ? (
                      <img
                        src={c.avatarUrl}
                        alt={c.username}
                        loading="lazy"
                        className="h-8 w-8 rounded-full border border-border object-cover"
                      />
                    ) : (
                      <span className="h-8 w-8 rounded-full bg-muted" />
                    )}
                    <div className="min-w-0">
                      <div className="truncate">{c.name || c.username}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.commits} commits · {c.prs} PRs · {c.reviews} reviews
                      </div>
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
