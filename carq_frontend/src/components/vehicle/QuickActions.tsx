"use client";

import { memo } from "react";
import {
  AlertTriangle,
  Download,
  Gauge,
  MapPin,
  Radio,
  Route,
  Stethoscope,
} from "lucide-react";

interface QuickActionsProps {
  onScrollTo?: (section: "map" | "telemetry" | "dtc" | "alerts" | "trips" | "rawlogs") => void;
}

const ACTIONS = [
  { key: "map" as const, label: "View GPS History", icon: MapPin },
  { key: "telemetry" as const, label: "View Telemetry", icon: Gauge },
  { key: "dtc" as const, label: "View DTC", icon: Stethoscope },
  { key: "alerts" as const, label: "View Alerts", icon: AlertTriangle },
  { key: "rawlogs" as const, label: "Raw Device Log", icon: Radio },
  { key: "trips" as const, label: "View Trips", icon: Route },
  { key: "export" as const, label: "Export Data", icon: Download },
];

export const QuickActions = memo(function QuickActions({ onScrollTo }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => {
            if (key !== "export") onScrollTo?.(key);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--dash-border)] bg-[var(--surface-elevated)]/60 px-3 py-2 text-xs text-[var(--dash-muted)] transition hover:border-cyan-500/20 hover:text-[var(--dash-text-secondary)]"
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
});
