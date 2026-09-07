"use client";

import Link from "next/link";
import { ChevronLeft, MoreHorizontal } from "lucide-react";

import type { ConnectionState, HealthLevel } from "@/lib/vehicle-utils";
import type { TelemetryData, Vehicle } from "@/lib/types";

import { VehicleHealthScore } from "./VehicleHealthScore";
import { ConnectionIndicator, VehicleStatusBadge } from "./VehicleStatusBadge";

interface VehicleHeaderProps {
  vehicle: Vehicle;
  connectionState: ConnectionState;
  current: TelemetryData | null;
  vehicleStatus: string;
  health: { score: number; level: HealthLevel };
  hasCriticalIssues: boolean;
}

export function VehicleHeader({
  vehicle,
  connectionState,
  current,
  vehicleStatus,
  health,
  hasCriticalIssues,
}: VehicleHeaderProps) {
  return (
    <header className="border-b border-[var(--dash-border)] pb-4">
      <Link
        href="/fleet"
        className="mb-2 inline-flex items-center gap-1 text-xs text-[var(--dash-muted)] transition hover:text-cyan-400"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Fleet
      </Link>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-[var(--dash-text)] md:text-2xl">
              {vehicle.make} {vehicle.model}
            </h1>
            <span className="font-mono text-base text-cyan-400/90">{vehicle.plate_number}</span>
            {vehicle.year != null && (
              <span className="text-sm text-[var(--dash-muted)]">{vehicle.year}</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[var(--dash-muted)]">
            <span>
              Driver:{" "}
              <span className="text-[var(--dash-muted)]">{vehicle.driver_name || "Unassigned"}</span>
            </span>
            <span>
              Device:{" "}
              <span className="font-mono text-[var(--dash-muted)]">{vehicle.device_serial || "—"}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <VehicleStatusBadge
            status={vehicleStatus}
            ignition={current?.ignition}
            size="sm"
            hideMetric
          />
          <VehicleHealthScore
            score={health.score}
            level={health.level}
            hasCriticalIssues={hasCriticalIssues}
            compact
          />
          <ConnectionIndicator
            state={connectionState}
            updatedAt={current?.timestamp}
            className="hidden sm:flex"
          />
          <button
            type="button"
            className="rounded-lg border border-[var(--dash-border)] p-1.5 text-[var(--dash-muted)] hover:bg-[var(--dash-hover)] hover:text-[var(--dash-text)]"
            aria-label="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
