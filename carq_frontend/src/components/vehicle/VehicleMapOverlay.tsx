"use client";

import { memo } from "react";

import type { TelemetryData, Vehicle } from "@/lib/types";
import { formatSecondsAgo } from "@/lib/vehicle-utils";

import { VehicleStatusBadge } from "./VehicleStatusBadge";

interface VehicleMapOverlayProps {
  vehicle: Vehicle;
  current: TelemetryData | null;
  vehicleStatus: string;
}

export const VehicleMapOverlay = memo(function VehicleMapOverlay({
  vehicle,
  current,
  vehicleStatus,
}: VehicleMapOverlayProps) {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 max-w-[240px] rounded-xl border border-[var(--dash-border)]/80 bg-[var(--surface-deep)]/90 p-4 shadow-xl backdrop-blur-sm">
      <p className="font-semibold text-[var(--dash-text)]">
        {vehicle.make} {vehicle.model}
      </p>
      <p className="font-mono text-sm text-cyan-400/90">{vehicle.plate_number}</p>

      <div className="mt-3">
        <VehicleStatusBadge status={vehicleStatus} speed={current?.speed} size="sm" />
      </div>

      <div className="mt-3 flex gap-4 font-mono text-sm tabular-nums text-[var(--dash-text-secondary)]">
        {current?.speed != null && (
          <span>{Math.round(current.speed)} km/h</span>
        )}
        {current?.rpm != null && (
          <span>{Math.round(current.rpm).toLocaleString()} RPM</span>
        )}
      </div>

      <p className="mt-2 text-xs text-[var(--dash-muted)]">
        Updated {formatSecondsAgo(current?.timestamp)}
      </p>
    </div>
  );
});
