import { useMutation, useQuery } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { api } from "../app/api";
import { Button, Card, LoadingState } from "../components/ui";
import { useTheme } from "../app/useTheme";

type Settings = {
  theme: string;
  synchronization: { frequencyMinutes: number; webhooksEnabled: boolean };
  notifications: Record<string, boolean>;
  aiPreferences: { includeSourceCode: boolean };
  dashboard: { layout: Record<string, unknown>; pinnedRepositories: string[]; selectedWidgets: string[] };
  profilePreferences: { showEmail: boolean; showLocation: boolean; showCompany: boolean; publicProfile: boolean };
};

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: () => api<Settings>("/settings") });
  const save = useMutation({ mutationFn: (body: Partial<Settings>) => api("/settings", { method: "PUT", body: JSON.stringify(body) }) });
  if (isLoading || !data) return <LoadingState label="Loading settings" />;

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>Settings</h1>
          <p>Profile, appearance, dashboard, notifications, AI preferences, security, and synchronization.</p>
        </div>
      </div>
      <div className="tabs">
        {["Profile", "Appearance", "Dashboard", "Notifications", "AI Preferences", "Security", "Synchronization"].map((tab) => <span key={tab}>{tab}</span>)}
      </div>
      <div className="grid two">
        <Card title="Appearance">
          <div className="segmented">
            {["light", "dark", "system"].map((item) => (
              <button className={theme === item ? "active" : ""} key={item} onClick={() => setTheme(item as "light" | "dark" | "system")}>{item}</button>
            ))}
          </div>
        </Card>
        <Card title="Synchronization">
          <p>Default sync interval: {data.synchronization.frequencyMinutes} minutes</p>
          <p>Webhooks: {data.synchronization.webhooksEnabled ? "enabled" : "disabled"}</p>
          <Button onClick={() => save.mutate({ synchronization: { frequencyMinutes: 15, webhooksEnabled: true } })}>
            <Save size={16} /> Save
          </Button>
        </Card>
        <Card title="AI Preferences">
          <label className="check"><input type="checkbox" checked={data.aiPreferences.includeSourceCode} readOnly /> Include source code in future code-analysis feature</label>
          <p>Current AI prompts use structured analytics only.</p>
        </Card>
        <Card title="Profile Preferences">
          {Object.entries(data.profilePreferences).map(([key, value]) => (
            <label className="check" key={key}><input type="checkbox" checked={value} readOnly /> {key}</label>
          ))}
        </Card>
        <Card title="Notifications">
          {Object.entries(data.notifications).map(([key, value]) => (
            <label className="check" key={key}><input type="checkbox" checked={value} readOnly /> {key}</label>
          ))}
        </Card>
      </div>
    </div>
  );
}
