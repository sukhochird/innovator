"use client";

import { memo, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Battery,
  Gauge,
  LayoutGrid,
  List,
  MapPin,
  Radio,
  Search,
  Thermometer,
  Truck,
  User,
} from "lucide-react";

import { StatCard, StatusBadge } from "@/components/dashboard/StatCard";
import { FleetTable } from "@/components/fleet/FleetTable";
import { AiInsightCard } from "@/components/insights/AiInsightCard";
import { VehicleStatusBadge } from "@/components/vehicle/VehicleStatusBadge";
import { useWebSocket } from "@/hooks/useWebSocket";
import { generateVehiclesInsight } from "@/lib/ai-insights";
import { apiFetch } from "@/lib/api";
import { recomputeFleetStats } from "@/lib/map-utils";
import { useAuthStore } from "@/lib/auth-store";
import type { PaginatedResponse, Vehicle } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";
import { formatSecondsAgo } from "@/lib/vehicle-utils";

type ViewMode = "grid" | "list" | "table";
type StatusFilter = "ALL" | "MOVING" | "IDLE" | "STOPPED" | "OFFLINE" | "ALERT" | "NO_DEVICE";

const VEHICLES_QUERY_KEY = ["vehicles"];

function unwrapVehicles(data: PaginatedResponse<Vehicle> | Vehicle[] | undefined): Vehicle[] {
  if (!data) return [];
  return Array.isArray(data) ? data : (data.results ?? []);
}

function vehicleHealthPct(v: Vehicle): number {
  const tel = v.current_telemetry;
  const status = tel?.status ?? v.status;
  if (!v.device_serial) return 35;
  if (status === "OFFLINE") return 20;
  if (status === "ALERT") return 45;
  let score = 85;
  if (tel?.coolant_temperature != null && tel.coolant_temperature >= 100) score -= 25;
  if (tel?.battery_voltage != null && tel.battery_voltage < 11.8) score -= 20;
  if (status === "MOVING") score += 10;
  return Math.max(10, Math.min(100, score));
}

