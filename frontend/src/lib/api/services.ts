/**
 * Feature-oriented API services. Each service is a thin wrapper around the
 * shared `api` client and returns typed domain models. Backend routes match
 * the Express API contract: `/auth/*`, `/api/*`.
 */
import { api, API_BASE_URL } from "./client";
import type {
  Achievement,
  AnalyticsContributor,
  AnalyticsFilters,
  AnalyticsOverview,
  AnalyticsRepositoryRow,
  AnalyticsTimeseriesPoint,
  ActivityItem,
  AIConversation,
  AIInsight,
  AIMessage,
  AIRecommendation,
  Commit,
  Contributor,
  Issue,
  ContributionDay,
  CurrentUser,
  DashboardMetrics,
  DashboardTrendPoint,
  LanguageStat,
  Notification,
  Paginated,
  PullRequest,
  ProfileStats,
  Report,
  Repository,
  RepositoryAISummary,
  SearchResults,
  SyncStatus,
  UserSettings,
  WeeklySummary,
  WorkflowRun,
} from "./types";

export const authService = {
  me: () => api.get<any>("/api/v1/users/me").then(res => ({
    id: res.id,
    githubId: res.githubId ? Number(res.githubId) : undefined,
    username: res.username,
    name: res.displayName,
    email: res.email,
    avatarUrl: res.avatarUrl,
    bio: res.bio,
    role: res.role?.name ?? null,
    createdAt: res.createdAt
  })),
  logout: () => api.post<void>("/api/v1/auth/logout"),
  githubLogin: (redirectTo?: string) => {
    const query = redirectTo ? { redirect: redirectTo } : undefined;
    return api.get<{ authorizationUrl: string }>("/api/v1/auth/github", { query });
  },
};

export const dashboardService = {
  metrics: (range = "7d") =>
    api.get<any>("/api/v1/dashboard/developer").then(res => ({
      prsMerged: res.cards.mergedPrs || 0,
      prsMergedDelta: 0,
      commits: res.cards.totalCommits || 0,
      commitsDelta: 0,
      activeContributors: res.cards.activeContributors || 0,
      activeContributorsDelta: 0,
      healthScore: res.cards.repositoryHealth || 0,
      healthScoreDelta: 0,
      cycleTimeHours: res.cards.cycleTimeHours || 0,
      cycleTimeDelta: 0,
    })),
  trends: (range = "30d") =>
    api.get<any>("/api/v1/dashboard/developer").then(res =>
      res.charts.commitTrend.map((p: any) => ({
        date: p.date,
        commits: p.commits || 0,
        prs: 0,
        reviews: 0
      }))
    ),
  activity: () =>
    api.get<any>("/api/v1/dashboard/developer").then(res =>
      res.recentActivity.map((act: any) => ({
        id: act.id,
        type: "commit" as const,
        actor: {
          username: act.author?.username || "developer",
          avatarUrl: act.author?.avatarUrl || null
        },
        repository: act.repository?.name || "repo",
        title: act.message || "",
        createdAt: act.commitDate
      }))
    ),
  topContributors: () => Promise.resolve([]),
  recentPRs: () =>
    api.get<any[]>("/api/v1/pull-requests").then(prs =>
      prs.map(pr => ({
        id: pr.id,
        number: pr.githubPRNumber,
        title: pr.title,
        repository: pr.repository?.name || "repo",
        author: {
          username: pr.author?.username || "developer",
          avatarUrl: pr.author?.avatarUrl || null
        },
        status: pr.state?.toLowerCase() === "open" ? "open" as const : pr.state?.toLowerCase() === "merged" ? "merged" as const : pr.state?.toLowerCase() === "closed" ? "closed" as const : "draft" as const,
        createdAt: pr.createdAtGitHub,
        updatedAt: pr.createdAtGitHub,
        url: pr.url || ""
      }))
    ),
  recentCommits: () => Promise.resolve([]),
  workflowRuns: () => Promise.resolve([]),
  syncStatus: () =>
    api.get<any[]>("/api/v1/repositories").then(repos => {
      const lastSynced = repos.reduce((latest, repo) => {
        if (!repo.syncedAt) return latest;
        const d = new Date(repo.syncedAt);
        return (!latest || d > latest) ? d : latest;
      }, null as Date | null);
      return {
        lastSyncedAt: lastSynced ? lastSynced.toISOString() : null,
        inProgress: false,
        progress: 100,
        message: "Synchronized with GitHub"
      };
    }),
  triggerSync: () =>
    api.get<any[]>("/api/v1/repositories").then(async repos => {
      if (repos.length > 0) {
        await api.post(`/api/v1/repositories/${repos[0].id}/sync`);
      }
      return {
        lastSyncedAt: new Date().toISOString(),
        inProgress: false,
        progress: 100,
        message: "Sync triggered"
      };
    }),
};

