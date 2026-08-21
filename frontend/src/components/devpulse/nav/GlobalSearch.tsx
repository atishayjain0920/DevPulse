import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CircleDot,
  FileText,
  FolderGit2,
  GitPullRequest,
  PlayCircle,
  Search,
  User,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { searchService } from "@/lib/api/services";
import { Spinner } from "@/components/ui-kit/Spinner";

/**
 * Global command-palette style search (⌘K). Debounced query against
 * `searchService.global`. Renders results in three sections; empty & error
 * states are handled inline.
 */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  const query = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => searchService.global(debounced),
    enabled: open && debounced.length >= 2,
    staleTime: 30_000,
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative hidden items-center gap-2 rounded-md border border-input bg-surface py-1.5 pl-2.5 pr-16 text-sm text-muted-foreground transition-colors hover:text-foreground md:flex md:w-72"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search repos, PRs, developers…</span>
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
            >
              <div className="flex items-center gap-2 border-b border-border px-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search everything…"
                  className="flex-1 bg-transparent py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none"
                />
                {query.isFetching ? <Spinner /> : null}
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {debounced.length < 2 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Type at least 2 characters to search.
                  </div>
                ) : query.isError ? (
                  <div className="space-y-2 p-6 text-center text-xs text-destructive">
                    <p>Search failed. Check your connection.</p>
                    <button
                      onClick={() => query.refetch()}
                      className="rounded-md border border-border px-2 py-1 text-muted-foreground hover:text-foreground"
                    >
                      Retry
                    </button>
                  </div>
                ) : query.isPending ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Searching…
                  </div>
                ) : query.data ? (
                  <SearchResults data={query.data} onSelect={() => setOpen(false)} />
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function SearchResults({
  data,
  onSelect,
}: {
  data: Awaited<ReturnType<typeof searchService.global>>;
  onSelect: () => void;
}) {
  const empty =
    !data.repositories?.length &&
    !data.pullRequests?.length &&
    !data.users?.length &&
    !data.issues?.length &&
    !data.workflows?.length;
  if (empty)
    return (
      <div className="p-6 text-center text-xs text-muted-foreground">
        No matches.
      </div>
    );

  return (
    <div className="space-y-3">
      <Section label="Repositories">
        {data.repositories?.map((r) => (
          <ResultRow
            key={r.id}
            icon={<FolderGit2 className="h-3.5 w-3.5" />}
            title={r.fullName}
            meta={r.language ?? ""}
            onClick={onSelect}
          />
        ))}
      </Section>
      <Section label="Pull requests">
        {data.pullRequests?.map((p) => (
          <ResultRow
            key={p.id}
            icon={<GitPullRequest className="h-3.5 w-3.5" />}
            title={p.title}
            meta={`${p.repository} · #${p.number}`}
            onClick={onSelect}
          />
        ))}
      </Section>
      <Section label="Issues">
        {data.issues?.map((i) => (
          <ResultRow
            key={i.id}
            icon={<CircleDot className="h-3.5 w-3.5" />}
            title={i.title}
            meta={`${i.repository} · #${i.number}`}
            onClick={onSelect}
          />
        ))}
      </Section>
      <Section label="Workflows">
        {data.workflows?.map((w) => (
          <ResultRow
            key={w.id}
            icon={<PlayCircle className="h-3.5 w-3.5" />}
            title={w.name}
            meta={`${w.repository} · ${w.status}`}
            onClick={onSelect}
          />
        ))}
      </Section>
      <Section label="People">
        {data.users?.map((u) => (
          <ResultRow
            key={u.id}
            icon={<User className="h-3.5 w-3.5" />}
            title={u.name ?? u.username}
            meta={"@" + u.username}
            onClick={onSelect}
          />
        ))}
      </Section>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  if (!hasChildren) return null;
  return (
    <div>
      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ResultRow({
  icon,
  title,
  meta,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  meta?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
    >
      <span className="grid h-6 w-6 place-items-center rounded-md border border-border bg-background text-muted-foreground">
        {icon ?? <FileText className="h-3.5 w-3.5" />}
      </span>
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {meta ? (
        <span className="truncate text-xs text-muted-foreground">{meta}</span>
      ) : null}
    </button>
  );
}
