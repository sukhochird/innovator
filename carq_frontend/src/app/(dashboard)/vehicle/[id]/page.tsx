"use client";

import { useParams } from "next/navigation";

import { VehicleDetailPage } from "@/components/vehicle/VehicleDetailPage";

export default function VehiclePage() {
  const params = useParams();
  const vehicleId = Number(params.id);

  return <VehicleDetailPage vehicleId={vehicleId} />;
}
