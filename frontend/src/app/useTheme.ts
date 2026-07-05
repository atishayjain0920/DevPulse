import { create } from "zustand";

type Theme = "light" | "dark" | "system";

type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialTheme = (localStorage.getItem("devpulse-theme") as Theme | null) ?? "system";

export const useTheme = create<ThemeState>((set) => ({
  theme: initialTheme,
  setTheme: (theme) => {
    localStorage.setItem("devpulse-theme", theme);
    set({ theme });
  }
}));

export function applyTheme(theme: Theme): void {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
}
