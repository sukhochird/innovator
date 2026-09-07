"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { apiFetch } from "@/lib/api";
import type { Vehicle } from "@/lib/types";

export default function VehiclesPage() {
  const { data } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => apiFetch<{ results?: Vehicle[] } | Vehicle[]>("/api/vehicles/"),
  });

  const vehicles = Array.isArray(data) ? data : data?.results || [];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--dash-text)]">Vehicles</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <Link
              key={v.id}
              href={`/vehicle/${v.id}`}
              className="rounded-lg border border-[var(--dash-border)] bg-[var(--dash-card)] p-4 hover:border-emerald-500/50"
            >
              <p className="font-medium text-[var(--dash-text)]">{v.make} {v.model}</p>
              <p className="font-mono text-sm text-[var(--dash-muted)]">{v.plate_number}</p>
              <p className="mt-2 text-xs text-[var(--dash-muted)]">{v.status}</p>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
