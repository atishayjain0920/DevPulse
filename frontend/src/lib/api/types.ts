/**
 * Shared TypeScript models describing the DevPulse backend contract.
 * Backend endpoints are expected to return these shapes; if a field is
 * missing, the UI falls back to skeleton/empty states.
 */

export interface CurrentUser {
  id: string;
  githubId?: number;
  username: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role?: string | null;
  createdAt?: string;
}

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openPRs: number;
  openIssues: number;
  healthScore: number; // 0..100
  lastSyncedAt: string | null;
  private: boolean;
  url: string;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  repository: string;
  author: { username: string; avatarUrl: string | null };
  status: "open" | "merged" | "closed" | "draft";
  reviewState?: "approved" | "changes_requested" | "review_required" | "commented";
  createdAt: string;
  updatedAt: string;
  url: string;
}

export interface Commit {
  sha: string;
  message: string;
  author: { username: string; avatarUrl: string | null };
  repository: string;
  committedAt: string;
  url: string;
}

export interface WorkflowRun {
  id: string;
  name: string;
  repository: string;
  status: "queued" | "in_progress" | "success" | "failure" | "cancelled";
  startedAt: string;
  durationSeconds: number | null;
  url: string;
}

export interface Contributor {
  username: string;
  name: string | null;
  avatarUrl: string | null;
  commits: number;
  prs: number;
  reviews: number;
}

export interface ActivityItem {
  id: string;
  type: "pr_opened" | "pr_merged" | "commit" | "workflow" | "review" | "issue";
  actor: { username: string; avatarUrl: string | null };
  repository: string;
  title: string;
  url?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  prsMerged: number;
  prsMergedDelta: number;
  commits: number;
  commitsDelta: number;
  activeContributors: number;
  activeContributorsDelta: number;
  healthScore: number;
  healthScoreDelta: number;
  cycleTimeHours: number;
  cycleTimeDelta: number;
}

export interface DashboardTrendPoint {
  date: string;
  commits: number;
  prs: number;
  reviews: number;
}

export interface SyncStatus {
  lastSyncedAt: string | null;
  inProgress: boolean;
  progress: number; // 0..100
  message?: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  summary: string;
  severity: "info" | "warning" | "critical";
  createdAt: string;
  repository?: string;
}

export interface AIInsight {
  id: string;
  title: string;
  body: string;
  category: string;
  createdAt: string;
}

export interface AIConversation {
  id: string;
  title: string;
  updatedAt: string;
  preview: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  createdAt: string;
  href?: string;
}

export interface Report {
  id: string;
  name: string;
  status: "ready" | "generating" | "failed";
  createdAt: string;
  downloadUrl?: string;
}

export interface LanguageStat {
  name: string;
  percentage: number;
}

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  earnedAt: string;
}

export interface UserSettings {
  appearance: { theme: "dark" | "light" | "system"; density: "comfortable" | "compact" };
  notifications: {
    weeklyDigest: boolean;
    prIdleAlerts: boolean;
    workflowFailures: boolean;
  };
  ai: {
    model: string;
    contextDays: number;
    tone: "concise" | "detailed" | "friendly";
  };
  sync: {
    frequency: "realtime" | "hourly" | "daily";
  };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Issue {
  id: string;
  number: number;
  title: string;
  repository: string;
  state: "open" | "closed";
  author: { username: string; avatarUrl: string | null };
  createdAt: string;
  url: string;
}

export interface RepositoryAISummary {
  summary: string;
  risks: string[];
  recommendations: string[];
}

export interface ProfileStats {
  commits: number;
  pullRequests: number;
  reviews: number;
  productivityScore: number | null;
}

export interface WeeklySummary {
  summary: string;
  highlights: string[];
  generatedAt: string;
}

export interface SearchResults {
  repositories: Repository[];
  pullRequests: PullRequest[];
  users: CurrentUser[];
  /** Requires backend implementation: GET /api/search must include these. */
  issues?: Issue[];
  /** Requires backend implementation: GET /api/search must include these. */
  workflows?: WorkflowRun[];
}

/* ---------- Analytics ----------
 * REQUIRES BACKEND IMPLEMENTATION (if not already present):
 *   GET /api/analytics/overview
 *   GET /api/analytics/timeseries
 *   GET /api/analytics/contributors
 *   GET /api/analytics/repositories
 * Shared query params: range, repositoryId, developer, organization.
 */
export interface AnalyticsFilters {
  range?: string;
  repositoryId?: string;
  developer?: string;
  organization?: string;
}

export interface AnalyticsOverview {
  commits: number;
  pullRequests: number;
  reviewLatencyHours: number;
  workflowSuccessRate: number;
}

export interface AnalyticsTimeseriesPoint {
  date: string;
  commits: number;
  pullRequests: number;
  reviews: number;
}

export interface AnalyticsContributor {
  username: string;
  commits: number;
  prs: number;
  reviews: number;
}

export interface AnalyticsRepositoryRow {
  repositoryId: string;
  name: string;
  commits: number;
  prsMerged: number;
  healthScore: number;
}
