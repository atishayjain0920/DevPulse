import { useQuery } from "@tanstack/react-query";
import { Award } from "lucide-react";
import { api } from "../app/api";
import { Heatmap } from "../components/charts";
import { Badge, Card, LoadingState, StatCard } from "../components/ui";

type Profile = {
  profile: { displayName: string; username: string; bio: string; company: string; location: string; avatarUrl: string };
  analytics: Record<string, string | number>;
  achievements: Array<{ id: string; title: string; description: string }>;
  heatmap: Array<{ date: string; count: number; level: number }>;
  activity: Array<{ id: string; message: string; commitDate: string }>;
  aiSummary: { sections: { overallProductivity: string } };
};

export function ProfilePage() {
  const { data, isLoading } = useQuery({ queryKey: ["profile"], queryFn: () => api<Profile>("/profile") });
  if (isLoading || !data) return <LoadingState label="Loading developer profile" />;

  return (
    <div className="page">
      <div className="profile-header">
        <img src={data.profile.avatarUrl} alt="" />
        <div>
          <h1>{data.profile.displayName}</h1>
          <p>@{data.profile.username} · {data.profile.company} · {data.profile.location}</p>
          <span>{data.profile.bio}</span>
        </div>
      </div>
      <div className="stats-grid">
        <StatCard label="Productivity" value={data.analytics.productivityScore} tone="success" />
        <StatCard label="Commits" value={data.analytics.totalCommits} />
        <StatCard label="PRs Opened" value={data.analytics.prsOpened} tone="warning" />
        <StatCard label="Reviews" value={data.analytics.reviewsCompleted} />
      </div>
      <div className="grid two">
        <Card title="Contribution Heatmap">
          <Heatmap data={data.heatmap} />
        </Card>
        <Card title="Achievements">
          <div className="list">
            {data.achievements.map((achievement) => (
              <div className="list-row" key={achievement.id}>
                <strong><Award size={16} /> {achievement.title}</strong>
                <span>{achievement.description}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Recent Activity">
          {data.activity.map((item) => (
            <p key={item.id}><Badge tone="info">commit</Badge> {item.message}</p>
          ))}
        </Card>
        <Card title="AI Feedback">
          <p className="lead">{data.aiSummary.sections.overallProductivity}</p>
        </Card>
      </div>
    </div>
  );
}
