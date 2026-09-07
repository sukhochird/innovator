"use client";

import { useCallback, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useCompanyName, DASHBOARD_QUERY_KEY } from "@/hooks/useCompanyName";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiFetch } from "@/lib/api";
import { recomputeFleetStats } from "@/lib/map-utils";
import { useAuthStore } from "@/lib/auth-store";
import type { CompanyDashboard, TelemetryData, Vehicle } from "@/lib/types";

const MAX_TRAIL_POINTS = 200;

function appendTrailPoint(prev: [number, number][], point: TelemetryData): [number, number][] {
  const lat = point.latitude;
  const lng = point.longitude;
  if (lat == null || lng == null) return prev;
  const coord: [number, number] = [lng, lat];
  const head = prev[prev.length - 1];
  if (head && head[0] === coord[0] && head[1] === coord[1]) return prev;
  return [...prev, coord].slice(-MAX_TRAIL_POINTS);
}

export function useFleetDashboard() {
  const user = useAuthStore((s) => s.user);
  const companyName = useCompanyName();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [trackingId, setTrackingId] = useState<number | null>(null);
  const trailsRef = useRef<Map<number, [number, number][]>>(new Map());
  const [, bumpTrail] = useState(0);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: [DASHBOARD_QUERY_KEY, user?.role],
    queryFn: async () => {
      if (user?.role === "SUPER_ADMIN") {
        router.replace("/companies");
        return null;
      }
      if (user?.role === "DRIVER") {
        const driverData = await apiFetch<{ vehicle: Vehicle | null }>("/api/dashboard/driver/");
        if (driverData.vehicle) router.replace(`/vehicle/${driverData.vehicle.id}`);
        return null;
      }
      return apiFetch<CompanyDashboard>("/api/dashboard/company/");
    },
    enabled: !!user,
  });

  const onWsMessage = useCallback(
    (msg: { type: string; data?: Record<string, unknown>; vehicle_id?: number }) => {
      if (msg.type !== "telemetry.update" || !msg.data) return;
      const vid = msg.vehicle_id as number;
      const telemetry = msg.data as Vehicle["current_telemetry"];

      if (trackingId === vid || selectedId === vid) {
        const prev = trailsRef.current.get(vid) ?? [];
        trailsRef.current.set(vid, appendTrailPoint(prev, telemetry as TelemetryData));
        bumpTrail((n) => n + 1);
      }

      queryClient.setQueryData<CompanyDashboard | null>(
        [DASHBOARD_QUERY_KEY, user?.role],
        (prev) => {
          if (!prev) return prev;
          const vehicles = prev.vehicles.map((v) =>
            v.id === vid
              ? {
                  ...v,
                  current_telemetry: telemetry,
                  status: (telemetry?.status as string) || v.status,
                }
              : v,
          );
          return {
            ...prev,
            vehicles,
            fleet: recomputeFleetStats(vehicles),
          };
        },
      );
    },
    [queryClient, user?.role, trackingId, selectedId],
  );

  const { connected } = useWebSocket(
    user?.role === "COMPANY_ADMIN" ? "/ws/company/fleet/" : null,
    onWsMessage,
  );

  const vehicles = data?.vehicles ?? [];
  const fleet = data?.fleet ?? null;
  const alerts = data?.alerts ?? { critical: 0, warning: 0 };
  const dtc = data?.dtc ?? { active: 0 };

  const selectedVehicle = vehicles.find((v) => v.id === selectedId) ?? null;
  const trackingVehicle = vehicles.find((v) => v.id === trackingId) ?? null;

  const getTrail = useCallback((vehicleId: number) => {
    return trailsRef.current.get(vehicleId) ?? [];
  }, []);

  const startTracking = useCallback(
    (vehicleId: number) => {
      setTrackingId(vehicleId);
      setSelectedId(vehicleId);
      trailsRef.current.set(vehicleId, []);
      const v = vehicles.find((x) => x.id === vehicleId);
      if (v?.current_telemetry) {
        trailsRef.current.set(
          vehicleId,
          appendTrailPoint([], v.current_telemetry as TelemetryData),
        );
      }
      bumpTrail((n) => n + 1);
    },
    [vehicles],
  );

  const stopTracking = useCallback(() => {
    setTrackingId(null);
  }, []);

  return {
    user,
    companyName,
    data,
    vehicles,
    fleet,
    alerts,
    dtc,
    isLoading: (isLoading || isFetching) && !data,
    isError,
    refetch,
    connected,
    selectedId,
    setSelectedId,
    selectedVehicle,
    trackingId,
    trackingVehicle,
    startTracking,
    stopTracking,
    getTrail,
  };
}
