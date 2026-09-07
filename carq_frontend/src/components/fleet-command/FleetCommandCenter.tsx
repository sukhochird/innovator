"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Crosshair,
  Layers,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/StatCard";
import { FleetTable } from "@/components/fleet/FleetTable";
import { GeofenceManager, useGeofencesQuery } from "@/components/fleet-command/GeofenceManager";
import { FleetSidebar } from "@/components/fleet-command/FleetSidebar";
import {
  TrackHistoryPanel,
  TrackStatisticsBar,
} from "@/components/fleet-command/TrackHistoryPanel";
import { TrackPlayback } from "@/components/fleet-command/TrackPlayback";
import { VehicleMapPopup, VehicleTrackingPanel } from "@/components/fleet-command/VehiclePanels";
import { FleetMap, type DrawMode, type FleetMapHandle } from "@/components/maps/FleetMap";
import { MapViewControl } from "@/components/maps/MapViewControl";
import { useFleetDashboard } from "@/hooks/useFleetDashboard";
import { useMapView } from "@/hooks/useMapView";
import { apiFetch } from "@/lib/api";
import { coordsFromTelemetry, normalizeRectangleBounds, vehicleCoords } from "@/lib/map-utils";
import type {
  FleetMapMode,
  FleetStatusFilter,
  GeofenceGeometry,
  GeofenceType,
  TelemetryData,
  TrackHistoryResponse,
  TrackStatistics,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface FleetCommandCenterProps {
  fullHeight?: boolean;
  showTableLink?: boolean;
  showFleetTable?: boolean;
  onVehicleNavigate?: (id: number) => void;
}

export function FleetCommandCenter({
  fullHeight = false,
  showTableLink = true,
  showFleetTable = false,
  onVehicleNavigate,
}: FleetCommandCenterProps) {
  const mapRef = useRef<FleetMapHandle>(null);
  const { mapView, setMapView } = useMapView();
  const {
    companyName,
    vehicles,
    fleet,
    alerts,
    isLoading,
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
  } = useFleetDashboard();

  const [filter, setFilter] = useState<FleetStatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [showGeofences, setShowGeofences] = useState(true);
  const [mapMode, setMapMode] = useState<FleetMapMode>("live");
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const [pendingGeometry, setPendingGeometry] = useState<{
    geometry: GeofenceGeometry;
    type: GeofenceType;
  } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPoints, setHistoryPoints] = useState<TelemetryData[]>([]);
  const [historyStats, setHistoryStats] = useState<TrackStatistics | null>(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [playbackCoord, setPlaybackCoord] = useState<[number, number] | null>(null);
  const [playbackHeading, setPlaybackHeading] = useState(0);

  const { data: geofences = [] } = useGeofencesQuery(true);
  const geofenceList = Array.isArray(geofences) ? geofences : [];

  const filteredVehicles = useMemo(() => {
    let list = vehicles;
    if (filter !== "ALL") {
      list = list.filter((v) => (v.current_telemetry?.status ?? v.status) === filter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (v) =>
          v.plate_number.toLowerCase().includes(q) ||
          v.vin.toLowerCase().includes(q) ||
          (v.device_serial ?? "").toLowerCase().includes(q) ||
          `${v.make} ${v.model}`.toLowerCase().includes(q),
      );
    }
    return list;
  }, [vehicles, filter, search]);

  const trailCoords = trackingId ? getTrail(trackingId) : [];
  const historyCoords = mapMode === "history" ? coordsFromTelemetry(historyPoints) : [];

  const handleSelect = useCallback(
    (id: number) => {
      setSelectedId(id);
      const v = vehicles.find((x) => x.id === id);
      const coords = v ? vehicleCoords(v) : null;
      if (coords) {
        mapRef.current?.focusAt(coords[0], coords[1]);
      } else {
        mapRef.current?.focusVehicle(id);
      }
    },
    [vehicles, setSelectedId],
  );

  const handleDrawComplete = useCallback(
    (geometry: Record<string, unknown>, type: DrawMode) => {
      if (!type) return;
      let geom = geometry as GeofenceGeometry;
      if (type === "RECTANGLE" && geom.bounds?.length === 2) {
        const [[a0, a1], [b0, b1]] = geom.bounds;
        geom = { bounds: normalizeRectangleBounds([a0, a1], [b0, b1]) };
      }
      setPendingGeometry({ geometry: geom, type });
      setDrawMode(null);
    },
    [],
  );

  const handleLoadHistory = useCallback(
    async (start: string, end: string) => {
      if (!selectedId) return;
      setHistoryLoading(true);
      try {
        const res = await apiFetch<TrackHistoryResponse>(
          `/api/vehicles/${selectedId}/track-history/?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
        );
        setHistoryPoints(res.points);
        setHistoryStats(res.stats);
        setMapMode("history");
        setShowHistoryPanel(false);
      } catch {
        setHistoryPoints([]);
        setHistoryStats(null);
      } finally {
        setHistoryLoading(false);
      }
    },
    [selectedId],
  );

  const handlePlaybackPosition = useCallback(
    (coord: [number, number] | null, heading: number) => {
      setPlaybackCoord(coord);
      setPlaybackHeading(heading);
    },
    [],
  );

  const exitHistoryMode = useCallback(() => {
    setMapMode("live");
    setHistoryPoints([]);
    setHistoryStats(null);
    setPlaybackCoord(null);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-[var(--skeleton)]" />
        <div className="grid grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-[var(--skeleton)]" />
          ))}
        </div>
        <div className={cn("animate-pulse rounded-xl bg-[var(--skeleton)]", fullHeight ? "h-[calc(100vh-12rem)]" : "h-[520px]")} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-8 text-center">
        <p className="text-[var(--dash-text)]">Unable to load fleet data.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--dash-hover)] px-4 py-2 text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--dash-border)] p-12 text-center">
        <p className="text-[var(--dash-text)]">No vehicles available</p>
        <p className="mt-1 text-sm text-[var(--dash-muted)]">
          Add a vehicle to start monitoring your fleet.
        </p>
        <Link href="/vehicles" className="mt-4 inline-block text-sm text-cyan-400 hover:underline">
          Go to Vehicles →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--dash-text)]">
            {companyName ? `${companyName} — Fleet Command Center` : "Fleet Command Center"}
          </h2>
          <p className="mt-0.5 text-sm text-[var(--dash-muted)]">
            {fleet?.total ?? 0} Vehicles · {fleet?.moving ?? 0} Moving · {fleet?.idle ?? 0} Idle ·{" "}
            {fleet?.stopped ?? 0} Stopped · {fleet?.offline ?? 0} Offline
            {(fleet?.alert ?? 0) > 0 && (
              <span className="ml-1 text-red-400">· {fleet?.alert} Alerts</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {connected ? (
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <Wifi className="h-3.5 w-3.5" /> Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-400">
              <WifiOff className="h-3.5 w-3.5" /> Reconnecting
            </span>
          )}
          {mapMode === "history" && (
            <button
              type="button"
              onClick={exitHistoryMode}
              className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-2 py-1 text-violet-400"
            >
              Exit history
            </button>
          )}
          {(alerts.critical ?? 0) > 0 && (
            <Link
              href="/alerts"
              className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-2 py-1 text-red-400 hover:bg-red-500/10"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {alerts.critical} critical
            </Link>
          )}
        </div>
      </header>

      {fleet && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total" value={fleet.total} />
          <StatCard label="Moving" value={fleet.moving} accent="text-emerald-400" />
          <StatCard label="Idle" value={fleet.idle} accent="text-amber-400" />
          <StatCard label="Stopped" value={fleet.stopped} accent="text-zinc-400" />
          <StatCard label="Offline" value={fleet.offline} accent="text-zinc-500" />
          <StatCard label="Alerts" value={fleet.alert} accent="text-red-400" />
        </div>
      )}

      <div
        className={cn(
          "overflow-hidden rounded-xl border border-[var(--dash-border)] bg-[var(--dash-card)]",
          fullHeight ? "h-[calc(100vh-14rem)] min-h-[520px]" : "h-[560px] md:h-[620px]",
        )}
      >
        <div className="flex h-full flex-col md:flex-row">
          <div className="hidden w-72 shrink-0 md:block">
            <FleetSidebar
              vehicles={vehicles}
              selectedId={selectedId}
              filter={filter}
              search={search}
              onFilterChange={setFilter}
              onSearchChange={setSearch}
              onSelect={handleSelect}
            />
          </div>

          <div className="relative min-h-0 flex-1">
            <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2">
              <MapViewControl value={mapView} onChange={setMapView} />
              <MapControlBtn icon={Crosshair} label="Fit Fleet" onClick={() => mapRef.current?.fitFleet()} />
              <MapControlBtn
                icon={Layers}
                label={showGeofences ? "Hide zones" : "Show zones"}
                active={showGeofences}
                onClick={() => setShowGeofences((v) => !v)}
              />
              <GeofenceManager
                vehicles={vehicles}
                drawMode={drawMode}
                onDrawModeChange={setDrawMode}
                pendingGeometry={pendingGeometry}
                onClearPending={() => setPendingGeometry(null)}
              />
            </div>

            <FleetMap
              ref={mapRef}
              vehicles={filteredVehicles}
              allVehicles={vehicles}
              selectedId={selectedId}
              trackingId={trackingId}
              onSelect={handleSelect}
              mapView={mapView}
              height="100%"
              trailCoords={trailCoords}
              historyCoords={historyCoords}
              playbackCoord={playbackCoord}
              playbackHeading={playbackHeading}
              geofences={geofenceList}
              showGeofences={showGeofences}
              mode={mapMode}
              drawMode={drawMode}
              onDrawComplete={handleDrawComplete}
              followTracking={!!trackingId}
            />

            {selectedVehicle && !trackingId && mapMode === "live" && (
              <VehicleMapPopup
                vehicle={selectedVehicle}
                onTrack={() => startTracking(selectedVehicle.id)}
                onHistory={() => {
                  setShowHistoryPanel(true);
                  setSelectedId(selectedVehicle.id);
                }}
                onClose={() => setSelectedId(null)}
              />
            )}

            {trackingVehicle && mapMode === "live" && (
              <VehicleTrackingPanel vehicle={trackingVehicle} onStop={stopTracking} />
            )}

            {showHistoryPanel && selectedVehicle && (
              <TrackHistoryPanel
                vehicle={selectedVehicle}
                loading={historyLoading}
                stats={historyStats}
                onLoad={handleLoadHistory}
                onClose={() => setShowHistoryPanel(false)}
              />
            )}
          </div>
        </div>

        {mapMode === "history" && (
          <>
            <TrackStatisticsBar stats={historyStats} />
            <TrackPlayback
              points={historyPoints}
              active={mapMode === "history"}
              onPositionChange={handlePlaybackPosition}
            />
          </>
        )}
      </div>

      {/* Mobile fleet list */}
      <div className="md:hidden">
        <details className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-card)]">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-[var(--dash-text)]">
            Fleet list ({filteredVehicles.length})
          </summary>
          <div className="max-h-64 overflow-y-auto border-t border-[var(--dash-border)] p-2">
            {filteredVehicles.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => handleSelect(v.id)}
                className="mb-1 block w-full rounded-lg p-2 text-left text-sm hover:bg-[var(--dash-hover)]"
              >
                {v.plate_number} · {v.current_telemetry?.status ?? v.status}
              </button>
            ))}
          </div>
        </details>
      </div>

      {showFleetTable && vehicles.length > 0 && onVehicleNavigate && (
        <div className="mt-2">
          <h3 className="mb-3 text-sm font-medium text-[var(--dash-muted)]">Vehicle Fleet</h3>
          <FleetTable vehicles={vehicles} onVehicleClick={onVehicleNavigate} />
        </div>
      )}

      {showTableLink && !showFleetTable && (
        <p className="text-center text-xs text-[var(--dash-muted)]">
          <Link href="/vehicles" className="text-cyan-400 hover:underline">
            View full vehicle table →
          </Link>
        </p>
      )}
    </div>
  );
}

function MapControlBtn({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] backdrop-blur-sm",
        active
          ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-400"
          : "border-[var(--dash-border)] bg-[var(--surface-deep)]/90 text-[var(--dash-muted)] hover:text-[var(--dash-text)]",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
