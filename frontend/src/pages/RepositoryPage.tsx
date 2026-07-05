import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "../app/api";
import { Badge, Card, LoadingState, StatCard } from "../components/ui";

type RepositoryDashboard = {
  repository?: { name: string; fullName: string; description: string; language: string };
  overview: { commits: number; pullRequests: number; workflows: number; risks: Array<{ id: string; title: string; severity: string; recommendation: string }> };
  health: { overallScore: number; riskLevel: string; buildScore: number; reviewScore: number; activityScore: number };
  contributors: Array<{ id: string; displayName: string; role: string }>;
  pullRequests: Array<{ id: string; title: string; state: string; reviewTime: number }>;
  workflows: Array<{ id: string; conclusion: string; duration: number }>;
  aiSummary: string;
};

export function RepositoryPage() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ["repository", id], queryFn: () => api<RepositoryDashboard>(`/dashboard/repository/${id}`) });
  if (!id) return <LoadingState label="Opening repository" />;
  if (isLoading || !data) return <LoadingState label="Loading repository dashboard" />;

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>{data.repository?.name}</h1>
          <p>{data.repository?.fullName}</p>
        </div>
        <Badge tone={data.health.overallScore >= 75 ? "success" : "warning"}>{data.health.riskLevel}</Badge>
      </div>
      <div className="stats-grid">
        <StatCard label="Health" value={data.health.overallScore} />
        <StatCard label="Commits" value={data.overview.commits} tone="success" />
        <StatCard label="Pull Requests" value={data.overview.pullRequests} tone="warning" />
        <StatCard label="Workflows" value={data.overview.workflows} />
      </div>
      <div className="tabs">
        {["Overview", "Analytics", "Commits", "Pull Requests", "Contributors", "Workflows", "Deployments", "AI Insights", "Risk Detection"].map((tab) => (
          <span key={tab}>{tab}</span>
        ))}
      </div>
      <div className="grid two">
        <Card title="AI Repository Summary">
          <p className="lead">{data.aiSummary}</p>
        </Card>
        <Card title="Risk Detection">
          <div className="list">
            {data.overview.risks.map((risk) => (
              <div className="list-row" key={risk.id}>
                <strong>{risk.title}</strong>
                <span>{risk.severity} · {risk.recommendation}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Pull Requests">
          <div className="list">
            {data.pullRequests.map((pr) => (
              <div className="list-row" key={pr.id}>
                <strong>{pr.title}</strong>
                <span>{pr.state} · review time {pr.reviewTime}h</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Workflow Runs">
          <div className="list">
            {data.workflows.map((run) => (
              <div className="list-row" key={run.id}>
                <strong>{run.conclusion}</strong>
                <span>{run.duration}s</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
