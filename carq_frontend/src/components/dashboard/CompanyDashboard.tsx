"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Cpu,
  Map,
  RefreshCw,
  Truck,
  Wifi,
  WifiOff,
  Wrench,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/StatCard";
import { FleetTable } from "@/components/fleet/FleetTable";
import { AiInsightCard } from "@/components/insights/AiInsightCard";
import { useFleetDashboard } from "@/hooks/useFleetDashboard";
import { generateOperationsInsight } from "@/lib/ai-insights";
import { apiFetch } from "@/lib/api";
import type { FleetAlert, FleetAlertsResponse, FleetDtcResponse, Vehicle } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

const QUICK_LINKS = [
  { href: "/fleet", label: "Fleet Map", desc: "Live map & tracking", icon: Map, accent: "text-cyan-400" },
  { href: "/vehicles", label: "Vehicles", desc: "Fleet registry", icon: Truck, accent: "text-emerald-400" },
  { href: "/alerts", label: "Alerts", desc: "Anomalies & warnings", icon: AlertTriangle, accent: "text-red-400" },
  { href: "/dtc", label: "DTC", desc: "Engine diagnostics", icon: Wrench, accent: "text-orange-400" },
  { href: "/devices", label: "Devices", desc: "OBD hardware", icon: Cpu, accent: "text-violet-400" },
] as const;