export const repositoriesService = {
  list: (filter?: string) =>
    api.get<any[]>("/api/v1/repositories", { query: filter ? { filter } : undefined }).then(repos =>
      repos.map(r => ({
        id: r.id,
        name: r.name,
        fullName: r.fullName,
        description: r.description,
        language: r.language,
        stars: r.stars,
        forks: r.forks,
        openPRs: 0,
        openIssues: r.openIssues,
        healthScore: 100,
        lastSyncedAt: r.syncedAt,
        private: r.visibility === "private",
        url: `https://github.com/${r.fullName}`
      }) as Repository)
    ),
  get: (id: string) =>
    api.get<any>(`/api/v1/dashboard/repository/${id}`).then(d => ({
      id: d.repository?.id ?? id,
      name: d.repository?.name ?? id,
      fullName: d.repository?.fullName ?? id,
      description: d.repository?.description ?? null,
      language: d.repository?.language ?? null,
      stars: d.repository?.stars ?? 0,
      forks: d.repository?.forks ?? 0,
      openPRs: 0,
      openIssues: d.repository?.openIssues ?? 0,
      healthScore: d.health?.overallScore ?? 100,
      lastSyncedAt: d.repository?.syncedAt ?? null,
      private: d.repository?.visibility === "private",
      url: `https://github.com/${d.repository?.fullName ?? id}`
    }) as Repository),
  pullRequests: (id: string) =>
    api.get<any>(`/api/v1/dashboard/repository/${id}`).then(d =>
      (d.pullRequests ?? []).map((pr: any) => ({
        id: pr.id,
        number: pr.githubPRNumber,
        title: pr.title,
        repository: d.repository?.name ?? id,
        author: { username: pr.author?.username ?? "developer", avatarUrl: pr.author?.avatarUrl ?? null },
        status: pr.state?.toLowerCase() === "merged" ? "merged" as const : pr.state?.toLowerCase() === "closed" ? "closed" as const : pr.state?.toLowerCase() === "draft" ? "draft" as const : "open" as const,
        createdAt: pr.createdAtGitHub,
        updatedAt: pr.createdAtGitHub,
        url: pr.url ?? ""
      })) as PullRequest[]
    ),
  commits: (id: string) =>
    api.get<any>(`/api/v1/dashboard/repository/${id}`).then(d =>
      (d.commits ?? []).map((c: any) => ({
        sha: c.commitSHA,
        message: c.message,
        author: { username: c.author?.username ?? "developer", avatarUrl: c.author?.avatarUrl ?? null },
        repository: d.repository?.name ?? id,
        committedAt: c.commitDate,
        url: c.url ?? ""
      })) as Commit[]
    ),
  workflows: (id: string) =>
    api.get<any>(`/api/v1/dashboard/repository/${id}`).then(d =>
      (d.workflows ?? []).map((w: any) => ({
        id: w.id,
        name: w.workflow?.name ?? "Workflow",
        repository: d.repository?.name ?? id,
        status: w.status?.toLowerCase() === "success" ? "success" as const : w.status?.toLowerCase() === "failure" ? "failure" as const : w.status?.toLowerCase() === "cancelled" ? "cancelled" as const : w.status?.toLowerCase() === "in_progress" ? "in_progress" as const : "queued" as const,
        startedAt: w.startedAt,
        durationSeconds: w.duration ?? null,
        url: ""
      })) as WorkflowRun[]
    ),
  contributors: (id: string) =>
    api.get<any[]>(`/api/v1/repositories/${id}/contributors`).then(cs =>
      cs.map(c => ({
        username: c.login ?? "contributor",
        name: c.name ?? null,
        avatarUrl: null,
        commits: c.totalCommits ?? 0,
        prs: 0,
        reviews: 0
      })) as Contributor[]
    ),
  languages: (id: string) =>
    api.get<any[]>("/api/v1/repositories").then(repos => {
      const repo = repos.find(r => r.id === id || r.fullName === id);
      if (!repo?.languages) return [] as LanguageStat[];
      const langs = typeof repo.languages === "string" ? JSON.parse(repo.languages) : repo.languages;
      const total = Object.values(langs as Record<string, number>).reduce((s, v) => s + v, 0) || 1;
      return Object.entries(langs as Record<string, number>).map(([name, bytes]) => ({
        name,
        percentage: Math.round((bytes / total) * 100)
      })) as LanguageStat[];
    }),
  aiSummary: (id: string) =>
    api.get<any>(`/api/v1/ai/repository-summary/${id}`).then(res => ({
      summary: res?.content ?? res?.summary ?? "No summary available.",
      risks: [],
      recommendations: []
    }) as RepositoryAISummary),
  issues: (id: string) =>
    api.get<any>(`/api/v1/dashboard/repository/${id}`).then(d =>
      (d.overview?.risks ?? []).map((risk: any) => ({
        id: risk.id,
        number: 0,
        title: risk.title,
        repository: d.repository?.name ?? id,
        state: risk.status === "open" ? "open" as const : "closed" as const,
        author: { username: "system", avatarUrl: null },
        createdAt: risk.detectedAt,
        url: ""
      })) as Issue[]
    ),
};

