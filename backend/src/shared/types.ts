export type RoleName = "Developer" | "Team Lead" | "Administrator";

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  role: RoleName;
  organizationId: string;
};

export type DateRange = {
  from?: string;
  to?: string;
};

export type RepositoryRisk = {
  id: string;
  repositoryId: string;
  riskType: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  title: string;
  description: string;
  recommendation: string;
  status: "open" | "resolved";
  detectedAt: string;
};
