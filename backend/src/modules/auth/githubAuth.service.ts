import crypto from "crypto";
import { env } from "../../config/env.js";
import { encryptSecret, hashIp } from "../../shared/crypto.js";
import { AppError } from "../../shared/errors.js";
import { prisma } from "../../shared/prisma.js";
import type { AuthUser } from "../../shared/types.js";
import { ensureUserSettings } from "../settings/settings.service.js";

type GitHubUser = {
  id: number;
  login: string;
  avatar_url?: string;
  email?: string | null;
  name?: string | null;
  bio?: string | null;
  company?: string | null;
  location?: string | null;
  blog?: string | null;
};

type GitHubEmail = { email: string; primary: boolean; verified: boolean };

function tokenHash(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function toAuthUser(user: { id: string; username: string; displayName: string; organizationId: string | null; role: { name: string } }): AuthUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role.name as AuthUser["role"],
    organizationId: user.organizationId ?? ""
  };
}

export class GitHubAuthService {
  authorizationUrl(state: string) {
    if (!env.GITHUB_CLIENT_ID) throw new AppError(503, "GITHUB_OAUTH_NOT_CONFIGURED", "GitHub OAuth client id is not configured.");
    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: env.GITHUB_CALLBACK_URL,
      scope: "read:user user:email read:org repo:status",
      state
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string) {
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      throw new AppError(503, "GITHUB_OAUTH_NOT_CONFIGURED", "GitHub OAuth credentials are not configured.");
    }
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: env.GITHUB_CALLBACK_URL
      })
    });
    const data = await response.json() as { access_token?: string; refresh_token?: string; scope?: string; expires_in?: number; error_description?: string };
    if (!response.ok || !data.access_token) {
      throw new AppError(401, "GITHUB_OAUTH_FAILED", data.error_description ?? "GitHub OAuth token exchange failed.");
    }
    return data;
  }

  async loginWithGitHubCode(code: string, ip?: string, userAgent?: string) {
    const token = await this.exchangeCode(code);
    const accessToken = token.access_token;
    if (!accessToken) throw new AppError(401, "GITHUB_OAUTH_FAILED", "GitHub OAuth token exchange did not return an access token.");
    const githubUser = await this.fetchGitHub<GitHubUser>("/user", accessToken);
    const emails = await this.fetchGitHub<GitHubEmail[]>("/user/emails", accessToken).catch(() => []);
    const primaryEmail = emails.find((email) => email.primary && email.verified)?.email ?? githubUser.email ?? null;
    const role = await prisma.role.upsert({
      where: { name: "Developer" },
      create: { name: "Developer", description: "Default developer access", permissions: ["read:self", "read:repositories"] },
      update: {}
    });
    const user = await prisma.user.upsert({
      where: { githubId: String(githubUser.id) },
      create: {
        githubId: String(githubUser.id),
        username: githubUser.login,
        displayName: githubUser.name ?? githubUser.login,
        email: primaryEmail,
        avatarUrl: githubUser.avatar_url,
        bio: githubUser.bio,
        company: githubUser.company,
        location: githubUser.location,
        website: githubUser.blog,
        roleId: role.id,
        isEmailVerified: Boolean(primaryEmail),
        lastLogin: new Date()
      },
      update: {
        username: githubUser.login,
        displayName: githubUser.name ?? githubUser.login,
        email: primaryEmail,
        avatarUrl: githubUser.avatar_url,
        bio: githubUser.bio,
        company: githubUser.company,
        location: githubUser.location,
        website: githubUser.blog,
        isEmailVerified: Boolean(primaryEmail),
        lastLogin: new Date()
      },
      include: { role: true }
    });
    await ensureUserSettings(user.id);
    await prisma.gitHubAccount.upsert({
      where: { id: (await prisma.gitHubAccount.findFirst({ where: { userId: user.id, githubUserId: String(githubUser.id) } }))?.id ?? "" },
      create: {
        userId: user.id,
        githubUserId: String(githubUser.id),
        accessTokenEncrypted: encryptSecret(accessToken),
        refreshTokenEncrypted: token.refresh_token ? encryptSecret(token.refresh_token) : null,
        tokenExpiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
        scopes: token.scope?.split(",").filter(Boolean) ?? []
      },
      update: {
        accessTokenEncrypted: encryptSecret(accessToken),
        refreshTokenEncrypted: token.refresh_token ? encryptSecret(token.refresh_token) : undefined,
        tokenExpiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
        scopes: token.scope?.split(",").filter(Boolean) ?? [],
        lastSync: null
      }
    });
    await prisma.userSession.create({
      data: {
        userId: user.id,
        ipAddressHash: ip ? hashIp(ip) : null,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 864e5)
      }
    });
    await prisma.syncJob.create({ data: { jobType: "repository_sync", status: "queued", payload: { userId: user.id } } });
    return toAuthUser(user);
  }

  async storeRefreshToken(userId: string, refreshToken: string, familyId: string) {
    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: tokenHash(refreshToken),
        familyId,
        expiresAt: new Date(Date.now() + 7 * 864e5)
      }
    });
  }

  async rotateRefreshToken(oldToken: string, newToken: string, userId: string) {
    const oldHash = tokenHash(oldToken);
    const nextHash = tokenHash(newToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: oldHash } });
    if (!stored || stored.revokedAt || stored.userId !== userId || stored.expiresAt < new Date()) {
      throw new AppError(401, "REFRESH_TOKEN_INVALID", "Refresh token is invalid or expired.");
    }
    await prisma.$transaction([
      prisma.refreshToken.update({ where: { tokenHash: oldHash }, data: { rotatedAt: new Date(), replacedByHash: nextHash } }),
      prisma.refreshToken.create({ data: { userId, tokenHash: nextHash, familyId: stored.familyId, expiresAt: new Date(Date.now() + 7 * 864e5) } })
    ]);
  }

  private async fetchGitHub<T>(path: string, accessToken: string): Promise<T> {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: { accept: "application/vnd.github+json", authorization: `Bearer ${accessToken}`, "x-github-api-version": "2022-11-28" }
    });
    if (!response.ok) throw new AppError(response.status, "GITHUB_API_FAILED", `GitHub API request failed for ${path}.`);
    return response.json() as Promise<T>;
  }
}

export const githubAuthService = new GitHubAuthService();