export const aiService = {
  conversations: () => Promise.resolve([] as AIConversation[]),
  conversation: (id: string) =>
    Promise.resolve({ id, messages: [] as AIMessage[] }),
  sendMessage: (conversationId: string | null, content: string) =>
    api.post<any>("/api/v1/ai/chat", { question: content, conversationId }).then(res => ({
      conversationId: conversationId ?? res.conversationId ?? "default",
      message: {
        id: res.id ?? crypto.randomUUID(),
        role: "assistant" as const,
        content: res.answer ?? res.content ?? "",
        createdAt: new Date().toISOString()
      } as AIMessage
    })),
  recommendations: () =>
    api.get<any[]>("/api/v1/ai/recommendations").then(items =>
      items.map((r: any) => ({
        id: r.id ?? crypto.randomUUID(),
        title: r.title ?? "Recommendation",
        summary: r.description ?? r.content ?? "",
        severity: r.priority === "high" ? "critical" as const : r.priority === "medium" ? "warning" as const : "info" as const,
        createdAt: r.createdAt ?? new Date().toISOString()
      })) as AIRecommendation[]
    ),
  insights: () =>
    api.get<any>("/api/v1/ai/weekly-summary").then(res => {
      const text = typeof res === "string" ? res : res?.content ?? res?.summary ?? "";
      return [{
        id: "weekly",
        title: "Weekly AI Insight",
        body: text,
        category: "summary",
        createdAt: new Date().toISOString()
      }] as AIInsight[];
    }),
  weeklySummary: () =>
    api.get<any>("/api/v1/ai/weekly-summary").then(res => ({
      summary: typeof res === "string" ? res : res?.content ?? res?.summary ?? "",
      highlights: res?.highlights ?? [],
      generatedAt: res?.generatedAt ?? new Date().toISOString()
    }) as WeeklySummary),
};

export const notificationsService = {
  list: () =>
    api.get<any[]>("/api/v1/notifications").then(items =>
      items.map(n => ({
        id: n.id,
        title: n.title,
        body: n.message,
        read: n.isRead,
        priority: n.priority,
        type: n.notificationType?.toLowerCase() === "warning" ? "warning" as const : n.notificationType?.toLowerCase() === "success" ? "success" as const : n.notificationType?.toLowerCase() === "error" ? "error" as const : "info" as const,
        createdAt: n.createdAt
      })) as Notification[]
    ),
  unreadCount: () =>
    api.get<any[]>("/api/v1/notifications").then(items => ({
      count: items.filter(n => !n.isRead).length
    })),
  markRead: (id: string) => api.put<void>(`/api/v1/notifications/read/${id}`),
  markAllRead: () => api.put<void>("/api/v1/notifications/read-all"),
  remove: (id: string) => api.delete<void>(`/api/v1/notifications/${id}`),
};

