"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { StatusBadge } from "@/components/dashboard/StatCard";
import { ui } from "@/lib/ui-classes";
import type { Vehicle } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

interface FleetTableProps {
  vehicles: Vehicle[];
  onVehicleClick?: (id: number) => void;
}

export function FleetTable({ vehicles, onVehicleClick }: FleetTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        v.plate_number.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        (v.driver_name || "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [vehicles, search, statusFilter]);

  return (
    <div className={cn(ui.card, "overflow-hidden")}>
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--dash-border)] p-4">
        <input
          type="search"
          placeholder="Search vehicles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={ui.inputSm}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={ui.inputSm}>
          <option value="ALL">All Status</option>
          <option value="MOVING">Moving</option>
          <option value="IDLE">Idle</option>
          <option value="STOPPED">Stopped</option>
          <option value="OFFLINE">Offline</option>
          <option value="ALERT">Alert</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className={ui.table}>
          <thead>
            <tr className={cn(ui.tableHead, "tracking-wider")}>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Plate</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Speed</th>
              <th className="px-4 py-3">RPM</th>
              <th className="px-4 py-3">Coolant</th>
              <th className="px-4 py-3">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => {
              const t = v.current_telemetry;
              return (
                <tr
                  key={v.id}
                  className={cn(ui.tableRowHover, "cursor-pointer")}
                  onClick={() => onVehicleClick?.(v.id)}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/vehicle/${v.id}`}
                      className="font-medium text-[var(--dash-text)] hover:text-emerald-500"
                    >
                      {v.make} {v.model}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-[var(--dash-text-secondary)]">{v.plate_number}</td>
                  <td className="px-4 py-3 text-[var(--dash-muted)]">{v.driver_name || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--dash-muted)]">{v.device_serial || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={v.status} online={t?.is_online} />
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-[var(--dash-text)]">
                    {t?.speed != null ? `${Math.round(t.speed)}` : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-[var(--dash-text)]">
                    {t?.rpm != null ? Math.round(t.rpm) : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-[var(--dash-text)]">
                    {t?.coolant_temperature != null ? `${Math.round(t.coolant_temperature)}°` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--dash-muted)]">
                    {formatRelativeTime(t?.timestamp)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-[var(--dash-muted)]">No vehicles found</div>
        )}
      </div>
    </div>
  );
}