export function VehiclesHub() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>("grid");
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"plate" | "status" | "speed" | "updated">("updated");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: VEHICLES_QUERY_KEY,
    queryFn: () =>
      apiFetch<PaginatedResponse<Vehicle> | Vehicle[]>("/api/vehicles/?page_size=200"),
    refetchInterval: 30_000,
  });

  const vehicles = useMemo(() => unwrapVehicles(data), [data]);

  const onWsMessage = useCallback(
    (msg: { type: string; data?: Record<string, unknown>; vehicle_id?: number }) => {
      if (msg.type !== "telemetry.update" || !msg.data) return;
      const vid = msg.vehicle_id as number;
      const telemetry = msg.data as Vehicle["current_telemetry"];

      queryClient.setQueryData<PaginatedResponse<Vehicle> | Vehicle[]>(
        VEHICLES_QUERY_KEY,
        (prev) => {
          const list = unwrapVehicles(prev);
          const updated = list.map((v) =>
            v.id === vid
              ? {
                  ...v,
                  current_telemetry: telemetry,
                  status: (telemetry?.status as string) || v.status,
                }
              : v,
          );
          if (Array.isArray(prev)) return updated;
          if (prev && "results" in prev) return { ...prev, results: updated };
          return updated;
        },
      );
    },
    [queryClient],
  );

  useWebSocket(user?.role === "COMPANY_ADMIN" ? "/ws/company/fleet/" : null, onWsMessage);

  const stats = useMemo(() => {
    const fleet = recomputeFleetStats(vehicles);
    return {
      ...fleet,
      noDevice: vehicles.filter((v) => !v.device_serial).length,
    };
  }, [vehicles]);

  const insight = useMemo(() => generateVehiclesInsight(vehicles), [vehicles]);

  const filtered = useMemo(() => {
    let list = vehicles;
    if (filter === "NO_DEVICE") {
      list = list.filter((v) => !v.device_serial);
    } else if (filter !== "ALL") {
      list = list.filter((v) => (v.current_telemetry?.status ?? v.status) === filter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (v) =>
          v.plate_number.toLowerCase().includes(q) ||
          v.vin.toLowerCase().includes(q) ||
          v.nickname.toLowerCase().includes(q) ||
          `${v.make} ${v.model}`.toLowerCase().includes(q) ||
          (v.driver_name ?? "").toLowerCase().includes(q) ||
          (v.device_serial ?? "").toLowerCase().includes(q),
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === "plate") return a.plate_number.localeCompare(b.plate_number);
      if (sortBy === "status") {
        return (a.current_telemetry?.status ?? a.status).localeCompare(
          b.current_telemetry?.status ?? b.status,
        );
      }
      if (sortBy === "speed") {
        return (b.current_telemetry?.speed ?? -1) - (a.current_telemetry?.speed ?? -1);
      }
      const ta = a.current_telemetry?.timestamp ?? "";
      const tb = b.current_telemetry?.timestamp ?? "";
      return tb.localeCompare(ta);
    });
  }, [vehicles, filter, search, sortBy]);

  if (isError) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-8 text-center">
        <p className="text-[var(--dash-text)]">Unable to load vehicles.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-lg bg-[var(--dash-hover)] px-4 py-2 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--dash-text)]">Vehicle Fleet</h2>
          <p className="mt-1 text-sm text-[var(--dash-muted)]">
            Live status, telemetry, and assignment across your fleet
          </p>
        </div>
        <Link
          href="/fleet"
          className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 px-3 py-2 text-xs text-cyan-400 hover:bg-cyan-500/10"
        >
          <MapPin className="h-3.5 w-3.5" />
          Open Fleet Map
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Moving" value={stats.moving} accent="text-emerald-400" />
        <StatCard label="Idle" value={stats.idle} accent="text-amber-400" />
        <StatCard label="Offline" value={stats.offline} accent="text-zinc-500" />
        <StatCard label="Alerts" value={stats.alert} accent="text-red-400" />
        <StatCard label="No device" value={stats.noDevice} accent="text-orange-400" />
      </div>

      <AiInsightCard insight={insight} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dash-muted)]" />
          <input
            type="search"
            placeholder="Search plate, VIN, driver, device…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] py-2 pl-9 pr-3 text-sm text-[var(--dash-text)] placeholder:text-[var(--dash-muted)] focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-xs text-[var(--dash-text)]"
        >
          <option value="updated">Last updated</option>
          <option value="plate">Plate</option>
          <option value="status">Status</option>
          <option value="speed">Speed</option>
        </select>
        <div className="flex flex-wrap gap-1 rounded-lg border border-[var(--dash-border)] p-1">
          {(
            ["ALL", "MOVING", "IDLE", "STOPPED", "OFFLINE", "ALERT", "NO_DEVICE"] as StatusFilter[]
          ).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-medium uppercase transition",
                filter === f
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-[var(--dash-muted)] hover:text-[var(--dash-text)]",
              )}
            >
              {f === "NO_DEVICE" ? "No device" : f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg border border-[var(--dash-border)] p-1">
          <ViewToggle active={view === "grid"} onClick={() => setView("grid")} icon={LayoutGrid} />
          <ViewToggle active={view === "list"} onClick={() => setView("list")} icon={List} />
          <ViewToggle active={view === "table"} onClick={() => setView("table")} label="Table" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-[var(--skeleton)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState filter={filter} hasSearch={!!search.trim()} />
      ) : view === "table" ? (
        <FleetTable vehicles={filtered} onVehicleClick={(id) => router.push(`/vehicle/${id}`)} />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      ) : (
        <VehicleList vehicles={filtered} />
      )}
    </div>
  );
}

