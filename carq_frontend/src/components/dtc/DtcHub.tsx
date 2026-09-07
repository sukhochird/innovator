"use client";

import { memo, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CircleCheck, Search, Stethoscope, Wrench } from "lucide-react";

import { AiInsightCard } from "@/components/insights/AiInsightCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { generateDtcInsight } from "@/lib/ai-insights";
import { enrichDtcDescription, getDtcKnowledge } from "@/lib/dtc-knowledge";
import { apiFetch } from "@/lib/api";
import type { FleetDTC, FleetDtcResponse } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

export function DtcHub() {
  const [search, setSearch] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["fleet-dtc", showResolved],
    queryFn: () =>
      apiFetch<FleetDtcResponse>(
        `/api/dashboard/dtc/?active=${showResolved ? "false" : "true"}`,
      ),
    refetchInterval: 30_000,
  });

  const codes = data?.codes ?? [];
  const summary = data?.summary ?? { total: 0, active: 0, critical: 0, warning: 0 };
  const insight = useMemo(() => generateDtcInsight(codes, summary), [codes, summary]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return codes;
    return codes.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.vehicle_plate.toLowerCase().includes(q) ||
        enrichDtcDescription(c.code, c.description).toLowerCase().includes(q),
    );
  }, [codes, search]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-[var(--dash-text)]">Diagnostics Intelligence</h2>
        <p className="mt-1 text-sm text-[var(--dash-muted)]">
          OBD-II trouble codes with AI repair guidance across your fleet
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Active codes" value={summary.active || summary.total} accent="text-orange-400" />
        <StatCard label="Critical" value={summary.critical} accent="text-red-400" />
        <StatCard label="Warning" value={summary.warning} accent="text-amber-400" />
        <StatCard label="Vehicles affected" value={new Set(codes.map((c) => c.vehicle_id)).size} />
      </div>

      <AiInsightCard insight={insight} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dash-muted)]" />
          <input
            type="search"
            placeholder="Search code or plate…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] py-2 pl-9 pr-3 text-sm text-[var(--dash-text)] placeholder:text-[var(--dash-muted)] focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowResolved((v) => !v)}
          className={cn(
            "rounded-lg border px-3 py-2 text-xs transition",
            showResolved
              ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
              : "border-[var(--dash-border)] text-[var(--dash-muted)]",
          )}
        >
          {showResolved ? "Showing history" : "Active only"}
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-[var(--skeleton)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--dash-border)] py-16 text-center">
          <CircleCheck className="mx-auto mb-3 h-10 w-10 text-emerald-500/60" />
          <p className="font-medium text-[var(--dash-text-secondary)]">No diagnostic codes</p>
          <p className="mt-1 text-sm text-[var(--dash-muted)]">All vehicles passed OBD scan</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((code) => (
            <DtcInsightCard key={code.id} dtc={code} />
          ))}
        </div>
      )}
    </div>
  );
}

const DtcInsightCard = memo(function DtcInsightCard({ dtc }: { dtc: FleetDTC }) {
  const knowledge = getDtcKnowledge(dtc.code);
  const title = enrichDtcDescription(dtc.code, dtc.description);

  return (
    <article className="flex flex-col rounded-xl border border-[var(--dash-border)] bg-[var(--surface-elevated)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-2xl font-bold tracking-tight text-amber-400">{dtc.code}</p>
          <p className="mt-1 text-sm font-medium text-[var(--dash-text)]">{title}</p>
        </div>
        <SeverityBadge severity={dtc.severity} active={dtc.is_active} />
      </div>

      {knowledge && (
        <div className="mt-4 space-y-2 rounded-lg border border-[var(--dash-border)] bg-[var(--surface-deep)]/60 p-3">
          <InsightRow icon={Stethoscope} label="Likely cause" text={knowledge.cause} />
          <InsightRow icon={Wrench} label="Recommended action" text={knowledge.action} highlight />
        </div>
      )}

      <div className="mt-4 flex items-end justify-between gap-3 border-t border-[var(--dash-border)] pt-4">
        <div className="text-xs text-[var(--dash-muted)]">
          Last seen {formatRelativeTime(dtc.last_detected_at)}
        </div>
        <Link
          href={`/vehicle/${dtc.vehicle_id}`}
          className="rounded-lg border border-[var(--dash-border)] px-3 py-1.5 text-xs hover:border-cyan-500/30"
        >
          <span className="font-mono text-cyan-400">{dtc.vehicle_plate}</span>
        </Link>
      </div>
    </article>
  );
});

function InsightRow({
  icon: Icon,
  label,
  text,
  highlight,
}: {
  icon: typeof Stethoscope;
  label: string;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex gap-2 text-xs">
      <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", highlight ? "text-emerald-400" : "text-[var(--dash-muted)]")} />
      <div>
        <p className="font-medium text-[var(--dash-muted)]">{label}</p>
        <p className={cn("mt-0.5 leading-relaxed", highlight ? "text-[var(--dash-text)]" : "text-[var(--dash-text-secondary)]")}>
          {text}
        </p>
      </div>
    </div>
  );
}

function SeverityBadge({ severity, active }: { severity: string; active: boolean }) {
  if (!active) {
    return (
      <span className="rounded-full bg-[var(--surface-deep)] px-2.5 py-1 text-[10px] uppercase text-[var(--dash-muted)]">
        Cleared
      </span>
    );
  }
  const isCritical = severity === "CRITICAL";
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase",
        isCritical ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400",
      )}
    >
      {severity}
    </span>
  );
}
