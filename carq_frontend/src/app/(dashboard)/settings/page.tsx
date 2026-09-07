"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth-store";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  return (
    <DashboardLayout>
      <h2 className="text-xl font-semibold text-[var(--dash-text)]">Settings</h2>
      <div className="mt-4 rounded-lg border border-[var(--dash-border)] bg-[var(--dash-card)] p-4">
        <p className="text-sm text-[var(--dash-muted)]">Logged in as {user?.email}</p>
        <p className="text-sm text-[var(--dash-muted)]">Role: {user?.role}</p>
      </div>
    </DashboardLayout>
  );
}
