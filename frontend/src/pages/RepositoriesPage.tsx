import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { GitBranch, RefreshCw } from "lucide-react";
import { api } from "../app/api";
import { Badge, Button, Card, LoadingState } from "../components/ui";

type Repository = {
  id: string;
  name: string;
  fullName: string;
  description: string;
  language: string;
  openIssues: number;
  syncedAt: string;
  health: { overallScore: number; riskLevel: string };
  risks: number;
};

export function RepositoriesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["repositories"], queryFn: () => api<Repository[]>("/repositories") });
  if (isLoading || !data) return <LoadingState label="Loading repositories" />;

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>Repositories</h1>
          <p>Read-only GitHub repository intelligence and health tracking.</p>
        </div>
        <Button>
          <RefreshCw size={16} /> Sync All
        </Button>
      </div>
      <div className="repo-grid">
        {data.map((repo) => (
          <Link to={`/repositories/${repo.id}`} className="repo-card" key={repo.id}>
            <div>
              <GitBranch size={20} />
              <strong>{repo.name}</strong>
            </div>
            <p>{repo.description}</p>
            <div className="meta">
              <Badge tone="info">{repo.language}</Badge>
              <Badge tone={repo.health.overallScore >= 75 ? "success" : "warning"}>{repo.health.riskLevel}</Badge>
              {repo.risks > 0 && <Badge tone="danger">{repo.risks} risks</Badge>}
            </div>
          </Link>
        ))}
      </div>
      <Card title="Repository Data Rules">
        <p>DevPulse reads metadata, commits, pull requests, workflow runs, contributors, and releases. It does not push commits, merge pull requests, edit workflows, delete repositories, or access repository secrets.</p>
      </Card>
    </div>
  );
}