export function CompanyDashboard() {
  const router = useRouter();
  const {
    companyName,
    vehicles,
    fleet,
    alerts,
    dtc,
    isLoading,
    isError,
    refetch,
    connected,
  } = useFleetDashboard();

  const { data: alertsData } = useQuery({
    queryKey: ["fleet-alerts"],
    queryFn: () => apiFetch<FleetAlertsResponse>("/api/dashboard/alerts/"),
    refetchInterval: 30_000,
  });

  const { data: dtcData } = useQuery({
    queryKey: ["fleet-dtc", true],
    queryFn: () => apiFetch<FleetDtcResponse>("/api/dashboard/dtc/?active=true"),
    refetchInterval: 30_000,
  });

  const insight = useMemo(
    () =>
      generateOperationsInsight({
        fleet: fleet ?? { total: 0, moving: 0, offline: 0, alert: 0 },
        alerts,
        dtc,
      }),
    [fleet, alerts, dtc],
  );

  const recentAlerts = (alertsData?.alerts ?? []).slice(0, 5);
  const recentDtc = (dtcData?.codes ?? []).slice(0, 4);

  const needsAttention = useMemo(() => {
    return vehicles
      .filter((v) => {
        const s = v.current_telemetry?.status ?? v.status;
        return s === "ALERT" || s === "OFFLINE" || !v.device_serial;
      })
      .slice(0, 6);
  }, [vehicles]);

  const statusBreakdown = useMemo(() => {
    if (!fleet) return [];
    return [
      { label: "Moving", value: fleet.moving, color: "bg-emerald-500", pct: pct(fleet.moving, fleet.total) },
      { label: "Idle", value: fleet.idle, color: "bg-amber-500", pct: pct(fleet.idle, fleet.total) },
      { label: "Stopped", value: fleet.stopped, color: "bg-zinc-500", pct: pct(fleet.stopped, fleet.total) },
      { label: "Offline", value: fleet.offline, color: "bg-zinc-600", pct: pct(fleet.offline, fleet.total) },
      { label: "Alert", value: fleet.alert, color: "bg-red-500", pct: pct(fleet.alert, fleet.total) },
    ];
  }, [fleet]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-72 animate-pulse rounded-lg bg-[var(--skeleton)]" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-[var(--skeleton)]" />
          ))}
        </div>
        <div className="h-32 animate-pulse rounded-xl bg-[var(--skeleton)]" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-xl bg-[var(--skeleton)]" />
          <div className="h-64 animate-pulse rounded-xl bg-[var(--skeleton)]" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-8 text-center">
        <p className="text-[var(--dash-text)]">Unable to load dashboard.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--dash-hover)] px-4 py-2 text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--dash-text)]">
            {companyName ? `${companyName} — Operations Overview` : "Operations Overview"}
          </h2>
          <p className="mt-1 text-sm text-[var(--dash-muted)]">
            Fleet health, alerts, and diagnostics at a glance
          </p>
        </div>
        <div className="flex items-center gap-3">
          {connected ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
              <Wifi className="h-3.5 w-3.5" /> Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-400">
              <WifiOff className="h-3.5 w-3.5" /> Reconnecting
            </span>
          )}
          <Link
            href="/fleet"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
          >
            <Map className="h-4 w-4" />
            Open Fleet Map
          </Link>
        </div>
      </header>

      {fleet && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total" value={fleet.total} />
          <StatCard label="Moving" value={fleet.moving} accent="text-emerald-400" />
          <StatCard label="Idle" value={fleet.idle} accent="text-amber-400" />
          <StatCard label="Offline" value={fleet.offline} accent="text-zinc-500" />
          <StatCard label="Critical Alerts" value={alerts.critical} accent="text-red-400" />
          <StatCard label="Active DTC" value={dtc.active} accent="text-orange-400" />
        </div>
      )}

      <AiInsightCard insight={insight} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-xl border border-[var(--dash-border)] bg-[var(--dash-card)] p-4 transition hover:border-emerald-500/30 hover:bg-[var(--dash-hover)]"
          >
            <link.icon className={cn("h-5 w-5", link.accent)} />
            <p className="mt-2 font-medium text-[var(--dash-text)] group-hover:text-emerald-400">
              {link.label}
            </p>
            <p className="text-xs text-[var(--dash-muted)]">{link.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-card)] p-5">
          <h3 className="text-sm font-semibold text-[var(--dash-text)]">Fleet Status</h3>
          <p className="mt-0.5 text-xs text-[var(--dash-muted)]">Live breakdown by activity</p>
          <div className="mt-4 space-y-3">
            {statusBreakdown.map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-[var(--dash-muted)]">{row.label}</span>
                  <span className="font-mono tabular-nums text-[var(--dash-text)]">
                    {row.value}
                    <span className="ml-1 text-[var(--dash-muted)]">({row.pct}%)</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-deep)]">
                  <div className={cn("h-full rounded-full transition-all", row.color)} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          {needsAttention.length > 0 && (
            <div className="mt-5 border-t border-[var(--dash-border)] pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-400">Needs attention</p>
              <ul className="mt-2 space-y-2">
                {needsAttention.map((v) => (
                  <AttentionRow key={v.id} vehicle={v} onClick={() => router.push(`/vehicle/${v.id}`)} />
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="space-y-4">
          <FeedPanel
            title="Recent Alerts"
            href="/alerts"
            empty="No active alerts — fleet is clear."
            count={alertsData?.summary.total}
            hasItems={recentAlerts.length > 0}
          >
            {recentAlerts.map((a) => (
              <AlertFeedItem key={a.id} alert={a} />
            ))}
          </FeedPanel>

          <FeedPanel
            title="Active DTC Codes"
            href="/dtc"
            empty="No active diagnostic codes."
            count={dtcData?.summary.active}
            hasItems={recentDtc.length > 0}
          >
            {recentDtc.map((c) => (
              <Link
                key={c.id}
                href={`/vehicle/${c.vehicle_id}`}
                className="flex items-center justify-between rounded-lg border border-[var(--dash-border)] px-3 py-2 text-sm transition hover:bg-[var(--dash-hover)]"
              >
                <div>
                  <span className="font-mono font-semibold text-orange-400">{c.code}</span>
                  <span className="ml-2 text-[var(--dash-muted)]">{c.vehicle_plate}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[var(--dash-muted)]" />
              </Link>
            ))}
          </FeedPanel>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-[var(--dash-muted)]">Vehicle Fleet</h3>
          <Link href="/vehicles" className="text-xs text-cyan-400 hover:underline">
            View all →
          </Link>
        </div>
        <FleetTable vehicles={vehicles} onVehicleClick={(id) => router.push(`/vehicle/${id}`)} />
      </section>
    </div>
  );
}

function pct(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

const AttentionRow = memo(function AttentionRow({
  vehicle,
  onClick,
}: {
  vehicle: Vehicle;
  onClick: () => void;
}) {
  const status = vehicle.current_telemetry?.status ?? vehicle.status;
  const reason =
    !vehicle.device_serial ? "No device" : status === "OFFLINE" ? "Offline" : "Alert";

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-[var(--dash-hover)]"
      >
        <span className="font-mono text-cyan-400">{vehicle.plate_number}</span>
        <span className="text-xs text-[var(--dash-muted)]">{reason}</span>
      </button>
    </li>
  );
});

const AlertFeedItem = memo(function AlertFeedItem({ alert }: { alert: FleetAlert }) {
  const severityClass =
    alert.severity === "CRITICAL"
      ? "text-red-400"
      : alert.severity === "WARNING"
        ? "text-amber-400"
        : "text-cyan-400";

  return (
    <Link
      href={`/vehicle/${alert.vehicle_id}`}
      className="block rounded-lg border border-[var(--dash-border)] px-3 py-2.5 transition hover:bg-[var(--dash-hover)]"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-[var(--dash-text)] line-clamp-2">{alert.message}</p>
        <span className={cn("shrink-0 text-[10px] font-medium uppercase", severityClass)}>
          {alert.severity}
        </span>
      </div>
      <p className="mt-1 text-xs text-[var(--dash-muted)]">
        {alert.vehicle_plate} · {formatRelativeTime(alert.created_at)}
      </p>
    </Link>
  );
});

function FeedPanel({
  title,
  href,
  empty,
  count,
  hasItems,
  children,
}: {
  title: string;
  href: string;
  empty: string;
  count?: number;
  hasItems: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-card)] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--dash-text)]">{title}</h3>
        <Link href={href} className="text-xs text-cyan-400 hover:underline">
          {count != null ? `${count} total →` : "View all →"}
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {hasItems ? children : (
          <p className="py-4 text-center text-sm text-[var(--dash-muted)]">{empty}</p>
        )}
      </div>
    </section>
  );
}
