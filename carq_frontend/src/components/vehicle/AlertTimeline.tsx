"use client";

import { memo } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import type { VehicleAlert } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AlertTimelineProps {
  alerts: VehicleAlert[];
}

export const AlertTimeline = memo(function AlertTimeline({ alerts }: AlertTimelineProps) {
  const sorted = [...alerts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <section className="rounded-2xl border border-[var(--dash-border)] bg-[var(--surface-elevated)] p-5">
      <h3 className="mb-4 text-sm font-semibold text-[var(--dash-text)]">Recent Alerts</h3>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <CheckCircle2 className="mb-3 h-8 w-8 text-emerald-500/60" />
          <p className="font-medium text-[var(--dash-text-secondary)]">All Clear</p>
          <p className="mt-1 text-sm text-[var(--dash-muted)]">No active alerts.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sorted.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </ul>
      )}
    </section>
  );
});

function AlertRow({ alert }: { alert: VehicleAlert }) {
  const resolved = !!alert.resolved_at;
  const severity = alert.severity?.toUpperCase() ?? "INFO";
  const Icon = resolved ? CheckCircle2 : severity === "CRITICAL" ? AlertTriangle : severity === "WARNING" ? AlertTriangle : Info;

  return (
    <li className="flex gap-3 border-b border-[var(--dash-border)] pb-3 last:border-0 last:pb-0">
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          resolved && "text-emerald-400",
          !resolved && severity === "CRITICAL" && "text-red-400",
          !resolved && severity === "WARNING" && "text-amber-400",
          !resolved && severity === "INFO" && "text-cyan-400",
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm", resolved ? "text-[var(--dash-muted)]" : "text-[var(--dash-text-secondary)]")}>
          {alert.message}
        </p>
        {alert.value != null && (
          <p className="font-mono text-xs text-[var(--dash-muted)]">{alert.value}</p>
        )}
        <p className="mt-1 text-xs text-[var(--dash-muted)]">
          {formatTime(alert.created_at)}
          {resolved && " · Resolved"}
        </p>
      </div>
      {!resolved && (
        <span className={cn("text-[10px] font-semibold uppercase tracking-wide", severityColor(severity))}>
          {severity}
        </span>
      )}
    </li>
  );
}

function severityColor(severity: string) {
  if (severity === "CRITICAL") return "text-red-400";
  if (severity === "WARNING") return "text-amber-400";
  return "text-cyan-400";
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
