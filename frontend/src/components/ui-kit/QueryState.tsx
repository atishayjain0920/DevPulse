import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { ErrorState } from "@/components/ui-kit/ErrorState";
import { EmptyState } from "@/components/ui-kit/EmptyState";

/**
 * Renders the four canonical states for a React Query result:
 * loading -> skeleton, error -> retry, empty -> guidance, success -> children.
 * Keeps every data-driven surface from ever rendering a blank card.
 */
export function QueryState<T>({
  query,
  skeleton,
  isEmpty,
  emptyTitle = "No synchronized data yet",
  emptyDescription = "Once DevPulse finishes syncing your GitHub data, it will appear here.",
  emptyAction,
  errorTitle,
  children,
}: {
  query: UseQueryResult<T>;
  skeleton: ReactNode;
  isEmpty?: (data: T) => boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  errorTitle?: string;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) return <>{skeleton}</>;
  if (query.isError)
    return (
      <ErrorState
        error={query.error}
        title={errorTitle}
        onRetry={() => query.refetch()}
      />
    );

  const data = query.data as T;
  const empty =
    isEmpty?.(data) ??
    (Array.isArray(data) ? data.length === 0 : data === null || data === undefined);

  if (empty)
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className="border-0 bg-transparent py-8"
      />
    );

  return <>{children(data)}</>;
}
