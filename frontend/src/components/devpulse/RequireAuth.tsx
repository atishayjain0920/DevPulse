import { useEffect, useRef } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { type ReactNode } from "react";
import { API_BASE_URL, API_UNREACHABLE_MESSAGE } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui-kit/Spinner";

/**
 * Session gate for every private route.
 *
 * States, in order:
 *  1. checking  → full-screen loading state (never redirect here)
 *  2. connection error → "Unable to connect to DevPulse API." + Retry
 *  3. unauthenticated → redirect to /login?redirect=<current url>
 *  4. authenticated → render children
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, isConnectionError, error, refetch, isFetching } =
    useAuth();
  const router = useRouter();
  const href = useRouterState({ select: (s) => s.location.href });
  // Freeze the protected URL so the redirect target can't accumulate as the
  // router transitions to /login.
  const targetRef = useRef(href);
  const redirectedRef = useRef(false);

  const shouldRedirect = !isLoading && !isConnectionError && !isAuthenticated;

  useEffect(() => {
    if (shouldRedirect && !redirectedRef.current) {
      redirectedRef.current = true;
      void router.navigate({
        to: "/login",
        search: { redirect: targetRef.current },
        replace: true,
      });
    }
  }, [shouldRedirect, router]);

  if (isLoading) return <AuthChecking />;

  if (isConnectionError) {
    return (
      <ConnectionError onRetry={() => refetch()} isRetrying={isFetching} />
    );
  }

  if (!isAuthenticated) {
    // Unexpected non-auth error (e.g. 500) — surface it rather than redirecting.
    if (error && !isConnectionError) {
      return (
        <ConnectionError
          onRetry={() => refetch()}
          isRetrying={isFetching}
          message={error.message}
        />
      );
    }
    return <AuthChecking label="Redirecting to sign in…" />;
  }

  return <>{children}</>;
}

function AuthChecking({ label = "Checking your session…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <Spinner className="text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-2 w-full max-w-md space-y-2">
        <div className="h-2 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-2 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-2 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

function ConnectionError({
  onRetry,
  isRetrying,
  message = API_UNREACHABLE_MESSAGE,
}: {
  onRetry: () => void;
  isRetrying: boolean;
  message?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <span className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <h1 className="text-lg font-semibold tracking-tight">{message}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The DevPulse API at{" "}
          <code className="font-mono text-foreground">
            {API_BASE_URL || "(VITE_API_BASE_URL not set)"}
          </code>{" "}
          didn't respond. You have not been signed out — check that the backend is
          running and that it allows this origin with credentials.
        </p>
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isRetrying ? (
            <Spinner className="text-primary-foreground" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Retry
        </button>
      </div>
    </div>
  );
}
