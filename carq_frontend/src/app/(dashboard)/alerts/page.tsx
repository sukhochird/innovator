"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AlertsHub } from "@/components/alerts/AlertsHub";

export default function AlertsPage() {
  return (
    <DashboardLayout>
      <AlertsHub />
    </DashboardLayout>
  );
}
