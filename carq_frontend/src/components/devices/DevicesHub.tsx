"use client";

import { memo, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Cpu,
  LayoutGrid,
  List,
  Radio,
  Signal,
  SignalZero,
  Truck,
} from "lucide-react";

import { AiInsightCard } from "@/components/insights/AiInsightCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { generateDevicesInsight } from "@/lib/ai-insights";
import { apiFetch } from "@/lib/api";
import type { Device, PaginatedResponse } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

type ViewMode = "grid" | "list";
type StatusFilter = "ALL" | "ONLINE" | "OFFLINE" | "UNASSIGNED";

export function DevicesHub() {
  const [view, setView] = useState<ViewMode>("grid");
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: () => apiFetch<PaginatedResponse<Device> | Device[]>("/api/devices/"),
    refetchInterval: 30_000,
  });

  const devices = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : data.results ?? [];
  }, [data]);

  const stats = useMemo(
    () => ({
      total: devices.length,
      online: devices.filter((d) => d.is_online).length,
      offline: devices.filter((d) => !d.is_online && d.vehicle_id).length,
      unassigned: devices.filter((d) => !d.vehicle_id).length,
    }),
    [devices],
  );

  const insight = useMemo(() => generateDevicesInsight(devices), [devices]);

  const filtered = useMemo(() => {
    let list = devices;
    if (filter === "ONLINE") list = list.filter((d) => d.is_online);
    if (filter === "OFFLINE") list = list.filter((d) => !d.is_online && d.vehicle_id);
    if (filter === "UNASSIGNED") list = list.filter((d) => !d.vehicle_id);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (d) =>
          d.serial_number.toLowerCase().includes(q) ||
          (d.vehicle_plate ?? "").toLowerCase().includes(q) ||
          (d.terminal_phone ?? "").includes(q),
      );
    }
    return list;
  }, [devices, filter, search]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-[var(--dash-text)]">Device Fleet</h2>
        <p className="mt-1 text-sm text-[var(--dash-muted)]">
          OBD hardware health, connectivity, and assignment overview
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total devices" value={stats.total} />
        <StatCard label="Online" value={stats.online} accent="text-emerald-400" />
        <StatCard label="Offline" value={stats.offline} accent="text-red-400" />
        <StatCard label="Unassigned" value={stats.unassigned} accent="text-amber-400" />
      </div>

      <AiInsightCard insight={insight} />

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search serial, plate, JT808 phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--dash-text)] placeholder:text-[var(--dash-muted)] focus:border-emerald-500 focus:outline-none"
        />
        <div className="flex gap-1 rounded-lg border border-[var(--dash-border)] p-1">
          {(["ALL", "ONLINE", "OFFLINE", "UNASSIGNED"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[10px] font-medium uppercase transition",
                filter === f
                  ? "bg-cyan-500/10 text-cyan-400"
                  : "text-[var(--dash-muted)] hover:text-[var(--dash-text)]",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg border border-[var(--dash-border)] p-1">
          <ViewToggle active={view === "grid"} onClick={() => setView("grid")} icon={LayoutGrid} />
          <ViewToggle active={view === "list"} onClick={() => setView("list")} icon={List} />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl bg-[var(--skeleton)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--dash-border)] py-16 text-center text-[var(--dash-muted)]">
          No devices match your filters
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <DeviceCard key={d.id} device={d} />
          ))}
        </div>
      ) : (
        <DeviceList devices={filtered} />
      )}
    </div>
  );
}

const DeviceCard = memo(function DeviceCard({ device }: { device: Device }) {
  const healthPct = device.is_online ? 92 : device.vehicle_id ? 24 : 50;

  return (
    <article className="rounded-xl border border-[var(--dash-border)] bg-[var(--surface-elevated)] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "rounded-lg p-2",
              device.is_online ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-400",
            )}
          >
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <p className="font-mono text-sm font-semibold text-[var(--dash-text)]">{device.serial_number}</p>
            <p className="text-xs text-[var(--dash-muted)]">{device.model || "CARQ OBD"}</p>
          </div>
        </div>
        <StatusDot online={device.is_online} />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[10px] text-[var(--dash-muted)]">
          <span>Signal health</span>
          <span>{healthPct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-deep)]">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              device.is_online ? "bg-emerald-500" : "bg-zinc-600",
            )}
            style={{ width: `${healthPct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-1.5 text-xs text-[var(--dash-muted)]">
        <Row icon={Truck} label="Vehicle" value={device.vehicle_plate ?? "Unassigned"} />
        <Row icon={Radio} label="JT808" value={device.terminal_phone ?? "—"} mono />
        <Row
          icon={device.is_online ? Signal : SignalZero}
          label="Last seen"
          value={device.last_seen_at ? formatRelativeTime(device.last_seen_at) : "Never"}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--dash-border)] pt-3">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
            device.status === "ACTIVE"
              ? "bg-emerald-500/10 text-emerald-400"
              : device.status === "BLOCKED"
                ? "bg-red-500/10 text-red-400"
                : "bg-[var(--surface-deep)] text-[var(--dash-muted)]",
          )}
        >
          {device.status}
        </span>
        {device.vehicle_id && (
          <Link
            href={`/vehicle/${device.vehicle_id}`}
            className="text-xs text-cyan-400 hover:text-cyan-300"
          >
            Open vehicle →
          </Link>
        )}
      </div>
    </article>
  );
});

function DeviceList({ devices }: { devices: Device[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--dash-border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--dash-border)] bg-[var(--surface-deep)] text-left text-xs uppercase text-[var(--dash-muted)]">
            <th className="px-4 py-3">Device</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Vehicle</th>
            <th className="px-4 py-3">JT808 Phone</th>
            <th className="px-4 py-3">Last seen</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((d) => (
            <tr key={d.id} className="border-b border-[var(--dash-border)]/50 hover:bg-[var(--dash-hover)]">
              <td className="px-4 py-3 font-mono text-[var(--dash-text)]">{d.serial_number}</td>
              <td className="px-4 py-3">
                <span className={d.is_online ? "text-emerald-400" : "text-[var(--dash-muted)]"}>
                  {d.is_online ? "● Online" : "○ Offline"}
                </span>
              </td>
              <td className="px-4 py-3">
                {d.vehicle_id ? (
                  <Link href={`/vehicle/${d.vehicle_id}`} className="text-cyan-400 hover:underline">
                    {d.vehicle_plate}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 font-mono text-xs">{d.terminal_phone ?? "—"}</td>
              <td className="px-4 py-3 text-xs text-[var(--dash-muted)]">
                {d.last_seen_at ? formatRelativeTime(d.last_seen_at) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Truck;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3 w-3 shrink-0" />
      <span>{label}:</span>
      <span className={cn("truncate text-[var(--dash-text-secondary)]", mono && "font-mono")}>
        {value}
      </span>
    </div>
  );
}

function StatusDot({ online }: { online: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-[10px] uppercase">
      <span className={cn("h-2 w-2 rounded-full", online ? "animate-pulse bg-emerald-400" : "bg-zinc-600")} />
      {online ? "Live" : "Offline"}
    </span>
  );
}

function ViewToggle({
  active,
  onClick,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof LayoutGrid;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md p-1.5 transition",
        active ? "bg-cyan-500/10 text-cyan-400" : "text-[var(--dash-muted)]",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
