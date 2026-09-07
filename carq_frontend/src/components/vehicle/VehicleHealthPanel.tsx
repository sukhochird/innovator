"use client";

import { memo } from "react";
import { Activity, Battery, Stethoscope, Thermometer } from "lucide-react";

import type { DTCCode, TelemetryData } from "@/lib/types";
import { getMetricStatus } from "@/lib/vehicle-utils";
import { cn } from "@/lib/utils";

interface VehicleHealthPanelProps {
  current: TelemetryData | null;
  dtc: DTCCode[];
  onDiagnosticsClick?: () => void;
}

export const VehicleHealthPanel = memo(function VehicleHealthPanel({
  current,
  dtc,
  onDiagnosticsClick,
}: VehicleHealthPanelProps) {
  const activeDtc = dtc.filter((d) => d.is_active);
  const warningDtc = activeDtc.filter((d) => d.severity === "WARNING" || d.severity === "CRITICAL");

  const engineStatus = current?.rpm != null && current.rpm > 0 ? "GOOD" : "IDLE";
  const batteryStatus = getMetricStatus(current?.battery_voltage, 12, 11.5, false);
  const tempStatus = getMetricStatus(current?.coolant_temperature, 95, 105);

  type CardTone = "good" | "warn" | "bad" | "neutral";
  type HealthCard = {
    icon: typeof Activity;
    title: string;
    value: string;
    tone: CardTone;
    onClick?: () => void;
  };

  const cards: HealthCard[] = [
    {
      icon: Activity,
      title: "Engine",
      value: engineStatus,
      tone: engineStatus === "GOOD" ? "good" : "neutral",
    },
    {
      icon: Battery,
      title: "Battery",
      value: batteryStatus === "normal" ? "GOOD" : batteryStatus === "warning" ? "ATTENTION" : "CRITICAL",
      tone: batteryStatus === "normal" ? "good" : batteryStatus === "warning" ? "warn" : "bad",
    },
    {
      icon: Thermometer,
      title: "Temperature",
      value: tempStatus === "normal" ? "NORMAL" : tempStatus === "warning" ? "WARNING" : "CRITICAL",
      tone: tempStatus === "normal" ? "good" : tempStatus === "warning" ? "warn" : "bad",
    },
    {
      icon: Stethoscope,
      title: "Diagnostics",
      value: warningDtc.length > 0 ? `${warningDtc.length} WARNING${warningDtc.length > 1 ? "S" : ""}` : activeDtc.length > 0 ? `${activeDtc.length} ACTIVE` : "CLEAR",
      tone: warningDtc.length > 0 ? "warn" : activeDtc.length > 0 ? "neutral" : "good",
      onClick: onDiagnosticsClick,
    },
  ];

  return (
    <section className="rounded-2xl border border-[var(--dash-border)] bg-[var(--surface-elevated)] p-5">
      <h3 className="mb-4 text-sm font-semibold text-[var(--dash-text)]">Vehicle Health</h3>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const Wrapper = card.onClick ? "button" : "div";
          return (
            <Wrapper
              key={card.title}
              type={card.onClick ? "button" : undefined}
              onClick={card.onClick}
              className={cn(
                "rounded-xl border border-[var(--dash-border)] bg-[var(--surface-deep)]/60 p-4 text-left transition",
                card.onClick && "hover:border-cyan-500/30 hover:bg-[var(--dash-hover)]",
              )}
            >
              <div className="flex items-center gap-2 text-[var(--dash-muted)]">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium uppercase tracking-wider">{card.title}</span>
              </div>
              <p
                className={cn(
                  "mt-2 text-sm font-semibold",
                  card.tone === "good" && "text-emerald-400",
                  card.tone === "warn" && "text-amber-400",
                  card.tone === "bad" && "text-red-400",
                  card.tone === "neutral" && "text-[var(--dash-text-secondary)]",
                )}
              >
                {card.value}
              </p>
            </Wrapper>
          );
        })}
      </div>
    </section>
  );
});
