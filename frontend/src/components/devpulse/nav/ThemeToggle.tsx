import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { settingsService } from "@/lib/api/services";

/**
 * Theme is a UI preference, not application data: it is applied locally for an
 * instant response and persisted to the backend user settings when possible.
 */
export function ThemeToggle() {
  const qc = useQueryClient();
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const persist = useMutation({
    mutationFn: (theme: "dark" | "light") =>
      settingsService.update({
        appearance: { theme, density: "comfortable" },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.settings.all });
    },
  });

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    persist.mutate(next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
