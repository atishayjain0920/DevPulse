import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/app` is an alias: the authenticated home lives at `/app/dashboard`. */
export const Route = createFileRoute("/app/")({
  beforeLoad: () => {
    throw redirect({ to: "/app/dashboard", replace: true });
  },
});
