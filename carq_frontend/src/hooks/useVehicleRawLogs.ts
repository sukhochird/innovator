"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { PaginatedResponse, TelemetryRawLog } from "@/lib/types";

export function useVehicleRawLogs(vehicleId: number) {
  return useQuery({
    queryKey: ["vehicle-raw-logs", vehicleId],
    queryFn: () =>
      apiFetch<PaginatedResponse<TelemetryRawLog>>(
        `/api/vehicles/${vehicleId}/raw-logs/?page_size=50`,
      ),
    enabled: vehicleId > 0,
    refetchInterval: 15_000,
  });
}
