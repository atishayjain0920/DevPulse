import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award } from "lucide-react";
import { PageHeader } from "@/components/devpulse/AppShell";
import { Card, CardHeader, ListSkeleton } from "@/components/ui-kit/Card";
import { QueryState } from "@/components/ui-kit/QueryState";
import { Skeleton } from "@/components/ui-kit/Skeleton";
import { AnimatedCounter } from "@/components/ui-kit/AnimatedCounter";
import { EmptyState } from "@/components/ui-kit/EmptyState";
import { queryKeys } from "@/lib/api/queryKeys";
import { profileService } from "@/lib/api/services";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, initialsFrom, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — DevPulse" },
      {
        name: "description",
        content:
          "Your contribution history, language mix, achievements, and recent engineering activity.",
      },
      { property: "og:title", content: "Profile — DevPulse" },
      {
        property: "og:description",
        content: "Contribution history, languages, and achievements.",
      },
    ],
  }),
  component: Profile,
});

const LEVEL_TONE = [
  "bg-muted",
  "bg-primary/25",
  "bg-primary/50",
  "bg-primary/75",
  "bg-primary",
];

function Profile() {
  const { user, isLoading } = useAuth();
  const username = user?.username ?? "";
  const enabled = !!username;

  const statsQ = useQuery({
    queryKey: queryKeys.profile.stats(username),
    queryFn: () => profileService.stats(username),
    enabled,
  });
  const contributionsQ = useQuery({
    queryKey: queryKeys.profile.contributions(username),
    queryFn: () => profileService.contributions(username),
    enabled,
  });
  const languagesQ = useQuery({
    queryKey: queryKeys.profile.languages(username),
    queryFn: () => profileService.languages(username),
    enabled,
  });
  const achievementsQ = useQuery({
    queryKey: queryKeys.profile.achievements(username),
    queryFn: () => profileService.achievements(username),
    enabled,
  });
  const topReposQ = useQuery({
    queryKey: queryKeys.profile.topRepos(username),
    queryFn: () => profileService.topRepos(username),
    enabled,
  });
  const activityQ = useQuery({
    queryKey: queryKeys.profile.activity(username),
    queryFn: () => profileService.activity(username),
    enabled,
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!user)
    return (
      <EmptyState
        title="Profile unavailable"
        description="Sign in with GitHub to view your engineering profile."
      />
    );

  return (
    <>
      <PageHeader title="Profile" subtitle="Your engineering footprint over time." />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="h-16 w-16 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-muted text-sm font-medium">
              {initialsFrom(user.name || user.username)}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">
              {user.name || user.username}
            </h2>
            <p className="font-mono text-xs text-muted-foreground">@{user.username}</p>
            {user.bio ? (
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{user.bio}</p>
            ) : null}
            {user.createdAt ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Joined {formatDate(user.createdAt)}
              </p>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QueryState
          query={statsQ}
          skeleton={
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </>
          }
          errorTitle="Profile stats unavailable"
          emptyTitle="No stats yet"
          emptyDescription="Statistics appear once your activity is synchronized."
        >
          {(s) => (
            <>
              <Stat label="Commits" value={s.commits} />
              <Stat label="Pull requests" value={s.pullRequests} />
              <Stat label="Reviews" value={s.reviews} />
              <Stat label="Productivity" value={s.productivityScore ?? 0} suffix="/100" />
            </>
          )}
        </QueryState>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Contribution activity" />
          <QueryState
            query={contributionsQ}
            skeleton={<Skeleton className="h-28 w-full" />}
            emptyTitle="No contributions recorded"
            emptyDescription="Your contribution graph fills in as commits are synced."
          >
            {(days) => (
              <div className="flex flex-wrap gap-1">
                {days.map((d) => (
                  <span
                    key={d.date}
                    title={`${d.count} contributions on ${formatDate(d.date)}`}
                    className={`h-3 w-3 rounded-[3px] ${LEVEL_TONE[d.level] ?? LEVEL_TONE[0]}`}
                  />
                ))}
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
            emptyDescription="Language usage appears after your repositories are analyzed."
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
          <CardHeader title="Achievements" />
          <QueryState
            query={achievementsQ}
            skeleton={<ListSkeleton rows={3} />}
            emptyTitle="No achievements yet"
            emptyDescription="Milestones unlock as your activity grows."
          >
            {(items) => (
              <ul className="space-y-3 text-sm">
                {items.map((a) => (
                  <li key={a.id} className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                      <Award className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(a.earnedAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </QueryState>
        </Card>

        <Card>
          <CardHeader title="Top repositories" />
          <QueryState
            query={topReposQ}
            skeleton={<ListSkeleton rows={4} />}
            emptyTitle="No repositories"
            emptyDescription="Your most active repositories will appear here."
          >
            {(repos) => (
              <ul className="space-y-3 text-sm">
                {repos.map((r) => (
                  <li key={r.id}>
                    <Link
                      to="/app/repositories/$id"
                      params={{ id: r.id }}
                      className="block truncate font-mono text-xs hover:text-primary"
                    >
                      {r.fullName || r.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.language ?? "—"} · {r.stars} stars
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </QueryState>
        </Card>

        <Card>
          <CardHeader title="Recent activity" />
          <QueryState
            query={activityQ}
            skeleton={<ListSkeleton />}
            isEmpty={(d) => !d?.items?.length}
            emptyTitle="No recent activity"
            emptyDescription="Activity appears after the next synchronization."
          >
            {(page) => (
              <ul className="space-y-3 text-sm">
                {page.items.slice(0, 8).map((a) => (
                  <li key={a.id} className="min-w-0">
                    <p className="truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.repository} · {timeAgo(a.createdAt)}
                    </p>
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
    <Card>
      <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-mono text-2xl font-semibold tracking-tight">
        <AnimatedCounter value={value} />
        {suffix ? (
          <span className="text-sm text-muted-foreground">{suffix}</span>
        ) : null}
      </p>
    </Card>
  );
}
