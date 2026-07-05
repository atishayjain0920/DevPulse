import { Prisma, PullRequestState } from "@prisma/client";
import { decryptSecret } from "../../shared/crypto.js";
import { prisma } from "../../shared/prisma.js";

type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  description?: string | null;
  private: boolean;
  visibility?: string;
  default_branch: string;
  language?: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  size: number;
  created_at?: string;
  pushed_at?: string | null;
  archived: boolean;
  disabled: boolean;
  owner: { login: string };
  topics?: string[];
};

function date(value?: string | null): Date | null {
  return value ? new Date(value) : null;
}

function prState(pr: { state: string; draft?: boolean; merged_at?: string | null }): PullRequestState {
  if (pr.draft) return "DRAFT";
  if (pr.merged_at) return "MERGED";
  return pr.state === "open" ? "OPEN" : "CLOSED";
}

export class GitHubSyncService {
  async syncUser(userId: string) {
    const account = await prisma.gitHubAccount.findFirst({ where: { userId }, orderBy: { connectedAt: "desc" } });
    if (!account) return { synced: 0, repositories: [] };
    const token = decryptSecret(account.accessTokenEncrypted);
    const repositories = await this.github<GitHubRepository[]>("/user/repos?per_page=100&sort=pushed", token);
    const synced = [];
    for (const repository of repositories) {
      synced.push(await this.syncRepositoryFromGitHub(repository, token, userId));
    }
    await prisma.gitHubAccount.update({ where: { id: account.id }, data: { lastSync: new Date() } });
    return { synced: synced.length, repositories: synced };
  }

  async syncRepository(repositoryId: string) {
    const repository = await prisma.repository.findFirst({ where: { OR: [{ id: repositoryId }, { githubRepositoryId: repositoryId }, { fullName: repositoryId }] } });
    if (!repository) return null;
    const account = await prisma.gitHubAccount.findFirst({ where: { userId: repository.ownerId ?? undefined }, orderBy: { connectedAt: "desc" } })
      ?? await prisma.gitHubAccount.findFirst({ orderBy: { connectedAt: "desc" } });
    if (!account) return null;
    const token = decryptSecret(account.accessTokenEncrypted);
    const ghRepository = await this.github<GitHubRepository>(`/repos/${repository.fullName}`, token);
    return this.syncRepositoryFromGitHub(ghRepository, token, account.userId);
  }

  private async syncRepositoryFromGitHub(repository: GitHubRepository, token: string, userId: string) {
    const saved = await prisma.repository.upsert({
      where: { githubRepositoryId: String(repository.id) },
      create: {
        githubRepositoryId: String(repository.id),
        ownerId: userId,
        name: repository.name,
        fullName: repository.full_name,
        description: repository.description,
        visibility: repository.visibility ?? (repository.private ? "private" : "public"),
        defaultBranch: repository.default_branch,
        language: repository.language,
        languages: await this.repositoryLanguages(repository.full_name, token) as Prisma.InputJsonValue,
        topics: repository.topics ?? await this.repositoryTopics(repository.full_name, token),
        stars: repository.stargazers_count,
        forks: repository.forks_count,
        watchers: repository.watchers_count,
        openIssues: repository.open_issues_count,
        size: repository.size,
        createdAtGitHub: date(repository.created_at),
        lastPush: date(repository.pushed_at),
        archived: repository.archived,
        disabled: repository.disabled,
        syncedAt: new Date()
      },
      update: {
        name: repository.name,
        fullName: repository.full_name,
        description: repository.description,
        visibility: repository.visibility ?? (repository.private ? "private" : "public"),
        defaultBranch: repository.default_branch,
        language: repository.language,
        languages: await this.repositoryLanguages(repository.full_name, token) as Prisma.InputJsonValue,
        topics: repository.topics ?? await this.repositoryTopics(repository.full_name, token),
        stars: repository.stargazers_count,
        forks: repository.forks_count,
        watchers: repository.watchers_count,
        openIssues: repository.open_issues_count,
        size: repository.size,
        lastPush: date(repository.pushed_at),
        archived: repository.archived,
        disabled: repository.disabled,
        syncedAt: new Date()
      }
    });
    await Promise.all([
      this.syncBranches(saved.id, repository.full_name, token),
      this.syncCommits(saved.id, repository.full_name, token, userId),
      this.syncContributors(saved.id, repository.full_name, token),
      this.syncPullRequests(saved.id, repository.full_name, token, userId),
      this.syncIssues(saved.id, repository.full_name, token),
      this.syncReleases(saved.id, repository.full_name, token),
      this.syncWorkflows(saved.id, repository.full_name, token)
    ]);
    return saved;
  }