const VehicleCard = memo(function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const tel = vehicle.current_telemetry;
  const status = tel?.status ?? vehicle.status;
  const health = vehicleHealthPct(vehicle);

  return (
    <Link
      href={`/vehicle/${vehicle.id}`}
      className="group rounded-xl border border-[var(--dash-border)] bg-[var(--surface-elevated)] p-4 transition hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "rounded-xl p-2.5",
              status === "MOVING" && "bg-emerald-500/10 text-emerald-400",
              status === "ALERT" && "bg-red-500/10 text-red-400",
              status === "OFFLINE" && "bg-zinc-500/10 text-zinc-400",
              status === "IDLE" && "bg-amber-500/10 text-amber-400",
              !["MOVING", "ALERT", "OFFLINE", "IDLE"].includes(status) && "bg-cyan-500/10 text-cyan-400",
            )}
          >
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-[var(--dash-text)] group-hover:text-emerald-400">
              {vehicle.make} {vehicle.model}
            </p>
            <p className="font-mono text-sm text-cyan-400/90">{vehicle.plate_number}</p>
          </div>
        </div>
        <VehicleStatusBadge status={status} speed={tel?.speed} size="sm" />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[10px] text-[var(--dash-muted)]">
          <span>Fleet health</span>
          <span>{health}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-deep)]">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              health >= 70 ? "bg-emerald-500" : health >= 45 ? "bg-amber-500" : "bg-red-500",
            )}
            style={{ width: `${health}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-xs tabular-nums text-[var(--dash-text-secondary)]">
        <Metric icon={Gauge} label="Speed" value={tel?.speed != null ? `${Math.round(tel.speed)} km/h` : "—"} />
        <Metric icon={Thermometer} label="Coolant" value={tel?.coolant_temperature != null ? `${Math.round(tel.coolant_temperature)}°C` : "—"} />
        <Metric icon={Battery} label="Battery" value={tel?.battery_voltage != null ? `${tel.battery_voltage.toFixed(1)}V` : "—"} />
        <Metric icon={Radio} label="Device" value={vehicle.device_serial ? "Linked" : "None"} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--dash-border)] pt-3 text-xs text-[var(--dash-muted)]">
        <span className="inline-flex items-center gap-1">
          <User className="h-3 w-3" />
          {vehicle.driver_name || "No driver"}
        </span>
        <span>{formatSecondsAgo(tel?.timestamp)}</span>
      </div>
    </Link>
  );
});

const VehicleList = memo(function VehicleList({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <div className="space-y-2">
      {vehicles.map((v) => {
        const tel = v.current_telemetry;
        const status = tel?.status ?? v.status;
        const health = vehicleHealthPct(v);
        return (
          <Link
            key={v.id}
            href={`/vehicle/${v.id}`}
            className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--dash-border)] bg-[var(--surface-elevated)] px-4 py-3 transition hover:border-emerald-500/30"
          >
            <div className="min-w-[140px] flex-1">
              <p className="font-medium text-[var(--dash-text)]">
                {v.make} {v.model}
              </p>
              <p className="font-mono text-xs text-cyan-400">{v.plate_number}</p>
            </div>
            <StatusBadge status={status} online={tel?.is_online} />
            <div className="font-mono text-sm tabular-nums text-emerald-400">
              {tel?.speed != null ? `${Math.round(tel.speed)} km/h` : "—"}
            </div>
            <div className="hidden text-xs text-[var(--dash-muted)] sm:block">
              {v.driver_name || "—"} · {v.device_serial || "No device"}
            </div>
            <div className="hidden w-24 md:block">
              <div className="h-1.5 rounded-full bg-[var(--surface-deep)]">
                <div
                  className={cn("h-full rounded-full", health >= 70 ? "bg-emerald-500" : "bg-amber-500")}
                  style={{ width: `${health}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-[var(--dash-muted)]">
              {formatRelativeTime(tel?.timestamp)}
            </span>
          </Link>
        );
      })}
    </div>
  );
});

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-[var(--surface-deep)]/60 px-2 py-1.5">
      <p className="flex items-center gap-1 text-[10px] text-[var(--dash-muted)]">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="mt-0.5 text-[var(--dash-text)]">{value}</p>
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2 py-1.5 text-[10px] font-medium transition",
        active ? "bg-emerald-500/10 text-emerald-400" : "text-[var(--dash-muted)] hover:text-[var(--dash-text)]",
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : label}
    </button>
  );
}

function EmptyState({ filter, hasSearch }: { filter: StatusFilter; hasSearch: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--dash-border)] py-16 text-center">
      <Truck className="mx-auto h-10 w-10 text-[var(--dash-muted)]" />
      <p className="mt-3 text-[var(--dash-text)]">No vehicles found</p>
      <p className="mt-1 text-sm text-[var(--dash-muted)]">
        {hasSearch || filter !== "ALL"
          ? "Try adjusting search or filters."
          : "Add a vehicle to start monitoring your fleet."}
      </p>
    </div>
  );
}
