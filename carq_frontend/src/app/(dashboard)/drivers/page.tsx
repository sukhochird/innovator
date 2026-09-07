"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function DriversPage() {
  return (
    <DashboardLayout>
      <h2 className="text-xl font-semibold text-[var(--dash-text)]">Drivers</h2>
      <p className="mt-2 text-[var(--dash-muted)]">Driver management — assign via vehicle detail.</p>
    </DashboardLayout>
  );
}
