"use client";

import { memo, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Battery,
  Gauge,
  Thermometer,
  WifiOff,
  Zap,
} from "lucide-react";

import { AiInsightCard } from "@/components/insights/AiInsightCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { generateAlertsInsight } from "@/lib/ai-insights";
import { apiFetch } from "@/lib/api";
import type { FleetAlert, FleetAlertsResponse } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

type Filter = "ALL" | "CRITICAL" | "WARNING" | "INFO";

export function AlertsHub() {
  const [filter, setFilter] = useState<Filter>("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["fleet-alerts"],
    queryFn: () => apiFetch<FleetAlertsResponse>("/api/dashboard/alerts/"),
    refetchInterval: 30_000,
  });

  const alerts = data?.alerts ?? [];
  const summary = data?.summary ?? { total: 0, critical: 0, warning: 0, info: 0 };
  const insight = useMemo(() => generateAlertsInsight(alerts, summary), [alerts, summary]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return alerts;
    return alerts.filter((a) => a.severity === filter);
  }, [alerts, filter]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-[var(--dash-text)]">Alerts Command Center</h2>
        <p className="mt-1 text-sm text-[var(--dash-muted)]">
          Real-time fleet anomalies with AI-prioritized response guidance
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Active" value={summary.total} />
        <StatCard label="Critical" value={summary.critical} accent="text-red-400" />
        <StatCard label="Warning" value={summary.warning} accent="text-amber-400" />
        <StatCard label="Info" value={summary.info} accent="text-cyan-400" />
      </div>

      <AiInsightCard insight={insight} />

      <div className="flex flex-wrap gap-2">
        {(["ALL", "CRITICAL", "WARNING", "INFO"] as Filter[]).map((f) => (
          <FilterChip key={f} active={filter === f} onClick={() => setFilter(f)} label={f} />
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--skeleton)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyAlerts filter={filter} />
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
        active
          ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
          : "border-[var(--dash-border)] text-[var(--dash-muted)] hover:text-[var(--dash-text)]",
      )}
    >
      {label}
    </button>
  );
}

const AlertCard = memo(function AlertCard({ alert }: { alert: FleetAlert }) {
  const Icon = alertIcon(alert.type);
  const stripe =
    alert.severity === "CRITICAL"
      ? "bg-red-500"
      : alert.severity === "WARNING"
        ? "bg-amber-500"
        : "bg-cyan-500";

  return (
    <article className="relative overflow-hidden rounded-xl border border-[var(--dash-border)] bg-[var(--surface-elevated)]">
      <div className={cn("absolute left-0 top-0 h-full w-1", stripe)} />
      <div className="flex flex-col gap-3 p-4 pl-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 rounded-lg bg-[var(--surface-deep)] p-2 text-[var(--dash-muted)]">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <SeverityPill severity={alert.severity} />
              <span className="font-mono text-[10px] uppercase text-[var(--dash-muted)]">
                {alert.type.replace(/_/g, " ")}
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--dash-text)]">{alert.message}</p>
            <p className="mt-2 text-xs text-[var(--dash-muted)]">
              {formatRelativeTime(alert.created_at)}
              {alert.value != null && alert.threshold != null && (
                <span className="ml-2 font-mono">
                  {alert.value} / limit {alert.threshold}
                </span>
              )}
            </p>
          </div>
        </div>
        <Link
          href={`/vehicle/${alert.vehicle_id}`}
          className="shrink-0 rounded-lg border border-[var(--dash-border)] bg-[var(--surface-deep)] px-3 py-2 text-xs hover:border-cyan-500/30"
        >
          <span className="font-mono text-cyan-400">{alert.vehicle_plate}</span>
          <span className="mt-0.5 block text-[var(--dash-muted)]">
            {alert.vehicle_make} {alert.vehicle_model}
          </span>
        </Link>
      </div>
    </article>
  );
});

function SeverityPill({ severity }: { severity: string }) {
  const styles =
    severity === "CRITICAL"
      ? "bg-red-500/10 text-red-400"
      : severity === "WARNING"
        ? "bg-amber-500/10 text-amber-400"
        : "bg-cyan-500/10 text-cyan-400";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", styles)}>
      {severity}
    </span>
  );
}

function alertIcon(type: string) {
  if (type.includes("COOLANT") || type.includes("TEMP")) return Thermometer;
  if (type.includes("BATTERY")) return Battery;
  if (type.includes("RPM") || type.includes("SPEED")) return Gauge;
  if (type.includes("OFFLINE")) return WifiOff;
  if (type.includes("DTC")) return Zap;
  return AlertTriangle;
}

function EmptyAlerts({ filter }: { filter: Filter }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--dash-border)] py-16 text-center">
      <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-emerald-500/50" />
      <p className="font-medium text-[var(--dash-text-secondary)]">
        {filter === "ALL" ? "No active alerts" : `No ${filter.toLowerCase()} alerts`}
      </p>
      <p className="mt-1 text-sm text-[var(--dash-muted)]">Fleet operating within thresholds</p>
    </div>
  );
}
