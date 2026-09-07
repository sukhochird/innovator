"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { VehiclesHub } from "@/components/vehicles/VehiclesHub";

export default function VehiclesPage() {
  return (
    <DashboardLayout>
      <VehiclesHub />
    </DashboardLayout>
  );
}