  private async syncBranches(repositoryId: string, fullName: string, token: string) {
    const branches = await this.github<Array<{ name: string; commit?: { sha?: string } }>>(`/repos/${fullName}/branches?per_page=100`, token).catch(() => []);
    await Promise.all(branches.map((branch) => prisma.branch.upsert({
      where: { repositoryId_githubBranchName: { repositoryId, githubBranchName: branch.name } },
      create: { repositoryId, githubBranchName: branch.name, isDefault: false, latestCommitSHA: branch.commit?.sha },
      update: { latestCommitSHA: branch.commit?.sha }
    })));
  }

  private async syncCommits(repositoryId: string, fullName: string, token: string, userId: string) {
    const commits = await this.github<Array<{ sha: string; html_url?: string; commit: { message: string; author?: { date?: string } }; stats?: { additions: number; deletions: number; total: number }; files?: unknown[] }>>(`/repos/${fullName}/commits?per_page=30`, token).catch(() => []);
    await Promise.all(commits.map((commit) => prisma.commit.upsert({
      where: { commitSHA: commit.sha },
      create: {
        repositoryId,
        authorId: userId,
        commitSHA: commit.sha,
        message: commit.commit.message,
        additions: commit.stats?.additions ?? 0,
        deletions: commit.stats?.deletions ?? 0,
        totalChanges: commit.stats?.total ?? 0,
        filesChanged: commit.files?.length ?? 0,
        commitDate: date(commit.commit.author?.date) ?? new Date(),
        url: commit.html_url
      },
      update: {
        message: commit.commit.message,
        additions: commit.stats?.additions ?? 0,
        deletions: commit.stats?.deletions ?? 0,
        totalChanges: commit.stats?.total ?? 0,
        filesChanged: commit.files?.length ?? 0,
        url: commit.html_url
      }
    })));
  }

  private async syncPullRequests(repositoryId: string, fullName: string, token: string, userId: string) {
    const prs = await this.github<Array<{ number: number; title: string; body?: string | null; state: string; draft?: boolean; created_at: string; merged_at?: string | null; closed_at?: string | null; comments?: number; additions?: number; deletions?: number; changed_files?: number; html_url?: string }>>(`/repos/${fullName}/pulls?state=all&per_page=50`, token).catch(() => []);
    for (const pr of prs) {
      const saved = await prisma.pullRequest.upsert({
        where: { repositoryId_githubPRNumber: { repositoryId, githubPRNumber: pr.number } },
        create: {
          repositoryId,
          authorId: userId,
          githubPRNumber: pr.number,
          title: pr.title,
          description: pr.body,
          state: prState(pr),
          createdAtGitHub: new Date(pr.created_at),
          mergedAt: date(pr.merged_at),
          closedAt: date(pr.closed_at),
          comments: pr.comments ?? 0,
          additions: pr.additions ?? 0,
          deletions: pr.deletions ?? 0,
          changedFiles: pr.changed_files ?? 0,
          url: pr.html_url
        },
        update: {
          title: pr.title,
          description: pr.body,
          state: prState(pr),
          mergedAt: date(pr.merged_at),
          closedAt: date(pr.closed_at),
          comments: pr.comments ?? 0,
          additions: pr.additions ?? 0,
          deletions: pr.deletions ?? 0,
          changedFiles: pr.changed_files ?? 0,
          url: pr.html_url
        }
      });
      await this.syncReviews(saved.id, fullName, pr.number, token);
    }
  }

  private async syncReviews(pullRequestId: string, fullName: string, prNumber: number, token: string) {
    const reviews = await this.github<Array<{ id: number; state: string; submitted_at?: string | null; user?: { id?: number; login?: string }; body?: string | null }>>(`/repos/${fullName}/pulls/${prNumber}/reviews?per_page=100`, token).catch(() => []);
    await Promise.all(reviews.filter((review) => review.submitted_at).map((review) => prisma.pullRequestReview.upsert({
      where: { id: String(review.id) },
      create: {
        id: String(review.id),
        pullRequestId,
        reviewState: review.state,
        submittedAt: new Date(review.submitted_at!),
        comments: review.body ? 1 : 0
      },
      update: {
        reviewState: review.state,
        submittedAt: new Date(review.submitted_at!),
        comments: review.body ? 1 : 0
      }
    })));
  }

  private async syncContributors(repositoryId: string, fullName: string, token: string) {
    const contributors = await this.github<Array<{ contributions: number; id?: number; login?: string }>>(`/repos/${fullName}/contributors?per_page=100`, token).catch(() => []);
    await Promise.all(contributors.filter((contributor) => contributor.id).map((contributor) => prisma.contributor.upsert({
      where: { repositoryId_githubUserId: { repositoryId, githubUserId: String(contributor.id) } },
      create: { repositoryId, githubUserId: String(contributor.id), login: contributor.login, totalCommits: contributor.contributions },
      update: { login: contributor.login, totalCommits: contributor.contributions }
    })));
  }

