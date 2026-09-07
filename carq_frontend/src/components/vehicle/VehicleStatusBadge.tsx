"use client";

import { memo, useEffect, useState } from "react";

import type { ConnectionState } from "@/lib/vehicle-utils";
import { formatSecondsAgo } from "@/lib/vehicle-utils";
import { cn } from "@/lib/utils";

interface ConnectionIndicatorProps {
  state: ConnectionState;
  updatedAt?: string | null;
  className?: string;
}

export const ConnectionIndicator = memo(function ConnectionIndicator({
  state,
  updatedAt,
  className,
}: ConnectionIndicatorProps) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 10000);
    return () => clearInterval(id);
  }, []);

  const label =
    state === "live" ? "LIVE" : state === "reconnecting" ? "RECONNECTING" : "OFFLINE";

  return (
    <div className={cn("flex flex-col items-end gap-1", className)}>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            state === "live" && "bg-emerald-400 animate-pulse",
            state === "reconnecting" && "bg-amber-400",
            state === "offline" && "bg-zinc-600",
          )}
          aria-hidden
        />
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-widest",
            state === "live" && "text-emerald-400",
            state === "reconnecting" && "text-amber-400",
            state === "offline" && "text-[var(--dash-muted)]",
          )}
        >
          {label}
        </span>
      </div>
      <span className="text-xs text-[var(--dash-muted)]">
        {state === "offline" ? "Last seen " : "Updated "}
        {formatSecondsAgo(updatedAt)}
      </span>
    </div>
  );
});

interface VehicleStatusBadgeProps {
  status: string;
  speed?: number | null;
  ignition?: boolean | null;
  size?: "sm" | "lg";
  hideMetric?: boolean;
}

export const VehicleStatusBadge = memo(function VehicleStatusBadge({
  status,
  speed,
  ignition,
  size = "lg",
  hideMetric = false,
}: VehicleStatusBadgeProps) {
  const config = getStatusConfig(status, hideMetric ? null : speed, ignition);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 rounded-xl border px-4 py-3",
        config.border,
        config.bg,
        size === "sm" && "px-3 py-2",
      )}
    >
      <span className={cn("h-2.5 w-2.5 rounded-full", config.dot)} aria-hidden />
      <div>
        <div className={cn("font-semibold uppercase tracking-wide", config.text, size === "lg" ? "text-sm" : "text-xs")}>
          {config.label}
        </div>
        {config.sub && (
          <div className={cn("font-mono tabular-nums text-[var(--dash-text-secondary)]", size === "lg" ? "text-lg" : "text-sm")}>
            {config.sub}
          </div>
        )}
      </div>
    </div>
  );
});

function getStatusConfig(status: string, speed?: number | null, ignition?: boolean | null) {
  switch (status) {
    case "MOVING":
      return {
        label: "Moving",
        sub: speed != null ? `${Math.round(speed)} km/h` : undefined,
        dot: "bg-emerald-400",
        text: "text-emerald-400",
        border: "border-emerald-500/20",
        bg: "bg-emerald-500/5",
      };
    case "IDLE":
      return {
        label: "Idle",
        sub: speed != null ? `${Math.round(speed)} km/h` : "0 km/h",
        dot: "bg-amber-400",
        text: "text-amber-400",
        border: "border-amber-500/20",
        bg: "bg-amber-500/5",
      };
    case "STOPPED":
      return {
        label: "Stopped",
        sub: ignition === false ? "Ignition OFF" : undefined,
        dot: "bg-zinc-400",
        text: "text-[var(--dash-muted)]",
        border: "border-zinc-600/30",
        bg: "bg-zinc-800/30",
      };
    case "ALERT":
      return {
        label: "Alert",
        sub: speed != null ? `${Math.round(speed)} km/h` : undefined,
        dot: "bg-red-400",
        text: "text-red-400",
        border: "border-red-500/20",
        bg: "bg-red-500/5",
      };
    case "OFFLINE":
    default:
      return {
        label: "Offline",
        sub: undefined,
        dot: "bg-zinc-600",
        text: "text-[var(--dash-muted)]",
        border: "border-[var(--tooltip-border)]/40",
        bg: "bg-[var(--tooltip-bg)]/40",
      };
  }
}
