import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/devpulse/Landing";

export const Route = createFileRoute("/homepage")({
  head: () => ({
    meta: [
      { title: "DevPulse homepage — GitHub engineering analytics & AI" },
      {
        name: "description",
        content:
          "How DevPulse works: GitHub sync, developer analytics, AI insights, reports, and a live engineering health dashboard.",
      },
      { property: "og:title", content: "DevPulse homepage" },
      {
        property: "og:description",
        content:
          "GitHub sync, developer analytics, AI insights, and engineering health in one workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});
