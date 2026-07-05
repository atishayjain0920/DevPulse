import type { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma.js";

const defaultNotifications: Record<string, boolean> = {
  email: true,
  inApp: true,
  pullRequests: true,
  builds: true,
  security: true,
  weeklySummary: true
};

const defaultAiPreferences = {
  includeSourceCode: false
};

const defaultDashboard = {
  layout: {},
  pinnedRepositories: [] as string[],
  selectedWidgets: [] as string[]
};

const defaultProfilePreferences = {
  showEmail: false,
  showLocation: true,
  showCompany: true,
  publicProfile: false
};

type SettingsResponse = {
  theme: string;
  synchronization: {
    frequencyMinutes: number;
    webhooksEnabled: boolean;
  };
  notifications: Record<string, boolean>;
  aiPreferences: typeof defaultAiPreferences & Record<string, unknown>;
  dashboard: typeof defaultDashboard & Record<string, unknown>;
  profilePreferences: typeof defaultProfilePreferences & Record<string, unknown>;
};

function jsonObject(value: Record<string, unknown>): Prisma.InputJsonObject {
  return value as Prisma.InputJsonObject;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function booleanRecord(value: unknown, defaults: Record<string, boolean>): Record<string, boolean> {
  const source = isRecord(value) ? value : {};
  return Object.fromEntries(
    Object.entries({ ...defaults, ...source }).map(([key, enabled]) => [key, Boolean(enabled)])
  );
}

function objectWithDefaults<T extends Record<string, unknown>>(value: unknown, defaults: T): T & Record<string, unknown> {
  return { ...defaults, ...(isRecord(value) ? value : {}) };
}

function positiveInteger(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : fallback;
}

async function defaultSyncFrequencyMinutes(): Promise<number> {
  const setting = await prisma.systemSettings.findUnique({ where: { key: "defaultSyncIntervalMinutes" } });
  return positiveInteger(setting?.value, 15);
}

function serialize(settings: {
  theme: string;
  syncFrequencyMinutes: number;
  webhooksEnabled: boolean;
  notifications: Prisma.JsonValue;
  aiPreferences: Prisma.JsonValue;
  dashboard: Prisma.JsonValue;
  profilePreferences: Prisma.JsonValue;
}): SettingsResponse {
  return {
    theme: settings.theme || "system",
    synchronization: {
      frequencyMinutes: positiveInteger(settings.syncFrequencyMinutes, 15),
      webhooksEnabled: Boolean(settings.webhooksEnabled)
    },
    notifications: booleanRecord(settings.notifications, defaultNotifications),
    aiPreferences: objectWithDefaults(settings.aiPreferences, defaultAiPreferences),
    dashboard: objectWithDefaults(settings.dashboard, defaultDashboard),
    profilePreferences: objectWithDefaults(settings.profilePreferences, defaultProfilePreferences)
  };
}

export async function ensureUserSettings(userId: string): Promise<SettingsResponse> {
  const syncFrequencyMinutes = await defaultSyncFrequencyMinutes();
  const settings = await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      syncFrequencyMinutes,
      notifications: jsonObject(defaultNotifications),
      aiPreferences: jsonObject(defaultAiPreferences),
      dashboard: jsonObject(defaultDashboard),
      profilePreferences: jsonObject(defaultProfilePreferences)
    },
    update: {}
  });
  return serialize(settings);
}

export async function updateUserSettings(userId: string, body: Record<string, unknown>): Promise<SettingsResponse> {
  const existing = await ensureUserSettings(userId);
  const synchronization = isRecord(body.synchronization) ? body.synchronization : {};
  const dashboard = isRecord(body.dashboard) ? jsonObject(objectWithDefaults(body.dashboard, existing.dashboard)) : undefined;
  const notifications = isRecord(body.notifications) ? jsonObject(booleanRecord(body.notifications, existing.notifications)) : undefined;
  const aiPreferences = isRecord(body.aiPreferences) ? jsonObject(objectWithDefaults(body.aiPreferences, existing.aiPreferences)) : undefined;
  const profilePreferences = isRecord(body.profilePreferences) ? jsonObject(objectWithDefaults(body.profilePreferences, existing.profilePreferences)) : undefined;

  const settings = await prisma.userSettings.update({
    where: { userId },
    data: {
      theme: typeof body.theme === "string" ? body.theme : undefined,
      syncFrequencyMinutes: synchronization.frequencyMinutes === undefined
        ? undefined
        : positiveInteger(synchronization.frequencyMinutes, existing.synchronization.frequencyMinutes),
      webhooksEnabled: synchronization.webhooksEnabled === undefined ? undefined : Boolean(synchronization.webhooksEnabled),
      notifications,
      aiPreferences,
      dashboard,
      profilePreferences
    }
  });
  return serialize(settings);
}
