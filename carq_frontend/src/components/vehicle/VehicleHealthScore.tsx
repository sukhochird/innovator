"use client";

import { memo } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

import type { HealthLevel } from "@/lib/vehicle-utils";
import { cn } from "@/lib/utils";

interface VehicleHealthScoreProps {
  score: number;
  level: HealthLevel;
  hasCriticalIssues: boolean;
  compact?: boolean;
}

const LEVEL_STYLES: Record<HealthLevel, { text: string; ring: string }> = {
  GOOD: { text: "text-emerald-400", ring: "stroke-emerald-400" },
  ATTENTION: { text: "text-cyan-400", ring: "stroke-cyan-400" },
  WARNING: { text: "text-amber-400", ring: "stroke-amber-400" },
  CRITICAL: { text: "text-red-400", ring: "stroke-red-400" },
};

export const VehicleHealthScore = memo(function VehicleHealthScore({
  score,
  level,
  hasCriticalIssues,
  compact = false,
}: VehicleHealthScoreProps) {
  const styles = LEVEL_STYLES[level];
  const ringSize = compact ? 52 : 88;
  const radius = compact ? 20 : 36;
  const stroke = compact ? 4 : 6;
  const center = ringSize / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div
            className={cn(
              "flex items-center rounded-xl border border-[var(--dash-border)] bg-[var(--surface-elevated)]",
              compact ? "gap-2.5 px-2.5 py-1.5" : "gap-4 px-4 py-3",
            )}
          >
            <div className="relative shrink-0" style={{ width: ringSize, height: ringSize }}>
              <svg className="-rotate-90" width={ringSize} height={ringSize} aria-hidden>
                <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--gauge-track)" strokeWidth={stroke} />
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  className={styles.ring}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={cn(
                    "font-mono font-semibold tabular-nums text-[var(--dash-text)]",
                    compact ? "text-sm" : "text-2xl",
                  )}
                >
                  {score}
                </span>
              </div>
            </div>
            {!compact && (
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--dash-muted)]">Vehicle Health</p>
                <p className={cn("text-lg font-semibold", styles.text)}>{level}</p>
                <p className="mt-1 text-xs text-[var(--dash-muted)]">
                  {hasCriticalIssues ? "● Critical issues detected" : "● No critical issues"}
                </p>
              </div>
            )}
            {compact && (
              <div className="pr-1">
                <p className={cn("text-xs font-semibold leading-tight", styles.text)}>{level}</p>
                <p className="text-[10px] text-[var(--dash-muted)]">Health</p>
              </div>
            )}
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="max-w-xs rounded-lg border border-[var(--tooltip-border)] bg-[var(--tooltip-bg)] px-3 py-2 text-xs text-[var(--dash-text-secondary)] shadow-xl"
            sideOffset={8}
          >
            CARQ Health Score is an informational indicator based on available vehicle telemetry,
            diagnostics and alerts.
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
});
