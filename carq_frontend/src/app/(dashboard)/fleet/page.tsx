"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FleetCommandCenter } from "@/components/fleet-command/FleetCommandCenter";

export default function FleetPage() {
  return (
    <DashboardLayout>
      <FleetCommandCenter fullHeight showTableLink />
    </DashboardLayout>
  );
}
