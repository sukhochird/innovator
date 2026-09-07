"use client";

import { useThemeStore } from "@/lib/theme-store";

export function useChartTheme() {
  const theme = useThemeStore((s) => s.theme);
  return {
    grid: theme === "dark" ? "#1e2530" : "#e4e4e7",
    tooltipBg: theme === "dark" ? "#18181b" : "#ffffff",
    tooltipBorder: theme === "dark" ? "#27272a" : "#e4e4e7",
    tick: theme === "dark" ? "#71717a" : "#71717a",
  };
}
