"use client";

import { memo } from "react";
import { Cpu, MapPin, Radio, Timer } from "lucide-react";

import type { ConnectionState } from "@/lib/vehicle-utils";
import { formatCoord, formatSecondsAgo } from "@/lib/vehicle-utils";
import type { TelemetryData, Vehicle } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VehicleStatusPanelProps {
  vehicle: Vehicle;
  current: TelemetryData | null;
  connectionState: ConnectionState;
  status: string;
  embedded?: boolean;
}

type StatusState = "good" | "bad" | "warn";

const STATE_STYLES: Record<
  StatusState,
  { card: string; icon: string; dot: string; label: string; detail: string }
> = {
  good: {
    card: "border-emerald-500/35 bg-emerald-500/[0.06]",
    icon: "text-emerald-400",
    dot: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.55)]",
    label: "text-emerald-400",
    detail: "text-[var(--dash-text-secondary)]",
  },
  bad: {
    card: "border-red-500/35 bg-red-500/[0.06]",
    icon: "text-red-400",
    dot: "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.45)]",
    label: "text-red-400",
    detail: "text-[var(--dash-muted)]",
  },
  warn: {
    card: "border-amber-500/35 bg-amber-500/[0.06]",
    icon: "text-amber-400",
    dot: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.45)]",
    label: "text-amber-400",
    detail: "text-[var(--dash-text-secondary)]",
  },
};

export const VehicleStatusPanel = memo(function VehicleStatusPanel({
  vehicle,
  current,
  connectionState,
  status,
  embedded = false,
}: VehicleStatusPanelProps) {
  const ignitionOn = current?.ignition ?? (status !== "STOPPED" && status !== "OFFLINE");
  const gpsActive = current?.latitude != null && current?.longitude != null;
  const deviceConnected = connectionState === "live" && status !== "OFFLINE";

  const lastUpdateState: StatusState =
    connectionState === "live" ? "good" : connectionState === "reconnecting" ? "warn" : "bad";

  const rows = [
    {
      icon: Radio,
      title: "Ignition",
      statusLabel: ignitionOn ? "ON" : "OFF",
      detail: undefined,
      state: (ignitionOn ? "good" : "bad") as StatusState,
      pulse: ignitionOn,
    },
    {
      icon: MapPin,
      title: "GPS",
      statusLabel: gpsActive ? "Active" : "Unavailable",
      detail: formatCoord(current?.latitude, current?.longitude),
      state: (gpsActive ? "good" : "bad") as StatusState,
      pulse: gpsActive,
    },
    {
      icon: Cpu,
      title: "Device",
      statusLabel: deviceConnected ? "Connected" : "Disconnected",
      detail: vehicle.device_serial ?? "—",
      state: (deviceConnected ? "good" : "bad") as StatusState,
      pulse: deviceConnected,
    },
    {
      icon: Timer,
      title: "Last Update",
      statusLabel: formatSecondsAgo(current?.timestamp),
      detail: undefined,
      state: lastUpdateState,
      pulse: connectionState === "live",
    },
  ];

  return (
    <div
      className={cn(
        embedded
          ? "rounded-xl border border-[var(--dash-border)] bg-[var(--surface-elevated)] p-3"
          : "flex h-full flex-col gap-4 rounded-2xl border border-[var(--dash-border)] bg-[var(--surface-elevated)] p-5",
      )}
    >
      {!embedded && (
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--dash-muted)]">
          Vehicle Status
        </h3>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => (
          <StatusCard key={row.title} {...row} />
        ))}
      </div>
    </div>
  );
});

function StatusCard({
  icon: Icon,
  title,
  statusLabel,
  detail,
  state,
  pulse,
}: {
  icon: typeof Radio;
  title: string;
  statusLabel: string;
  detail?: string;
  state: StatusState;
  pulse: boolean;
}) {
  const styles = STATE_STYLES[state];

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2 rounded-xl border px-3 py-2.5 transition-colors",
        styles.card,
      )}
    >
      <div className="flex items-center gap-1.5">
        <Icon className={cn("h-3.5 w-3.5 shrink-0", styles.icon)} aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--dash-muted)]">
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            styles.dot,
            pulse && "animate-pulse",
          )}
          aria-hidden
        />
        <span className={cn("text-sm font-semibold leading-none", styles.label)}>{statusLabel}</span>
      </div>

      {detail ? (
        <p className={cn("truncate pl-4 font-mono text-[11px] tabular-nums", styles.detail)}>{detail}</p>
      ) : null}
    </div>
  );
}
