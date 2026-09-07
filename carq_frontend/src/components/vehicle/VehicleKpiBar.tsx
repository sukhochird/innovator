"use client";

import { memo } from "react";
import {
  Activity,
  Battery,
  Fuel,
  Gauge,
  Thermometer,
  Zap,
} from "lucide-react";

import type { TelemetryData } from "@/lib/types";
import { getMetricStatus, statusLabel, type MetricStatus } from "@/lib/vehicle-utils";
import { cn } from "@/lib/utils";

interface VehicleKpiBarProps {
  current: TelemetryData | null;
}

const KPI_CONFIG = [
  {
    key: "speed" as const,
    label: "Speed",
    icon: Gauge,
    unit: "km/h",
    getValue: (t: TelemetryData) => t.speed,
    warning: 100,
    critical: 120,
    higherIsBad: true,
    format: (v: number) => Math.round(v).toString(),
  },
  {
    key: "rpm" as const,
    label: "RPM",
    icon: Activity,
    unit: "",
    getValue: (t: TelemetryData) => t.rpm,
    warning: 4500,
    critical: 5500,
    higherIsBad: true,
    format: (v: number) => Math.round(v).toLocaleString(),
  },
  {
    key: "coolant" as const,
    label: "Coolant",
    icon: Thermometer,
    unit: "°C",
    getValue: (t: TelemetryData) => t.coolant_temperature,
    warning: 95,
    critical: 105,
    higherIsBad: true,
    format: (v: number) => Math.round(v).toString(),
  },
  {
    key: "battery" as const,
    label: "Battery",
    icon: Battery,
    unit: "V",
    getValue: (t: TelemetryData) => t.battery_voltage,
    warning: 12,
    critical: 11.5,
    higherIsBad: false,
    format: (v: number) => v.toFixed(1),
  },
  {
    key: "fuel" as const,
    label: "Fuel",
    icon: Fuel,
    unit: "%",
    getValue: (t: TelemetryData) => t.fuel_level,
    warning: 20,
    critical: 10,
    higherIsBad: false,
    format: (v: number) => Math.round(v).toString(),
  },
  {
    key: "load" as const,
    label: "Engine Load",
    icon: Zap,
    unit: "%",
    getValue: (t: TelemetryData) => t.engine_load,
    warning: 85,
    critical: 95,
    higherIsBad: true,
    format: (v: number) => Math.round(v).toString(),
  },
];

export const VehicleKpiBar = memo(function VehicleKpiBar({ current }: VehicleKpiBarProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {KPI_CONFIG.map((kpi) => {
        const raw = current ? kpi.getValue(current) : null;
        const value = raw ?? 0;
        const status: MetricStatus =
          raw == null
            ? "normal"
            : getMetricStatus(raw, kpi.warning, kpi.critical, kpi.higherIsBad);
        const Icon = kpi.icon;

        return (
          <KpiCell
            key={kpi.key}
            icon={Icon}
            label={kpi.label}
            value={raw == null ? "—" : `${kpi.format(value)}${kpi.unit ? "" : ""}`}
            unit={raw == null ? "" : kpi.unit}
            status={status}
          />
        );
      })}
    </div>
  );
});

function KpiCell({
  icon: Icon,
  label,
  value,
  unit,
  status,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  unit: string;
  status: MetricStatus;
}) {
  return (
    <div className="rounded-lg border border-[var(--dash-border)] bg-[var(--surface-elevated)]/80 px-3 py-3">
      <div className="flex items-center gap-1.5 text-[var(--dash-muted)]">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 font-mono text-xl font-semibold tabular-nums text-[var(--dash-text)]">
        {value}
        {unit && value !== "—" && (
          <span className="ml-0.5 text-sm font-normal text-[var(--dash-muted)]">{unit}</span>
        )}
      </div>
      <div
        className={cn(
          "mt-1 text-[10px] font-medium uppercase tracking-wide",
          status === "critical" && "text-red-400",
          status === "warning" && "text-amber-400",
          status === "normal" && "text-[var(--dash-muted)]",
        )}
      >
        {value === "—" ? "—" : statusLabel(status)}
      </div>
    </div>
  );
}
