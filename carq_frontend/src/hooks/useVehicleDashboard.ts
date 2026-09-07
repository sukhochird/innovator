"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useWebSocket } from "@/hooks/useWebSocket";
import { apiFetch } from "@/lib/api";
import type { TelemetryData, VehicleDashboard } from "@/lib/types";
import {
  computeHealthScore,
  deriveConnectionState,
  type ConnectionState,
  type HealthLevel,
} from "@/lib/vehicle-utils";

function appendRoutePoint(prev: TelemetryData[], point: TelemetryData): TelemetryData[] {
  if (point.latitude == null || point.longitude == null) return prev;
  const head = prev[0];
  if (
    head &&
    head.latitude === point.latitude &&
    head.longitude === point.longitude &&
    head.timestamp === point.timestamp
  ) {
    return prev;
  }
  return [point, ...prev].slice(0, 500);
}

export function useVehicleDashboard(vehicleId: number) {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [routeHistory, setRouteHistory] = useState<TelemetryData[]>([]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["vehicle-dashboard", vehicleId],
    queryFn: () => apiFetch<VehicleDashboard>(`/api/dashboard/vehicles/${vehicleId}/`),
    enabled: !!vehicleId,
  });

  useEffect(() => {
    if (data?.telemetry_history?.length) {
      setRouteHistory(data.telemetry_history);
    }
  }, [data?.telemetry_history]);

  const onWsMessage = useCallback((msg: { type: string; data?: TelemetryData }) => {
    if (msg.type === "telemetry.update" && msg.data) {
      setTelemetry(msg.data);
      setRouteHistory((prev) => appendRoutePoint(prev, msg.data!));
    }
  }, []);

  const { connected: wsConnected } = useWebSocket(
    vehicleId ? `/ws/vehicles/${vehicleId}/` : null,
    onWsMessage,
  );

  const current = useMemo(
    () => telemetry ?? data?.current ?? data?.vehicle?.current_telemetry ?? null,
    [telemetry, data],
  );

  const vehicleStatus = current?.status ?? data?.vehicle?.status ?? "OFFLINE";
  const isOnline = vehicleStatus !== "OFFLINE" && current?.is_online !== false;

  const connectionState: ConnectionState = deriveConnectionState(
    wsConnected,
    vehicleStatus,
    current?.is_online,
  );

  const health = useMemo(
    () =>
      computeHealthScore({
        alerts: data?.alerts ?? [],
        dtc: data?.dtc ?? [],
        isOnline,
        coolant: current?.coolant_temperature,
        battery: current?.battery_voltage,
      }),
    [data?.alerts, data?.dtc, isOnline, current?.coolant_temperature, current?.battery_voltage],
  );

  return {
    data,
    current,
    routeHistory,
    isLoading,
    isError,
    wsConnected,
    connectionState,
    vehicleStatus,
    isOnline,
    health,
  };
}

export type VehicleDashboardState = ReturnType<typeof useVehicleDashboard> & {
  health: { score: number; level: HealthLevel };
};
