import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck } from "lucide-react";
import { api } from "../app/api";
import { Badge, Button, Card, LoadingState } from "../components/ui";

type Notification = { id: string; title: string; message: string; priority: "low" | "medium" | "high"; notificationType: string; isRead: boolean; createdAt: string };

export function NotificationsPage() {
  const client = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: () => api<Notification[]>("/notifications") });
  const markAll = useMutation({ mutationFn: () => api("/notifications/read-all", { method: "PUT" }), onSuccess: () => client.invalidateQueries({ queryKey: ["notifications"] }) });
  if (isLoading || !data) return <LoadingState label="Loading notifications" />;

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>Notification Center</h1>
          <p>Build alerts, PR delays, repository risks, security events, and weekly summaries.</p>
        </div>
        <Button onClick={() => markAll.mutate()}>
          <CheckCheck size={16} /> Mark all read
        </Button>
      </div>
      <Card title="Notifications">
        <div className="list">
          {data.map((notification) => (
            <div key={notification.id} className="list-row">
              <strong>{notification.title}</strong>
              <span>{notification.message}</span>
              <div className="meta">
                <Badge tone={notification.priority === "high" ? "danger" : notification.priority === "medium" ? "warning" : "info"}>{notification.priority}</Badge>
                <Badge>{notification.notificationType}</Badge>
                {!notification.isRead && <Badge tone="success">unread</Badge>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
