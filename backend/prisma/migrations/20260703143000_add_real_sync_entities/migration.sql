CREATE TABLE "Issue" (
  "id" TEXT NOT NULL,
  "repositoryId" TEXT NOT NULL,
  "githubIssueNumber" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "state" TEXT NOT NULL,
  "authorLogin" TEXT,
  "labels" TEXT[],
  "comments" INTEGER NOT NULL DEFAULT 0,
  "createdAtGitHub" TIMESTAMP(3) NOT NULL,
  "updatedAtGitHub" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "url" TEXT,
  CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Repository" ADD COLUMN "languages" JSONB;
ALTER TABLE "Repository" ADD COLUMN "topics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Contributor" ADD COLUMN "githubUserId" TEXT;
ALTER TABLE "Contributor" ADD COLUMN "login" TEXT;
CREATE UNIQUE INDEX "Contributor_repositoryId_githubUserId_key" ON "Contributor"("repositoryId", "githubUserId");

CREATE TABLE "Release" (
  "id" TEXT NOT NULL,
  "repositoryId" TEXT NOT NULL,
  "githubReleaseId" TEXT NOT NULL,
  "tagName" TEXT NOT NULL,
  "name" TEXT,
  "body" TEXT,
  "draft" BOOLEAN NOT NULL DEFAULT false,
  "prerelease" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "createdAtGitHub" TIMESTAMP(3),
  "url" TEXT,
  CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RefreshToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "familyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "rotatedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "replacedByHash" TEXT,
  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SyncJob" (
  "id" TEXT NOT NULL,
  "repositoryId" TEXT,
  "jobType" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "payload" JSONB,
  CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Issue_repositoryId_githubIssueNumber_key" ON "Issue"("repositoryId", "githubIssueNumber");
CREATE INDEX "Issue_repositoryId_state_idx" ON "Issue"("repositoryId", "state");
CREATE INDEX "Issue_createdAtGitHub_idx" ON "Issue"("createdAtGitHub");

CREATE UNIQUE INDEX "Release_repositoryId_githubReleaseId_key" ON "Release"("repositoryId", "githubReleaseId");
CREATE INDEX "Release_repositoryId_publishedAt_idx" ON "Release"("repositoryId", "publishedAt");

CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_userId_revokedAt_idx" ON "RefreshToken"("userId", "revokedAt");
CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");

CREATE INDEX "SyncJob_repositoryId_status_idx" ON "SyncJob"("repositoryId", "status");
CREATE INDEX "SyncJob_jobType_status_idx" ON "SyncJob"("jobType", "status");

ALTER TABLE "Issue" ADD CONSTRAINT "Issue_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Release" ADD CONSTRAINT "Release_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SyncJob" ADD CONSTRAINT "SyncJob_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;
