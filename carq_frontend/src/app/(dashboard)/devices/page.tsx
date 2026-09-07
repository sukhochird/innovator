"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DevicesHub } from "@/components/devices/DevicesHub";

export default function DevicesPage() {
  return (
    <DashboardLayout>
      <DevicesHub />
    </DashboardLayout>
  );
}
