import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "../app/api";
import { Card, EmptyState, LoadingState } from "../components/ui";

type Results = Record<string, Array<Record<string, string | number | null>>>;

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const { data, isLoading } = useQuery({ queryKey: ["search", q], queryFn: () => api<Results>(`/search?q=${encodeURIComponent(q)}`), enabled: q.length > 0 });
  if (!q) return <EmptyState title="Start from the global search field." />;
  if (isLoading || !data) return <LoadingState label="Searching" />;

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>Search</h1>
          <p>Results for {q}</p>
        </div>
      </div>
      <div className="grid two">
        {Object.entries(data).map(([category, items]) => (
          <Card key={category} title={category}>
            {items.length === 0 ? <EmptyState title="No results in this category." /> : (
              <div className="list">
                {items.map((item, index) => (
                  <div className="list-row" key={index}>
                    <strong>{String(item.name ?? item.title ?? item.message ?? item.displayName ?? item.id)}</strong>
                    <span>{String(item.fullName ?? item.state ?? item.username ?? item.branch ?? "")}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
