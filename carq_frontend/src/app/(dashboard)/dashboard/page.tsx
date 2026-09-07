"use client";

import { useRouter } from "next/navigation";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FleetCommandCenter } from "@/components/fleet-command/FleetCommandCenter";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <DashboardLayout>
      <FleetCommandCenter
        showTableLink={false}
        showFleetTable
        onVehicleNavigate={(id) => router.push(`/vehicle/${id}`)}
      />
    </DashboardLayout>
  );
}
