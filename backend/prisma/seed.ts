import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.role.upsert({
    where: { name: "Administrator" },
    update: {},
    create: {
      name: "Administrator",
      description: "Full organization access",
      permissions: ["dashboard:read", "security:read", "settings:write", "roles:write"]
    }
  });

  await prisma.role.upsert({
    where: { name: "Developer" },
    update: {},
    create: {
      name: "Developer",
      description: "Personal analytics access",
      permissions: ["dashboard:read", "profile:read", "reports:create"]
    }
  });

  await prisma.role.upsert({
    where: { name: "Team Lead" },
    update: {},
    create: {
      name: "Team Lead",
      description: "Team and executive analytics access",
      permissions: ["dashboard:read", "team:read", "executive:read", "reports:create"]
    }
  });

  await prisma.systemSettings.upsert({
    where: { key: "defaultSyncIntervalMinutes" },
    update: { value: 15 },
    create: { key: "defaultSyncIntervalMinutes", value: 15 }
  });

  await prisma.systemSettings.upsert({
    where: { key: "featureFlags" },
    update: {},
    create: { key: "featureFlags", value: {} }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