export const reportsService = {
  list: () =>
    api.get<any[]>("/api/v1/reports/history").then(jobs =>
      jobs.map(j => ({
        id: j.id,
        name: `${j.reportType} report`,
        status: j.status === "completed" ? "ready" as const : j.status === "failed" ? "failed" as const : "generating" as const,
        createdAt: j.requestedAt,
        downloadUrl: j.fileLocation ?? undefined
      })) as Report[]
    ),
  get: (id: string) =>
    api.get<any[]>("/api/v1/reports/history").then(jobs => {
      const j = jobs.find(x => x.id === id);
      if (!j) throw new Error("Report not found");
      return {
        id: j.id,
        name: `${j.reportType} report`,
        status: j.status === "completed" ? "ready" as const : j.status === "failed" ? "failed" as const : "generating" as const,
        createdAt: j.requestedAt,
        downloadUrl: j.fileLocation ?? undefined
      } as Report;
    }),
  generate: (payload: { name: string; range: string }) =>
    api.post<any>("/api/v1/reports/pdf", {
      reportType: "developer",
      dateRange: { from: payload.range, to: new Date().toISOString() }
    }).then(j => ({
      id: j.id,
      name: `${j.reportType} report`,
      status: j.status === "completed" ? "ready" as const : j.status === "failed" ? "failed" as const : "generating" as const,
      createdAt: j.requestedAt,
      downloadUrl: j.fileLocation ?? undefined
    }) as Report),
};

export const profileService = {
  contributions: (_username: string) =>
    api.get<any>("/api/v1/profile").then(p =>
      (p.heatmap ?? []).map((h: any) => ({
        date: h.date,
        count: h.count,
        level: h.level as 0 | 1 | 2 | 3 | 4
      })) as ContributionDay[]
    ),
  languages: (_username: string) =>
    api.get<any[]>("/api/v1/repositories").then(repos => {
      const all: Record<string, number> = {};
      repos.forEach(r => {
        if (!r.languages) return;
        const langs = typeof r.languages === "string" ? JSON.parse(r.languages) : r.languages;
        Object.entries(langs as Record<string, number>).forEach(([lang, bytes]) => {
          all[lang] = (all[lang] ?? 0) + (bytes as number);
        });
      });
      const total = Object.values(all).reduce((s, v) => s + v, 0) || 1;
      return Object.entries(all).map(([name, bytes]) => ({
        name,
        percentage: Math.round((bytes / total) * 100)
      })) as LanguageStat[];
    }),
  achievements: (_username: string) =>
    api.get<any[]>("/api/v1/profile/achievements").then(items =>
      items.map(a => ({
        id: a.id,
        title: a.title,
        icon: a.icon,
        earnedAt: a.earnedAt
      })) as Achievement[]
    ),
  topRepos: (_username: string) =>
    api.get<any>("/api/v1/profile").then(p =>
      (p.repositories ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        fullName: r.fullName,
        description: r.description,
        language: r.language,
        stars: r.stars,
        forks: r.forks,
        openPRs: 0,
        openIssues: r.openIssues,
        healthScore: 100,
        lastSyncedAt: r.syncedAt,
        private: r.visibility === "private",
        url: `https://github.com/${r.fullName}`
      })) as Repository[]
    ),
  activity: (_username: string) =>
    api.get<any[]>("/api/v1/profile/activity").then(items => ({
      items: items.map((c: any) => ({
        id: c.id,
        type: "commit" as const,
        actor: { username: "me", avatarUrl: null },
        repository: c.repository?.name ?? "repo",
        title: c.message ?? "",
        createdAt: c.commitDate
      })),
      total: items.length,
      page: 1,
      pageSize: items.length
    }) as Paginated<ActivityItem>),
  stats: (_username: string) =>
    api.get<any>("/api/v1/profile").then(p => ({
      commits: p.analytics?.totalCommits ?? 0,
      pullRequests: p.analytics?.prsOpened ?? 0,
      reviews: p.analytics?.reviewsCompleted ?? 0,
      productivityScore: p.analytics?.productivityScore ?? null
    }) as ProfileStats),
};

