import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/repositories")({
  head: () => ({
    meta: [
      { title: "Repositories — DevPulse" },
      {
        name: "description",
        content:
          "Repository overview with health score, activity, contributors, and AI summaries.",
      },
      { property: "og:title", content: "Repositories — DevPulse" },
      {
        property: "og:description",
        content: "Health, activity, and AI summaries across every tracked repository.",
      },
    ],
  }),
  component: () => <Outlet />,
});
