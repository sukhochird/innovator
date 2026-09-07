"use client";

import { Moon, Sun } from "lucide-react";

import { useThemeStore } from "@/lib/theme-store";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const padClass = size === "sm" ? "p-1.5" : "p-2";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "rounded-lg border border-[var(--dash-border)] text-[var(--dash-muted)] hover:bg-[var(--dash-hover)] hover:text-[var(--dash-text)]",
        padClass,
        className,
      )}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className={iconClass} /> : <Moon className={iconClass} />}
    </button>
  );
}
