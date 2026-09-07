"use client";

import { memo, useMemo } from "react";

import { useAnimatedValue } from "@/hooks/useAnimatedValue";
import type { MetricStatus } from "@/lib/vehicle-utils";
import { cn } from "@/lib/utils";

export interface GaugeProps {
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  label?: string;
  status?: MetricStatus;
  warningThreshold?: number;
  criticalThreshold?: number;
  size?: "sm" | "md" | "lg" | "xl";
  invertThreshold?: boolean;
}

function statusColor(status: MetricStatus, value: number, props: GaugeProps): string {
  if (props.status) {
    if (props.status === "critical") return "#ef4444";
    if (props.status === "warning") return "#f59e0b";
    return "#22d3ee";
  }
  const { warningThreshold, criticalThreshold, invertThreshold } = props;
  if (criticalThreshold !== undefined) {
    if (invertThreshold) {
      if (value <= criticalThreshold) return "#ef4444";
      if (warningThreshold !== undefined && value <= warningThreshold) return "#f59e0b";
    } else {
      if (value >= criticalThreshold) return "#ef4444";
      if (warningThreshold !== undefined && value >= warningThreshold) return "#f59e0b";
    }
  }
  return "#22d3ee";
}

const GaugeBase = memo(function GaugeBase(props: GaugeProps) {
  const {
    value,
    min = 0,
    max = 100,
    unit = "",
    label = "",
    size = "md",
  } = props;

  const animated = useAnimatedValue(value);

  const pct = useMemo(() => {
    const clamped = Math.min(max, Math.max(min, animated));
    return ((clamped - min) / (max - min)) * 100;
  }, [animated, min, max]);

  const color = statusColor(props.status ?? "normal", animated, props);

  const dims = size === "xl" ? 240 : size === "lg" ? 200 : size === "sm" ? 100 : 140;
  const r = dims / 2 - 12;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (pct / 100) * circumference * 0.75;

  const valueClass =
    size === "xl"
      ? "text-4xl md:text-5xl"
      : size === "lg"
        ? "text-3xl"
        : size === "sm"
          ? "text-lg"
          : "text-2xl";

  const strokeWidth = size === "xl" ? 10 : size === "sm" ? 5 : 8;

  return (
    <div
      className="relative shrink-0"
      style={{ width: dims, height: dims }}
      role="img"
      aria-label={`${label} ${Math.round(animated)} ${unit}`}
    >
      <svg width={dims} height={dims} className="-rotate-[135deg]" aria-hidden>
        <circle
          cx={dims / 2}
          cy={dims / 2}
          r={r}
          fill="none"
          stroke="var(--gauge-track)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference * 0.75} ${circumference}`}
          strokeLinecap="round"
        />
        <circle
          cx={dims / 2}
          cy={dims / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference * 0.75} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.1s linear, stroke 0.3s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-mono font-semibold leading-none tabular-nums text-[var(--dash-text)]", valueClass)}>
          {size === "xl" || size === "lg" || label === "Engine RPM"
            ? Math.round(animated)
            : Math.round(animated * 10) / 10}
        </span>
        {unit && (
          <span className={cn("uppercase tracking-widest text-[var(--dash-muted)]", size === "sm" ? "text-[9px]" : "text-xs")}>
            {unit}
          </span>
        )}
        {label && size !== "sm" && (
          <span className="mt-1 text-[11px] uppercase tracking-wider text-[var(--dash-muted)]">{label}</span>
        )}
      </div>
    </div>
  );
});

export const SpeedGauge = memo(function SpeedGauge(
  props: Omit<GaugeProps, "max" | "unit" | "label">,
) {
  return (
    <GaugeBase
      {...props}
      max={220}
      unit="km/h"
      label="Speed"
      warningThreshold={100}
      criticalThreshold={120}
      size={props.size ?? "lg"}
    />
  );
});

export const RpmGauge = memo(function RpmGauge(props: Omit<GaugeProps, "max" | "unit" | "label">) {
  return (
    <GaugeBase
      {...props}
      max={8000}
      unit="RPM"
      label="Engine RPM"
      warningThreshold={4500}
      criticalThreshold={5500}
      size={props.size ?? "md"}
    />
  );
});

export const TemperatureGauge = memo(function TemperatureGauge(
  props: Omit<GaugeProps, "max" | "unit" | "label" | "min">,
) {
  return (
    <GaugeBase
      {...props}
      min={40}
      max={130}
      unit="°C"
      label="Coolant"
      warningThreshold={95}
      criticalThreshold={105}
    />
  );
});

export const BatteryGauge = memo(function BatteryGauge(
  props: Omit<GaugeProps, "max" | "unit" | "label" | "min">,
) {
  return (
    <GaugeBase
      {...props}
      min={10}
      max={15}
      unit="V"
      label="Battery"
      warningThreshold={12}
      criticalThreshold={11.5}
      invertThreshold
      size="sm"
    />
  );
});

export const FuelGauge = memo(function FuelGauge(props: Omit<GaugeProps, "max" | "unit" | "label">) {
  return (
    <GaugeBase
      {...props}
      max={100}
      unit="%"
      label="Fuel"
      warningThreshold={20}
      criticalThreshold={10}
      invertThreshold
      size="sm"
    />
  );
});

export const EngineLoadGauge = memo(function EngineLoadGauge(
  props: Omit<GaugeProps, "max" | "unit" | "label">,
) {
  return <GaugeBase {...props} max={100} unit="%" label="Engine Load" size="sm" />;
});

export const ThrottleGauge = memo(function ThrottleGauge(
  props: Omit<GaugeProps, "max" | "unit" | "label">,
) {
  return <GaugeBase {...props} max={100} unit="%" label="Throttle" size="sm" />;
});
