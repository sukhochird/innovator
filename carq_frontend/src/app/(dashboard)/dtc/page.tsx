"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function DtcPage() {
  return (
    <DashboardLayout>
      <h2 className="text-xl font-semibold text-[var(--dash-text)]">Diagnostic Trouble Codes</h2>
      <p className="mt-2 text-[var(--dash-muted)]">DTC monitoring per vehicle on the vehicle dashboard.</p>
    </DashboardLayout>
  );
}
