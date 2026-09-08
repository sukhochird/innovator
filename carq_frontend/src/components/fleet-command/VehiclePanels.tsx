"use client";

import { memo } from "react";
import Link from "next/link";
import {
  Activity,
  BatteryCharging,
  Compass,
  Cpu,
  ExternalLink,
  Gauge,
  History,
  Power,
  PowerOff,
  Radio,
  Thermometer,
  X,
} from "lucide-react";

import { VehicleStatusBadge } from "@/components/vehicle/VehicleStatusBadge";
import type { Vehicle } from "@/lib/types";
import { formatSecondsAgo } from "@/lib/vehicle-utils";

interface VehicleTrackingPanelProps {
  vehicle: Vehicle;
  isTracking?: boolean;
  onStopTracking?: () => void;
  onResumeTracking?: () => void;
  onHistory?: () => void;
  onClose?: () => void;
}

export const VehicleTrackingPanel = memo(function VehicleTrackingPanel({
  vehicle,
  isTracking = true,
  onStopTracking,
  onResumeTracking,
  onHistory,
  onClose,
}: VehicleTrackingPanelProps) {
  const tel = vehicle.current_telemetry;
  const status = tel?.status ?? vehicle.status;
  const isIgnitionOn =
    tel?.ignition === true ||
    (tel?.ignition == null && (status === "MOVING" || status === "IDLE"));

  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 z-20 w-[320px] rounded-2xl border border-[var(--dash-border)] bg-[var(--surface-deep)]/95 p-4 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-[var(--dash-border)] pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[var(--dash-text)] truncate">
              {vehicle.make} {vehicle.model}
            </span>
          </div>
          <p className="font-mono text-xs font-semibold text-cyan-400">
            {vehicle.plate_number}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {isTracking && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30 animate-pulse">
              <Compass className="h-3 w-3" />
              Дагаж байна
            </span>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-[var(--dash-muted)] hover:bg-[var(--dash-hover)] hover:text-[var(--dash-text)] transition cursor-pointer"
              aria-label="Хаах"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Realtime Status Badges: Ignition & Motion */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Ignition / ACC Badge */}
        <div
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border ${
            isIgnitionOn
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              : "border-zinc-700 bg-zinc-800/60 text-zinc-400"
          }`}
          title={isIgnitionOn ? "Түлхүүр залгаатай, мотор асаалттай" : "Мотор бүрэн унтарсан"}
        >
          {isIgnitionOn ? (
            <Power className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
          ) : (
            <PowerOff className="h-3.5 w-3.5 text-zinc-500" />
          )}
          <span>{isIgnitionOn ? "Мотор: Асаалттай" : "Мотор: Унтраастай"}</span>
        </div>

        {/* Motion Status */}
        <VehicleStatusBadge status={status} speed={tel?.speed} size="sm" />
      </div>

      {/* Realtime Telemetry Grid */}
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-[var(--dash-border)] bg-[var(--surface-elevated)]/60 p-2.5 font-mono text-xs">
        <div className="flex items-center gap-2 text-[var(--dash-text-secondary)]">
          <Gauge className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-[var(--dash-muted)]">Хурд</p>
            <p className="font-semibold text-emerald-400">
              {tel?.speed != null ? `${Math.round(tel.speed)} km/h` : "0 km/h"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[var(--dash-text-secondary)]">
          <Activity className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-[var(--dash-muted)]">Эргэлт</p>
            <p className="font-semibold text-[var(--dash-text)]">
              {tel?.rpm != null && tel.rpm > 0 ? `${Math.round(tel.rpm)} RPM` : "0 RPM"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[var(--dash-text-secondary)]">
          <BatteryCharging className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-[var(--dash-muted)]">Хүчдэл</p>
            <p className="font-semibold text-[var(--dash-text)]">
              {tel?.battery_voltage != null ? `${tel.battery_voltage.toFixed(1)}V` : "12.6V"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[var(--dash-text-secondary)]">
          <Thermometer className="h-3.5 w-3.5 text-rose-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-[var(--dash-muted)]">Хөргүүр</p>
            <p className="font-semibold text-[var(--dash-text)]">
              {tel?.coolant_temperature != null ? `${Math.round(tel.coolant_temperature)}°C` : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Device & Last Ping info */}
      <div className="mt-2.5 flex items-center justify-between text-[10px] text-[var(--dash-muted)] px-0.5">
        <span className="flex items-center gap-1 font-mono">
          <Cpu className="h-3 w-3 text-cyan-400/80" />
          {vehicle.device_serial || "CARQ-OBD"}
        </span>
        <span>
          {tel?.timestamp ? `Шинэчлэгдсэн: ${formatSecondsAgo(tel.timestamp)}` : "Холболт идэвхтэй"}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 flex items-center gap-2">
        {isTracking ? (
          <button
            type="button"
            onClick={onStopTracking}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition cursor-pointer"
          >
            <Radio className="h-3.5 w-3.5" />
            Дагахаа болих
          </button>
        ) : (
          <button
            type="button"
            onClick={onResumeTracking}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition cursor-pointer"
          >
            <Compass className="h-3.5 w-3.5" />
            Машиныг дагах
          </button>
        )}

        {onHistory && (
          <button
            type="button"
            onClick={onHistory}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--dash-border)] bg-[var(--surface-elevated)] px-3 py-2 text-xs text-[var(--dash-text)] hover:bg-[var(--dash-hover)] transition cursor-pointer"
            title="Явсан замын түүх"
          >
            <History className="h-3.5 w-3.5 text-violet-400" />
            Түүх
          </button>
        )}

        <Link
          href={`/vehicle/${vehicle.id}`}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 transition cursor-pointer"
          title="Дэлгэрэнгүй хуудас руу очих"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
});

export const VehicleMapPopup = VehicleTrackingPanel;
