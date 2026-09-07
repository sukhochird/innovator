"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { StatusBadge } from "@/components/dashboard/StatCard";
import type { FleetStatusFilter, Vehicle } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatSecondsAgo } from "@/lib/vehicle-utils";

interface FleetSidebarProps {
  vehicles: Vehicle[];
  selectedId: number | null;
  filter: FleetStatusFilter;
  search: string;
  onFilterChange: (f: FleetStatusFilter) => void;
  onSearchChange: (q: string) => void;
  onSelect: (id: number) => void;
}

const FILTERS: FleetStatusFilter[] = ["ALL", "MOVING", "IDLE", "STOPPED", "OFFLINE", "ALERT"];

export function FleetSidebar({
  vehicles,
  selectedId,
  filter,
  search,
  onFilterChange,
  onSearchChange,
  onSelect,
}: FleetSidebarProps) {
  const filtered = useMemo(() => {
    let list = vehicles;
    if (filter !== "ALL") {
      list = list.filter((v) => {
        const status = v.current_telemetry?.status ?? v.status;
        return status === filter;
      });
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (v) =>
          v.plate_number.toLowerCase().includes(q) ||
          v.vin.toLowerCase().includes(q) ||
          v.nickname.toLowerCase().includes(q) ||
          `${v.make} ${v.model}`.toLowerCase().includes(q) ||
          (v.device_serial ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [vehicles, filter, search]);

  return (
    <aside className="flex h-full flex-col border-r border-[var(--dash-border)] bg-[var(--dash-card)]">
      <div className="border-b border-[var(--dash-border)] p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--dash-muted)]">Fleet</p>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dash-muted)]" />
          <input
            type="search"
            placeholder="Search vehicle..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] py-2 pl-9 pr-3 text-sm text-[var(--dash-text)] placeholder:text-[var(--dash-muted)] focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFilterChange(f)}
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-medium transition",
                filter === f
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-[var(--dash-muted)] hover:bg-[var(--dash-hover)]",
              )}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="p-4 text-center text-sm text-[var(--dash-muted)]">No vehicles match filters</p>
        ) : (
          filtered.map((v) => (
            <VehicleListItem
              key={v.id}
              vehicle={v}
              selected={selectedId === v.id}
              onSelect={() => onSelect(v.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}

const VehicleListItem = memo(function VehicleListItem({
  vehicle,
  selected,
  onSelect,
}: {
  vehicle: Vehicle;
  selected: boolean;
  onSelect: () => void;
}) {
  const tel = vehicle.current_telemetry;
  const status = tel?.status ?? vehicle.status;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "mb-1 w-full rounded-lg border p-3 text-left transition",
        selected
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-transparent hover:border-[var(--dash-border)] hover:bg-[var(--dash-hover)]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-[var(--dash-text)]">
            {vehicle.make} {vehicle.model}
          </p>
          <p className="font-mono text-xs text-cyan-400/90">{vehicle.plate_number}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-mono tabular-nums text-emerald-400">
          {tel?.speed != null ? `${Math.round(tel.speed)} km/h` : "—"}
        </span>
        <span className="text-[var(--dash-muted)]">
          {formatSecondsAgo(tel?.timestamp)}
        </span>
      </div>
    </button>
  );
});

export function FleetSidebarFooterLink() {
  return (
    <Link
      href="/vehicles"
      className="block border-t border-[var(--dash-border)] p-3 text-center text-xs text-cyan-400 hover:underline"
    >
      Manage all vehicles →
    </Link>
  );
}