  private async syncIssues(repositoryId: string, fullName: string, token: string) {
    const issues = await this.github<Array<{ number: number; title: string; body?: string | null; state: string; user?: { login?: string }; labels?: Array<{ name?: string }>; comments?: number; created_at: string; updated_at?: string; closed_at?: string | null; html_url?: string; pull_request?: unknown }>>(`/repos/${fullName}/issues?state=all&per_page=50`, token).catch(() => []);
    await Promise.all(issues.filter((issue) => !issue.pull_request).map((issue) => prisma.issue.upsert({
      where: { repositoryId_githubIssueNumber: { repositoryId, githubIssueNumber: issue.number } },
      create: {
        repositoryId,
        githubIssueNumber: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        authorLogin: issue.user?.login,
        labels: issue.labels?.map((label) => label.name).filter((value): value is string => Boolean(value)) ?? [],
        comments: issue.comments ?? 0,
        createdAtGitHub: new Date(issue.created_at),
        updatedAtGitHub: date(issue.updated_at),
        closedAt: date(issue.closed_at),
        url: issue.html_url
      },
      update: { title: issue.title, body: issue.body, state: issue.state, labels: issue.labels?.map((label) => label.name).filter((value): value is string => Boolean(value)) ?? [], comments: issue.comments ?? 0, updatedAtGitHub: date(issue.updated_at), closedAt: date(issue.closed_at), url: issue.html_url }
    })));
  }

  private async syncReleases(repositoryId: string, fullName: string, token: string) {
    const releases = await this.github<Array<{ id: number; tag_name: string; name?: string | null; body?: string | null; draft: boolean; prerelease: boolean; published_at?: string | null; created_at?: string | null; html_url?: string }>>(`/repos/${fullName}/releases?per_page=50`, token).catch(() => []);
    await Promise.all(releases.map((release) => prisma.release.upsert({
      where: { repositoryId_githubReleaseId: { repositoryId, githubReleaseId: String(release.id) } },
      create: { repositoryId, githubReleaseId: String(release.id), tagName: release.tag_name, name: release.name, body: release.body, draft: release.draft, prerelease: release.prerelease, publishedAt: date(release.published_at), createdAtGitHub: date(release.created_at), url: release.html_url },
      update: { tagName: release.tag_name, name: release.name, body: release.body, draft: release.draft, prerelease: release.prerelease, publishedAt: date(release.published_at), url: release.html_url }
    })));
  }

  private async syncWorkflows(repositoryId: string, fullName: string, token: string) {
    const workflows = await this.github<{ workflows: Array<{ id: number; name: string; path: string; state: string }> }>(`/repos/${fullName}/actions/workflows?per_page=100`, token).catch(() => ({ workflows: [] }));
    for (const workflow of workflows.workflows) {
      const saved = await prisma.workflow.upsert({
        where: { repositoryId_githubWorkflowId: { repositoryId, githubWorkflowId: String(workflow.id) } },
        create: { repositoryId, githubWorkflowId: String(workflow.id), name: workflow.name, path: workflow.path, state: workflow.state },
        update: { name: workflow.name, path: workflow.path, state: workflow.state }
      });
      const runs = await this.github<{ workflow_runs: Array<{ id: number; status: string; conclusion?: string | null; run_started_at?: string; created_at: string; updated_at?: string; head_branch?: string; head_sha?: string }> }>(`/repos/${fullName}/actions/workflows/${workflow.id}/runs?per_page=20`, token).catch(() => ({ workflow_runs: [] }));
      await Promise.all(runs.workflow_runs.map((run) => prisma.workflowRun.upsert({
        where: { id: String(run.id) },
        create: { id: String(run.id), workflowId: saved.id, status: run.status, conclusion: run.conclusion, startedAt: date(run.run_started_at) ?? new Date(run.created_at), completedAt: date(run.updated_at), branch: run.head_branch, commitSHA: run.head_sha },
        update: { status: run.status, conclusion: run.conclusion, completedAt: date(run.updated_at), branch: run.head_branch, commitSHA: run.head_sha }
      })));
    }
  }

  private async github<T>(path: string, token: string): Promise<T> {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: { accept: "application/vnd.github+json", authorization: `Bearer ${token}`, "x-github-api-version": "2022-11-28" }
    });
    if (!response.ok) throw new Error(`GitHub API request failed: ${path} (${response.status})`);
    return response.json() as Promise<T>;
  }

  private async repositoryTopics(fullName: string, token: string): Promise<string[]> {
    const response = await this.github<{ names: string[] }>(`/repos/${fullName}/topics`, token).catch(() => ({ names: [] }));
    return response.names;
  }

  private async repositoryLanguages(fullName: string, token: string): Promise<Record<string, number>> {
    return this.github<Record<string, number>>(`/repos/${fullName}/languages`, token).catch(() => ({}));
  }
}

export const githubSyncService = new GitHubSyncService();
