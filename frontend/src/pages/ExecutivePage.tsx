import { useQuery } from "@tanstack/react-query";
import { api } from "../app/api";
import { Card, LoadingState, StatCard } from "../components/ui";

type Executive = {
  kpis: Record<string, string | number>;
  teamProductivity: Array<{ userId: string; name: string; role: string; productivityScore: number }>;
  highRiskRepositories: Array<{ id: string; title: string; severity: string; recommendation: string }>;
  aiExecutiveSummary: string;
};

export function ExecutivePage() {
  const { data, isLoading } = useQuery({ queryKey: ["executive"], queryFn: () => api<Executive>("/dashboard/executive") });
  if (isLoading || !data) return <LoadingState label="Loading executive dashboard" />;

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>Executive Dashboard</h1>
          <p>Engineering KPIs for team leads and administrators.</p>
        </div>
      </div>
      <div className="stats-grid">
        <StatCard label="Lead Time" value={data.kpis.leadTime} />
        <StatCard label="Review Time" value={data.kpis.reviewTime} tone="warning" />
        <StatCard label="Build Success" value={data.kpis.buildSuccessRate} tone="success" />
        <StatCard label="AI Risks" value={data.kpis.aiRiskCount} tone="danger" />
      </div>
      <div className="grid two">
        <Card title="AI Executive Summary">
          <p className="lead">{data.aiExecutiveSummary}</p>
        </Card>
        <Card title="Team Productivity">
          <div className="list">
            {data.teamProductivity.map((member) => (
              <div key={member.userId} className="list-row">
                <strong>{member.name}</strong>
                <span>{member.role} · {member.productivityScore}/100</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="High-Risk Repositories">
          <div className="list">
            {data.highRiskRepositories.map((risk) => (
              <div key={risk.id} className="list-row">
                <strong>{risk.title}</strong>
                <span>{risk.severity} · {risk.recommendation}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
