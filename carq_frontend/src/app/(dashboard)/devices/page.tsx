"use client";

import { useQuery } from "@tanstack/react-query";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { apiFetch } from "@/lib/api";
import type { Device } from "@/lib/types";

export default function DevicesPage() {
  const { data } = useQuery({
    queryKey: ["devices"],
    queryFn: () => apiFetch<{ results?: Device[] } | Device[]>("/api/devices/"),
  });

  const devices = Array.isArray(data) ? data : data?.results || [];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--dash-text)]">Devices</h2>
        <div className="rounded-lg border border-[var(--dash-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--dash-border)] text-left text-xs uppercase text-[var(--dash-muted)]">
                <th className="px-4 py-3">Serial</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Online</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id} className="border-b border-[var(--dash-border)]/50">
                  <td className="px-4 py-3 font-mono">{d.serial_number}</td>
                  <td className="px-4 py-3">{d.model}</td>
                  <td className="px-4 py-3">{d.status}</td>
                  <td className="px-4 py-3">{d.vehicle_plate || "—"}</td>
                  <td className="px-4 py-3">{d.is_online ? "● Online" : "○ Offline"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
