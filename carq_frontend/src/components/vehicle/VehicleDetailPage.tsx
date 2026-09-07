"use client";

import { useCallback, useRef } from "react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useVehicleDashboard } from "@/hooks/useVehicleDashboard";

import { ActivityTimeline } from "./ActivityTimeline";
import { AlertTimeline } from "./AlertTimeline";
import { DtcPanel } from "./DtcPanel";
import { LiveMap } from "./LiveMap";
import { QuickActions } from "./QuickActions";
import { RawLogPanel } from "./RawLogPanel";
import { TelemetryChart } from "./TelemetryChart";
import { VehicleDetailSkeleton } from "./VehicleDetailSkeleton";
import { VehicleHeader } from "./VehicleHeader";
import { VehicleHealthPanel } from "./VehicleHealthPanel";
import { VehicleKpiBar } from "./VehicleKpiBar";
import { VehicleStatusPanel } from "./VehicleStatusPanel";

interface VehicleDetailPageProps {
  vehicleId: number;
}

export function VehicleDetailPage({ vehicleId }: VehicleDetailPageProps) {
  const {
    data,
    current,
    routeHistory,
    isLoading,
    connectionState,
    vehicleStatus,
    health,
  } = useVehicleDashboard(vehicleId);

  const mapRef = useRef<HTMLDivElement>(null);
  const telemetryRef = useRef<HTMLDivElement>(null);
  const dtcRef = useRef<HTMLElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);
  const tripsRef = useRef<HTMLDivElement>(null);
  const rawLogsRef = useRef<HTMLDivElement>(null);

  const scrollTo = useCallback(
    (section: "map" | "telemetry" | "dtc" | "alerts" | "trips" | "rawlogs") => {
      const refs = {
        map: mapRef,
        telemetry: telemetryRef,
        dtc: dtcRef,
        alerts: alertsRef,
        trips: tripsRef,
        rawlogs: rawLogsRef,
      };
      refs[section].current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [],
  );

  if (isLoading || !data) {
    return (
      <DashboardLayout>
        <VehicleDetailSkeleton />
      </DashboardLayout>
    );
  }

  const vehicle = data.vehicle;
  const hasCriticalIssues =
    health.level === "CRITICAL" ||
    data.alerts.some((a) => a.severity === "CRITICAL" && !a.resolved_at) ||
    data.dtc.some((d) => d.is_active && d.severity === "CRITICAL");

  return (
    <DashboardLayout>
      <div className="space-y-4 pb-10">
        <VehicleHeader
          vehicle={vehicle}
          connectionState={connectionState}
          current={current}
          vehicleStatus={vehicleStatus}
          health={health}
          hasCriticalIssues={hasCriticalIssues}
        />

        <VehicleKpiBar current={current} />

        <VehicleStatusPanel
          vehicle={vehicle}
          current={current}
          connectionState={connectionState}
          status={vehicleStatus}
          embedded
        />

        <div ref={mapRef}>
          <LiveMap
            vehicle={vehicle}
            current={current}
            history={routeHistory.length ? routeHistory : (data.telemetry_history ?? [])}
            connectionState={connectionState}
            vehicleStatus={vehicleStatus}
          />
        </div>

        <QuickActions onScrollTo={scrollTo} />

        <div className="grid gap-4 lg:grid-cols-2">
          <div ref={telemetryRef}>
            <TelemetryChart
              history={data.telemetry_history ?? []}
              live={connectionState === "live"}
            />
          </div>
          <VehicleHealthPanel
            current={current}
            dtc={data.dtc}
            onDiagnosticsClick={() => scrollTo("dtc")}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <DtcPanel ref={dtcRef} dtc={data.dtc} />
          <div ref={alertsRef}>
            <AlertTimeline alerts={data.alerts} />
          </div>
        </div>

        <div ref={tripsRef}>
          <ActivityTimeline
            alerts={data.alerts}
            dtc={data.dtc}
            history={data.telemetry_history ?? []}
          />
        </div>

        <div ref={rawLogsRef}>
          <RawLogPanel vehicleId={vehicleId} deviceSerial={vehicle.device_serial} />
        </div>
      </div>
    </DashboardLayout>
  );
}
