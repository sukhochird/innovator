"use client";

import { memo } from "react";
import Link from "next/link";
import { ExternalLink, History, MapPin, Radio } from "lucide-react";

import { VehicleStatusBadge } from "@/components/vehicle/VehicleStatusBadge";
import type { Vehicle } from "@/lib/types";
import { formatSecondsAgo } from "@/lib/vehicle-utils";

interface VehicleMapPopupProps {
  vehicle: Vehicle;
  onTrack: () => void;
  onHistory: () => void;
  onClose: () => void;
}

export const VehicleMapPopup = memo(function VehicleMapPopup({
  vehicle,
  onTrack,
  onHistory,
  onClose,
}: VehicleMapPopupProps) {
  const tel = vehicle.current_telemetry;
  const status = tel?.status ?? vehicle.status;

  return (
    <div className="absolute bottom-4 left-4 z-10 w-[280px] rounded-xl border border-[var(--dash-border)] bg-[var(--surface-deep)]/95 p-4 shadow-xl backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-[var(--dash-text)]">
            {vehicle.make} {vehicle.model}
          </p>
          <p className="font-mono text-sm text-cyan-400">{vehicle.plate_number}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[var(--dash-muted)] hover:text-[var(--dash-text)]"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="mt-3">
        <VehicleStatusBadge status={status} speed={tel?.speed} size="sm" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs tabular-nums text-[var(--dash-text-secondary)]">
        {tel?.speed != null && <span>{Math.round(tel.speed)} km/h</span>}
        {tel?.rpm != null && <span>{Math.round(tel.rpm).toLocaleString()} RPM</span>}
        {tel?.coolant_temperature != null && <span>{Math.round(tel.coolant_temperature)}°C</span>}
        {tel?.battery_voltage != null && <span>{tel.battery_voltage.toFixed(1)}V</span>}
      </div>

      <p className="mt-2 text-xs text-[var(--dash-muted)]">
        Updated {formatSecondsAgo(tel?.timestamp)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onTrack}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500"
        >
          <Radio className="h-3.5 w-3.5" />
          Track
        </button>
        <button
          type="button"
          onClick={onHistory}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--dash-border)] px-3 py-2 text-xs text-[var(--dash-text)] hover:bg-[var(--dash-hover)]"
        >
          <History className="h-3.5 w-3.5" />
          History
        </button>
        <Link
          href={`/vehicle/${vehicle.id}`}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-cyan-500/30 px-3 py-2 text-xs text-cyan-400 hover:bg-cyan-500/10"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Details
        </Link>
      </div>
    </div>
  );
});

interface VehicleTrackingPanelProps {
  vehicle: Vehicle;
  onStop: () => void;
}

export const VehicleTrackingPanel = memo(function VehicleTrackingPanel({
  vehicle,
  onStop,
}: VehicleTrackingPanelProps) {
  const tel = vehicle.current_telemetry;
  const status = tel?.status ?? vehicle.status;

  return (
    <div className="absolute left-4 top-4 z-10 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">
        <MapPin className="h-3.5 w-3.5 animate-pulse" />
        Live Tracking
      </div>
      <p className="mt-1 font-medium text-[var(--dash-text)]">
        {vehicle.make} {vehicle.model}
      </p>
      <p className="font-mono text-sm text-cyan-400">{vehicle.plate_number}</p>
      <div className="mt-2">
        <VehicleStatusBadge status={status} speed={tel?.speed} size="sm" />
      </div>
      <button
        type="button"
        onClick={onStop}
        className="mt-3 w-full rounded-lg border border-[var(--dash-border)] bg-[var(--surface-deep)] px-3 py-1.5 text-xs text-[var(--dash-text)] hover:bg-[var(--dash-hover)]"
      >
        Stop Tracking
      </button>
    </div>
  );
});
