CREATE TABLE "UserSettings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "theme" TEXT NOT NULL DEFAULT 'system',
  "syncFrequencyMinutes" INTEGER NOT NULL DEFAULT 15,
  "webhooksEnabled" BOOLEAN NOT NULL DEFAULT true,
  "notifications" JSONB NOT NULL DEFAULT '{"email": true, "inApp": true, "pullRequests": true, "builds": true, "security": true, "weeklySummary": true}'::jsonb,
  "aiPreferences" JSONB NOT NULL DEFAULT '{"includeSourceCode": false}'::jsonb,
  "dashboard" JSONB NOT NULL DEFAULT '{"layout": {}, "pinnedRepositories": [], "selectedWidgets": []}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

INSERT INTO "UserSettings" (
  "id",
  "userId",
  "theme",
  "syncFrequencyMinutes",
  "webhooksEnabled",
  "notifications",
  "aiPreferences",
  "dashboard",
  "createdAt",
  "updatedAt"
)
SELECT
  "User"."id",
  "User"."id",
  COALESCE("DashboardPreference"."theme", 'system'),
  COALESCE(("SystemSettings"."value"#>>'{}')::integer, 15),
  true,
  '{"email": true, "inApp": true, "pullRequests": true, "builds": true, "security": true, "weeklySummary": true}'::jsonb,
  '{"includeSourceCode": false}'::jsonb,
  jsonb_build_object(
    'layout', COALESCE("DashboardPreference"."layout", '{}'::jsonb),
    'pinnedRepositories', COALESCE("DashboardPreference"."pinnedRepositories", '[]'::jsonb),
    'selectedWidgets', COALESCE("DashboardPreference"."selectedWidgets", '[]'::jsonb)
  ),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User"
LEFT JOIN "DashboardPreference" ON "DashboardPreference"."userId" = "User"."id"
LEFT JOIN "SystemSettings" ON "SystemSettings"."key" = 'defaultSyncIntervalMinutes'
ON CONFLICT ("userId") DO NOTHING;

ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
