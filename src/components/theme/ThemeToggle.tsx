"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import clsx from "clsx";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[var(--z-fg)]">Theme</span>
        <div className="flex items-center gap-1 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] p-1">
          <button
            onClick={() => {
              if (theme !== "light") toggleTheme();
            }}
            className={clsx(
              "px-3 py-1.5 rounded-md text-sm font-semibold transition-colors",
              theme === "light"
                ? "bg-[var(--z-accent)] text-[var(--z-on-accent)]"
                : "text-[var(--z-fg-secondary)] hover:text-[var(--z-fg)]"
            )}
          >
            ☀️ Light
          </button>
          <button
            onClick={() => {
              if (theme !== "dark") toggleTheme();
            }}
            className={clsx(
              "px-3 py-1.5 rounded-md text-sm font-semibold transition-colors",
              theme === "dark"
                ? "bg-[var(--z-accent)] text-[var(--z-on-accent)]"
                : "text-[var(--z-fg-secondary)] hover:text-[var(--z-fg)]"
            )}
          >
            🌙 Dark
          </button>
        </div>
      </div>
    </div>
  );
}
