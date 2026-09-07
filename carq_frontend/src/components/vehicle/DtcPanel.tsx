"use client";

import { memo, forwardRef } from "react";
import { AlertTriangle, ChevronRight, CircleCheck } from "lucide-react";

import type { DTCCode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DtcPanelProps {
  dtc: DTCCode[];
}

export const DtcPanel = memo(
  forwardRef<HTMLElement, DtcPanelProps>(function DtcPanel({ dtc }, ref) {
    const active = dtc.filter((d) => d.is_active);

    return (
      <section ref={ref} className="rounded-2xl border border-[var(--dash-border)] bg-[var(--surface-elevated)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--dash-text)]">Diagnostics</h3>
          <span className="text-xs text-[var(--dash-muted)]">
            {active.length} Active
          </span>
        </div>

        {active.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CircleCheck className="mb-3 h-8 w-8 text-emerald-500/60" />
            <p className="font-medium text-[var(--dash-text-secondary)]">No Active Diagnostic Codes</p>
            <p className="mt-1 max-w-sm text-sm text-[var(--dash-muted)]">
              Your vehicle currently has no active DTCs.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((d) => (
              <DtcCard key={d.id} dtc={d} />
            ))}
          </div>
        )}
      </section>
    );
  }),
);

function DtcCard({ dtc }: { dtc: DTCCode }) {
  const detected = dtc.last_detected_at ?? dtc.first_detected_at;
  const severity = dtc.severity?.toUpperCase() ?? "WARNING";

  return (
    <article className="rounded-xl border border-[var(--dash-border)] bg-[var(--surface-deep)]/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-lg font-semibold text-amber-400">{dtc.code}</p>
          <p className="mt-1 text-sm text-[var(--dash-text-secondary)]">{dtc.description}</p>
        </div>
        <SeverityBadge severity={severity} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--dash-muted)]">
        <span>Detected {formatDetected(detected)}</span>
        <button type="button" className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300">
          View details
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </article>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const isCritical = severity === "CRITICAL";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
        isCritical ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400",
      )}
    >
      {!isCritical && <AlertTriangle className="h-3 w-3" />}
      {severity}
    </span>
  );
}

function formatDetected(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return isToday ? `Today, ${time}` : d.toLocaleDateString();
}
