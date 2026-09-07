"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { StatCard } from "@/components/dashboard/StatCard";
import { FleetTable } from "@/components/fleet/FleetTable";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FleetMap } from "@/components/maps/FleetMap";
import { useCompanyName } from "@/hooks/useCompanyName";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { CompanyDashboard, Vehicle } from "@/lib/types";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const companyName = useCompanyName();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fleet, setFleet] = useState<CompanyDashboard["fleet"] | null>(null);
  const [alerts, setAlerts] = useState({ critical: 0, warning: 0 });
  const [dtc, setDtc] = useState({ active: 0 });

  const endpoint =
    user?.role === "SUPER_ADMIN"
      ? "/api/dashboard/admin/"
      : user?.role === "DRIVER"
        ? "/api/dashboard/driver/"
        : "/api/dashboard/company/";

  const { isLoading } = useQuery({
    queryKey: ["dashboard", user?.role],
    queryFn: () => apiFetch<CompanyDashboard>(endpoint),
    enabled: !!user && user.role !== "SUPER_ADMIN" && user.role !== "DRIVER",
    select: (data) => data,
  });

  useQuery({
    queryKey: ["dashboard-init", user?.role],
    queryFn: async () => {
      if (user?.role === "SUPER_ADMIN") {
        router.push("/companies");
        return null;
      }
      if (user?.role === "DRIVER") {
        const data = await apiFetch<{ vehicle: Vehicle | null }>("/api/dashboard/driver/");
        if (data.vehicle) router.push(`/vehicle/${data.vehicle.id}`);
        return data;
      }
      const data = await apiFetch<CompanyDashboard>("/api/dashboard/company/");
      setVehicles(data.vehicles);
      setFleet(data.fleet);
      setAlerts(data.alerts);
      setDtc(data.dtc);
      return data;
    },
    enabled: !!user,
  });

  const onWsMessage = useCallback((msg: { type: string; data?: Record<string, unknown>; vehicle_id?: number }) => {
    if (msg.type !== "telemetry.update" || !msg.data) return;
    const vid = msg.vehicle_id as number;
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vid
          ? { ...v, current_telemetry: msg.data as Vehicle["current_telemetry"], status: (msg.data?.status as string) || v.status }
          : v,
      ),
    );
  }, []);

  useWebSocket(user?.role === "COMPANY_ADMIN" ? "/ws/company/fleet/" : null, onWsMessage);

  if (isLoading && !fleet) {
    return (
      <DashboardLayout>
        <div className="grid animate-pulse gap-4">
          <div className="h-24 rounded-lg bg-[var(--skeleton)]" />
          <div className="h-96 rounded-lg bg-[var(--skeleton)]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--dash-text)]">
            {companyName ? `${companyName} — Fleet Overview` : "Fleet Overview"}
          </h2>
          <p className="text-sm text-[var(--dash-muted)]">Real-time fleet status and monitoring</p>
        </div>

        {fleet && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total" value={fleet.total} />
            <StatCard label="Online" value={fleet.online} accent="text-emerald-400" />
            <StatCard label="Moving" value={fleet.moving} accent="text-blue-400" />
            <StatCard label="Idle" value={fleet.idle} accent="text-amber-400" />
            <StatCard label="Critical Alerts" value={alerts.critical} accent="text-red-400" />
            <StatCard label="Active DTC" value={dtc.active} accent="text-orange-400" />
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <FleetMap
              vehicles={vehicles}
              height="420px"
              onSelect={(id) => router.push(`/vehicle/${id}`)}
            />
          </div>
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-medium text-[var(--dash-muted)]">Vehicle Status</h3>
            <div className="max-h-[420px] space-y-2 overflow-y-auto">
              {vehicles.slice(0, 8).map((v) => (
                <button
                  key={v.id}
                  onClick={() => router.push(`/vehicle/${v.id}`)}
                  className="flex w-full items-center justify-between rounded-lg border border-[var(--dash-card-border)] bg-[var(--dash-card)] p-3 text-left hover:border-cyan-500/30"
                >
                  <div>
                    <p className="font-medium text-[var(--dash-text)]">{v.plate_number}</p>
                    <p className="text-xs text-[var(--dash-muted)]">{v.make} {v.model}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg tabular-nums text-emerald-400">
                      {v.current_telemetry?.speed != null ? Math.round(v.current_telemetry.speed) : "—"}
                    </p>
                    <p className="text-xs text-[var(--dash-muted)]">km/h</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-[var(--dash-muted)]">Vehicle Fleet</h3>
          <FleetTable
            vehicles={vehicles}
            onVehicleClick={(id) => router.push(`/vehicle/${id}`)}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
