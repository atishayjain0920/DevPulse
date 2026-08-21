import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft, Check, Github } from "lucide-react";
import { z } from "zod";
import { Logo } from "@/components/devpulse/Logo";
import { Spinner } from "@/components/ui-kit/Spinner";
import { startGithubLogin, useAuth } from "@/hooks/useAuth";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
  error: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — DevPulse" },
      {
        name: "description",
        content:
          "Sign in to DevPulse with GitHub to unlock engineering intelligence for your repositories.",
      },
      { property: "og:title", content: "Sign in — DevPulse" },
      {
        property: "og:description",
        content: "Continue with GitHub to access your DevPulse workspace.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect, error } = Route.useSearch();
  const { isAuthenticated, isLoading, isConnectionError, refetch } = useAuth();
  const router = useRouter();

  // Already signed in (e.g. returning from the Express GitHub callback):
  // send the user on to where they were headed.
  useEffect(() => {
    if (isAuthenticated) {
      void router.navigate({ to: redirect ?? "/app/dashboard", replace: true });
    }
  }, [isAuthenticated, redirect, router]);

  const handleGithub = () => startGithubLogin(redirect ?? "/app/dashboard");

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left: form */}
      <div className="relative flex flex-col justify-between p-8 lg:p-12">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to site
          </Link>
        </div>

        <div className="mx-auto w-full max-w-sm py-16">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your DevPulse workspace to continue.
          </p>

          {error ? (
            <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {decodeURIComponent(error)}
            </div>
          ) : null}

          {isConnectionError ? (
            <div className="mt-6 space-y-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <p>Unable to connect to DevPulse API.</p>
              <button
                onClick={() => refetch()}
                className="rounded border border-destructive/40 px-2 py-1 hover:bg-destructive/10"
              >
                Retry
              </button>
            </div>
          ) : null}

          {isAuthenticated ? (
            <div className="mt-6 rounded-md border border-success/30 bg-success/10 p-3 text-xs text-success">
              You're already signed in.{" "}
              <Link to="/app/dashboard" className="underline underline-offset-2">
                Go to workspace →
              </Link>
            </div>
          ) : null}

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={handleGithub}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isLoading ? (
                <Spinner className="text-background" />
              ) : (
                <Github className="h-4 w-4" />
              )}
              Continue with GitHub
            </button>

            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Work email
                </label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
              >
                Send magic link
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <a href="#" className="underline underline-offset-2 hover:text-foreground">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-2 hover:text-foreground">
              Privacy Policy
            </a>
            .
          </p>
        </div>

        <div className="text-xs text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/login" className="text-foreground underline underline-offset-2">
            Start free
          </Link>
        </div>
      </div>

      {/* Right: brand panel */}
      <div className="relative hidden overflow-hidden border-l border-border bg-surface lg:block">
        <div className="pointer-events-none absolute inset-0 bg-dot opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              DevPulse · Engineering Intelligence
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              Ship faster with signal, not noise.
            </h2>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Connect GitHub once. Get repo analytics, PR insights, workflow
              monitoring, and an AI copilot — no configuration required.
            </p>
          </div>

          <ul className="space-y-3 text-sm">
            {[
              "Read-only GitHub scope",
              "SOC-2 aligned infrastructure",
              "Cancel or disconnect anytime",
            ].map((f) => (
              <li key={f} className="flex items-center gap-3 text-foreground/90">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-3 w-3" />
                </span>
                {f}
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-border bg-background p-5">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Snapshot
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[
                ["2.4d", "Cycle"],
                ["94", "Health"],
                ["142", "PRs / wk"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-md border border-border bg-surface p-3">
                  <div className="font-mono text-lg font-semibold">{v}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
