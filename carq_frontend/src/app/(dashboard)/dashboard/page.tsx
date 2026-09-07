"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CompanyDashboard } from "@/components/dashboard/CompanyDashboard";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <CompanyDashboard />
    </DashboardLayout>
  );
}
