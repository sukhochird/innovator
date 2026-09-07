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

  const rows = [
    {
      icon: Radio,
      title: "Ignition",
      lines: [ignitionOn ? "ON" : "OFF"],
      active: ignitionOn,
    },
    {
      icon: MapPin,
      title: "GPS",
      lines: [
        gpsActive ? "● Active" : "○ Unavailable",
        formatCoord(current?.latitude, current?.longitude),
      ],
      active: gpsActive,
    },
    {
      icon: Cpu,
      title: "Device",
      lines: [
        deviceConnected ? "● Connected" : "○ Disconnected",
        vehicle.device_serial ?? "—",
      ],
      active: deviceConnected,
    },
    {
      icon: Timer,
      title: "Last Update",
      lines: [formatSecondsAgo(current?.timestamp)],
      active: connectionState === "live",
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
          <StatusRow key={row.title} {...row} />
        ))}
      </div>
    </div>
  );
});

function StatusRow({
  icon: Icon,
  title,
  lines,
  active,
}: {
  icon: typeof Radio;
  title: string;
  lines: (string | undefined)[];
  active: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[var(--dash-muted)]">
        <Icon className="h-3 w-3 shrink-0" aria-hidden />
        <span className="text-[10px] font-medium uppercase tracking-wider">{title}</span>
      </div>
      <div className="mt-1 space-y-0.5 pl-[18px]">
        {lines.filter(Boolean).map((line) => (
          <p
            key={line}
            className={cn(
              "truncate text-xs",
              active && line?.startsWith("●") ? "text-[var(--dash-text-secondary)]" : "text-[var(--dash-muted)]",
              line?.startsWith("●") && !active && "text-[var(--dash-muted)]",
            )}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
