import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/devpulse/AppShell";
import { RequireAuth } from "@/components/devpulse/RequireAuth";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Workspace — DevPulse" },
      { name: "description", content: "Your DevPulse engineering workspace." },
      { property: "og:title", content: "Workspace — DevPulse" },
      {
        property: "og:description",
        content: "Repository analytics, PR insights and AI recommendations.",
      },
    ],
  }),
  // No `beforeLoad` redirect: the session check runs client-side inside
  // <RequireAuth> so we never redirect before it settles, and a network
  // failure renders a connection error instead of a fake logout.
  component: ProtectedWorkspace,
});

function ProtectedWorkspace() {
  return (
    <RequireAuth>
      <AppShell />
    </RequireAuth>
  );
}
