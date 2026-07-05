import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { api } from "../app/api";
import { Badge, Button, Card, LoadingState } from "../components/ui";

type Session = { id: string; deviceName: string; browser: string; operatingSystem: string; ipAddress: string; lastActivity: string; isRevoked: boolean };
type Device = { id: string; deviceName: string; trusted: boolean; lastUsed: string };
type Audit = { id: string; action: string; entity: string; createdAt: string };

export function SecurityPage() {
  const sessions = useQuery({ queryKey: ["sessions"], queryFn: () => api<Session[]>("/security/sessions") });
  const devices = useQuery({ queryKey: ["devices"], queryFn: () => api<Device[]>("/security/devices") });
  const audit = useQuery({ queryKey: ["audit"], queryFn: () => api<Audit[]>("/security/audit") });
  if (sessions.isLoading || devices.isLoading || audit.isLoading) return <LoadingState label="Loading security center" />;

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>Security Center</h1>
          <p>Sessions, trusted devices, MFA, OAuth permissions, login history, and audit logs.</p>
        </div>
        <Button>
          <ShieldCheck size={16} /> Enable MFA
        </Button>
      </div>
      <div className="grid two">
        <Card title="Active Sessions">
          <div className="list">
            {sessions.data?.map((session) => (
              <div className="list-row" key={session.id}>
                <strong>{session.deviceName}</strong>
                <span>{session.browser} · {session.operatingSystem} · {session.ipAddress}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Trusted Devices">
          <div className="list">
            {devices.data?.map((device) => (
              <div className="list-row" key={device.id}>
                <strong>{device.deviceName}</strong>
                <span>Last used {new Date(device.lastUsed).toLocaleString()}</span>
                <Badge tone={device.trusted ? "success" : "warning"}>{device.trusted ? "trusted" : "untrusted"}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Connected GitHub Account">
          <p>OAuth scopes: read:user, user:email, read:org, repo:status</p>
          <p>Token status: encrypted at rest, read-only access.</p>
          <Button variant="danger">Revoke GitHub Access</Button>
        </Card>
        <Card title="Audit Logs">
          <div className="list">
            {audit.data?.map((item) => (
              <div className="list-row" key={item.id}>
                <strong>{item.action}</strong>
                <span>{item.entity} · {new Date(item.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
