/**
 * Auth hooks. The backend owns the session via an httpOnly cookie, so the
 * frontend simply asks `/api/auth/me` and treats a 401 as "signed out".
 *
 * A transport failure (backend unreachable / CORS) is NOT a logout: it surfaces
 * as an error so the UI can show a connection error with a retry action.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/queryKeys";
import { authService } from "@/lib/api/services";
import type { CurrentUser } from "@/lib/api/types";

export function isNetworkError(err: unknown) {
  return err instanceof ApiError && err.isNetworkError;
}

export function useCurrentUser() {
  return useQuery<CurrentUser | null>({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      try {
        return await authService.me();
      } catch (err) {
        // Only an explicit 401/403 from the API means "signed out".
        if (err instanceof ApiError && (err.isUnauthorized || err.isForbidden)) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 60_000,
    retry: (failureCount, err) => {
      if (err instanceof ApiError && (err.isUnauthorized || err.isForbidden)) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useAuth() {
  const query = useCurrentUser();
  return {
    user: query.data ?? null,
    isAuthenticated: !!query.data,
    /** True until the very first session check settles. */
    isLoading: query.isPending,
    isFetching: query.isFetching,
    /** Backend unreachable — do not treat as signed out. */
    isConnectionError: isNetworkError(query.error),
    error: query.error,
    refetch: query.refetch,
  };
}

export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: async () => {
      await qc.cancelQueries();
      qc.clear();
      await router.navigate({ to: "/login", replace: true });
    },
  });
}

export function startGithubLogin(redirectTo = "/app/dashboard") {
  if (typeof window !== "undefined") {
    authService.githubLogin(redirectTo)
      .then((res) => {
        if (res.authorizationUrl) {
          window.location.href = res.authorizationUrl;
        }
      })
      .catch((err) => {
        console.error("Failed to start GitHub authentication", err);
      });
  }
}
