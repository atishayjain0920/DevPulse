/**
 * Centralized query keys for React Query.
 * Use these instead of inline arrays so invalidations stay consistent.
 */
export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  dashboard: {
    metrics: (range = "7d") => ["dashboard", "metrics", range] as const,
    trends: (range = "30d") => ["dashboard", "trends", range] as const,
    activity: ["dashboard", "activity"] as const,
    contributors: ["dashboard", "contributors"] as const,
    recentPRs: ["dashboard", "recent-prs"] as const,
    recentCommits: ["dashboard", "recent-commits"] as const,
    workflows: ["dashboard", "workflows"] as const,
    sync: ["dashboard", "sync"] as const,
  },
  repositories: {
    all: (filter?: string) => ["repositories", { filter }] as const,
    detail: (id: string) => ["repositories", id] as const,
    prs: (id: string) => ["repositories", id, "prs"] as const,
    commits: (id: string) => ["repositories", id, "commits"] as const,
    workflows: (id: string) => ["repositories", id, "workflows"] as const,
    contributors: (id: string) => ["repositories", id, "contributors"] as const,
    languages: (id: string) => ["repositories", id, "languages"] as const,
    aiSummary: (id: string) => ["repositories", id, "ai-summary"] as const,
    issues: (id: string) => ["repositories", id, "issues"] as const,
  },
  ai: {
    conversations: ["ai", "conversations"] as const,
    conversation: (id: string) => ["ai", "conversations", id] as const,
    recommendations: ["ai", "recommendations"] as const,
    insights: ["ai", "insights"] as const,
    weeklySummary: ["ai", "weekly-summary"] as const,
  },
  reports: {
    all: ["reports"] as const,
    detail: (id: string) => ["reports", id] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    unreadCount: ["notifications", "unread"] as const,
  },
  profile: {
    contributions: (username: string) => ["profile", username, "contributions"] as const,
    languages: (username: string) => ["profile", username, "languages"] as const,
    achievements: (username: string) => ["profile", username, "achievements"] as const,
    topRepos: (username: string) => ["profile", username, "top-repos"] as const,
    activity: (username: string) => ["profile", username, "activity"] as const,
    stats: (username: string) => ["profile", username, "stats"] as const,
  },
  analytics: {
    overview: (f: Record<string, unknown>) => ["analytics", "overview", f] as const,
    timeseries: (f: Record<string, unknown>) => ["analytics", "timeseries", f] as const,
    contributors: (f: Record<string, unknown>) => ["analytics", "contributors", f] as const,
    repositories: (f: Record<string, unknown>) => ["analytics", "repositories", f] as const,
  },
  settings: {
    all: ["settings"] as const,
  },
} as const;
