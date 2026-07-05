import { useQuery } from "@tanstack/react-query";
import { RefreshCw, WandSparkles } from "lucide-react";
import { api } from "../app/api";
import { ChurnChart, DonutChart, Heatmap, TrendChart } from "../components/charts";
import { Badge, Button, Card, LoadingState, StatCard } from "../components/ui";

type Dashboard = {
  cards: Record<string, number>;
  charts: {
    commitTrend: Array<Record<string, string | number>>;
    heatmap: Array<{ date: string; count: number; level: number }>;
    churn: Array<Record<string, string | number>>;
    languageDistribution: Array<Record<string, string | number>>;
  };
  aiInsight: string;
  dataFreshness: { lastUpdated: string; dataSource: string; refreshStatus: string };
  recentActivity: Array<{ id: string; message: string; commitDate: string; branch: string }>;
  recentRepositories: Array<{ id: string; name: string; fullName: string; language: string }>;
};

export function DashboardPage() {
  const { data, isLoading, refetch } = useQuery({ queryKey: ["dashboard"], queryFn: () => api<Dashboard>("/dashboard/developer") });
  if (isLoading || !data) return <LoadingState label="Loading dashboard analytics" />;

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>Developer Dashboard</h1>
          <p>{data.dataFreshness.dataSource}</p>
        </div>
        <div className="actions">
          <Badge tone="success">{data.dataFreshness.refreshStatus}</Badge>
          <Button variant="secondary" onClick={() => void refetch()}>
            <RefreshCw size={16} /> Refresh
          </Button>
          <Button>
            <WandSparkles size={16} /> Generate AI Summary
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Repositories" value={data.cards.totalRepositories} detail="connected" />
        <StatCard label="Commits" value={data.cards.totalCommits} detail="current window" tone="success" />
        <StatCard label="Open PRs" value={data.cards.openPrs} detail={`${data.cards.pendingReviews} pending reviews`} tone="warning" />
        <StatCard label="Build Success" value={`${data.cards.buildSuccessRate}%`} detail={`${data.cards.failedBuilds} failed`} tone={data.cards.failedBuilds > 0 ? "danger" : "success"} />
        <StatCard label="Repo Health" value={data.cards.repositoryHealth} detail="average score" />
        <StatCard label="Productivity" value={data.cards.productivityScore} detail="weighted score" tone="success" />
      </div>

      <div className="grid two">
        <Card title="Commit Trend">
          <TrendChart data={data.charts.commitTrend} />
        </Card>
        <Card title="Code Churn">
          <ChurnChart data={data.charts.churn} />
        </Card>
        <Card title="Language Distribution">
          <DonutChart data={data.charts.languageDistribution} />
        </Card>
        <Card title="Contribution Heatmap">
          <Heatmap data={data.charts.heatmap} />
        </Card>
      </div>

      <div className="grid two">
        <Card title="AI Insight">
          <p className="lead">{data.aiInsight}</p>
          <small>AI-generated from available analytics. Review before using for decisions.</small>
        </Card>
        <Card title="Recent Activity">
          <div className="list">
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className="list-row">
                <strong>{activity.message}</strong>
                <span>{activity.branch} · {new Date(activity.commitDate).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
