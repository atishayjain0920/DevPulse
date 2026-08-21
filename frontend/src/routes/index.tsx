import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/devpulse/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DevPulse — Engineering intelligence for GitHub teams" },
      {
        name: "description",
        content:
          "Connect GitHub and turn your repositories into a live engineering intelligence dashboard: PR insights, workflow monitoring, and AI recommendations.",
      },
      { property: "og:title", content: "DevPulse — Engineering intelligence" },
      {
        property: "og:description",
        content:
          "AI-powered developer productivity for modern engineering teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});