export const analyticsService = {
  overview: (_f: AnalyticsFilters) =>
    api.get<any>("/api/v1/analytics/commits").then(s => ({
      commits: s.totalCommits ?? 0,
      pullRequests: 0,
      reviewLatencyHours: 0,
      workflowSuccessRate: 0
    }) as AnalyticsOverview),
  timeseries: (f: AnalyticsFilters) =>
    api.get<any[]>("/api/v1/analytics/commits/trend", { query: { ...f } }).then(items =>
      items.map((p: any) => ({
        date: p.date,
        commits: p.commits ?? 0,
        pullRequests: 0,
        reviews: 0
      })) as AnalyticsTimeseriesPoint[]
    ),
  contributors: (_f: AnalyticsFilters) =>
    api.get<any[]>("/api/v1/analytics/commits/churn").then(rows =>
      rows.map((r: any) => ({
        username: r.repository ?? "contributor",
        commits: 0,
        prs: 0,
        reviews: 0
      })) as AnalyticsContributor[]
    ),
  repositories: (_f: AnalyticsFilters) =>
    api.get<any[]>("/api/v1/repositories").then(repos =>
      repos.map(r => ({
        repositoryId: r.id,
        name: r.name,
        commits: 0,
        prsMerged: 0,
        healthScore: 100
      })) as AnalyticsRepositoryRow[]
    ),
};

export const settingsService = {
  get: () => api.get<UserSettings>("/api/v1/settings"),
  update: (patch: Partial<UserSettings>) =>
    api.put<UserSettings>("/api/v1/settings", patch),
};

export const searchService = {
  global: (q: string) =>
    api.get<any>("/api/v1/search", { query: { q } }).then(res => ({
      repositories: (res.repositories ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        fullName: r.fullName,
        description: r.description,
        language: r.language,
        stars: r.stars,
        forks: r.forks,
        openPRs: 0,
        openIssues: r.openIssues,
        healthScore: 100,
        lastSyncedAt: r.syncedAt,
        private: r.visibility === "private",
        url: `https://github.com/${r.fullName}`
      })),
      users: (res.developers ?? []).map((u: any) => ({
        id: u.id,
        username: u.username,
        name: u.displayName,
        email: u.email,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
        role: u.role?.name ?? null,
        createdAt: u.createdAt
      })),
      commits: (res.commits ?? []).map((c: any) => ({
        sha: c.commitSHA,
        message: c.message,
        author: { username: c.author?.username ?? "developer", avatarUrl: c.author?.avatarUrl ?? null },
        repository: c.repository?.name ?? "repo",
        committedAt: c.commitDate,
        url: c.url ?? ""
      })),
      pullRequests: (res.pullRequests ?? []).map((pr: any) => ({
        id: pr.id,
        number: pr.githubPRNumber,
        title: pr.title,
        repository: pr.repository?.name ?? "repo",
        author: { username: pr.author?.username ?? "developer", avatarUrl: pr.author?.avatarUrl ?? null },
        status: pr.state?.toLowerCase() === "merged" ? "merged" as const : pr.state?.toLowerCase() === "closed" ? "closed" as const : pr.state?.toLowerCase() === "draft" ? "draft" as const : "open" as const,
        createdAt: pr.createdAtGitHub,
        updatedAt: pr.createdAtGitHub,
        url: pr.url ?? ""
      })),
      workflows: (res.workflows ?? []).map((w: any) => ({
        id: w.id,
        name: w.workflow?.name ?? "Workflow",
        repository: w.workflow?.repository?.name ?? "repo",
        status: w.status?.toLowerCase() === "success" ? "success" as const : w.status?.toLowerCase() === "failure" ? "failure" as const : w.status?.toLowerCase() === "cancelled" ? "cancelled" as const : w.status?.toLowerCase() === "in_progress" ? "in_progress" as const : "queued" as const,
        startedAt: w.startedAt,
        durationSeconds: w.duration ?? null,
        url: ""
      }))
    }) as SearchResults),
};
