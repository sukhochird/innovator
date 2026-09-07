"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AlertsPage() {
  return (
    <DashboardLayout>
      <h2 className="text-xl font-semibold text-[var(--dash-text)]">Alerts</h2>
      <p className="mt-2 text-[var(--dash-muted)]">View alerts from the fleet dashboard or vehicle detail pages.</p>
    </DashboardLayout>
  );
}
