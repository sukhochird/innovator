"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, Route } from "lucide-react";
import {
  Map,
  Marker,
  NavigationControl,
  type GeoJSONSource,
  type LngLatBoundsLike,
  type Map as MapInstance,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { TelemetryData, Vehicle } from "@/lib/types";
import {
  createMapStyle,
  DEFAULT_MAP_CENTER,
  MAP_FOCUS_ZOOM,
} from "@/lib/map-utils";
import { useMapView } from "@/hooks/useMapView";
import { cn } from "@/lib/utils";

import { ConnectionIndicator } from "./VehicleStatusBadge";
import { MapViewControl } from "@/components/maps/MapViewControl";
import { VehicleMapOverlay } from "./VehicleMapOverlay";

const TRAIL_SOURCE = "vehicle-trail";
const TRAIL_GLOW = "vehicle-trail-glow";
const TRAIL_LINE = "vehicle-trail-line";
const TRAIL_POINTS_SOURCE = "vehicle-trail-points-src";
const TRAIL_POINTS_LAYER = "vehicle-trail-points-layer";
const DEFAULT_CENTER = DEFAULT_MAP_CENTER;

interface LiveMapProps {
  vehicle: Vehicle;
  current: TelemetryData | null;
  history: TelemetryData[];
  connectionState: "live" | "reconnecting" | "offline";
  vehicleStatus: string;
  height?: string;
}

function toNum(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function buildRouteCoords(history: TelemetryData[], current: TelemetryData | null): [number, number][] {
  const points: [number, number][] = [];

  const chron = [...history].reverse();
  for (const t of chron) {
    const lat = toNum(t.latitude);
    const lng = toNum(t.longitude);
    if (lat == null || lng == null) continue;
    const last = points[points.length - 1];
    if (last && last[0] === lng && last[1] === lat) continue;
    points.push([lng, lat]);
  }

  if (current) {
    const lat = toNum(current.latitude);
    const lng = toNum(current.longitude);
    if (lat != null && lng != null) {
      const last = points[points.length - 1];
      if (!last || last[0] !== lng || last[1] !== lat) {
        points.push([lng, lat]);
      }
    }
  }

  return points;
}

export const LiveMap = memo(function LiveMap({
  vehicle,
  current,
  history,
  connectionState,
  vehicleStatus,
  height = "420px",
}: LiveMapProps) {
  const { mapView, setMapView } = useMapView();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);
  const markerInstanceRef = useRef<Marker | null>(null);
  const startMarkerRef = useRef<Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const didFitBounds = useRef(false);
  const prevMapView = useRef(mapView);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || prevMapView.current === mapView) return;
    prevMapView.current = mapView;
    const center = map.getCenter();
    const zoom = map.getZoom();
    map.setStyle(createMapStyle(mapView));
    map.once("style.load", () => map.jumpTo({ center, zoom }));
  }, [mapView, mapReady]);

  const routeCoords = useMemo(
    () => buildRouteCoords(history, current),
    [history, current],
  );

  const lat = toNum(current?.latitude);
  const lng = toNum(current?.longitude);
  const heading = current?.heading ?? 0;

  const markerPos = useMemo((): [number, number] | null => {
    if (lat != null && lng != null) return [lng, lat];
    if (routeCoords.length > 0) return routeCoords[routeCoords.length - 1];
    return null;
  }, [lat, lng, routeCoords]);

  const hasMapData = markerPos != null;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new Map({
      container: containerRef.current,
      style: createMapStyle(mapView),
      center: DEFAULT_CENTER,
      zoom: MAP_FOCUS_ZOOM - 1,
      attributionControl: false,
    });

    map.addControl(new NavigationControl(), "top-right");
    mapRef.current = map;

    const onLoad = () => setMapReady(true);
    map.on("load", onLoad);

    const el = document.createElement("div");
    el.className = "vehicle-map-pin";
    el.style.width = "48px";
    el.style.height = "56px";
    el.style.cursor = "pointer";
    el.style.filter = "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.45))";
    markerRef.current = el;

    return () => {
      map.off("load", onLoad);
      markerInstanceRef.current?.remove();
      startMarkerRef.current?.remove();
      markerInstanceRef.current = null;
      startMarkerRef.current = null;
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
      setMapReady(false);
      didFitBounds.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const sync = () => {
      if (markerRef.current) {
        markerRef.current.innerHTML = vehicleMarkerHtml(vehicle.plate_number, vehicleStatus);
      }

      if (markerPos) {
        if (!markerInstanceRef.current && markerRef.current) {
          markerInstanceRef.current = new Marker({
            element: markerRef.current,
            anchor: "bottom",
            rotationAlignment: "map",
            pitchAlignment: "map",
          })
            .setLngLat(markerPos)
            .addTo(map);
        } else {
          markerInstanceRef.current?.setLngLat(markerPos);
        }
        markerInstanceRef.current?.setRotation(heading);
      }

      if (routeCoords.length >= 2) {
        const lineGeo = {
          type: "Feature" as const,
          geometry: { type: "LineString" as const, coordinates: routeCoords },
          properties: {},
        };

        const pointsGeo = {
          type: "FeatureCollection" as const,
          features: routeCoords.slice(0, -1).map((coord, i) => ({
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: coord },
            properties: { index: i },
          })),
        };

        const lineSrc = map.getSource(TRAIL_SOURCE) as GeoJSONSource | undefined;
        if (lineSrc) {
          lineSrc.setData(lineGeo);
        } else {
          map.addSource(TRAIL_SOURCE, { type: "geojson", data: lineGeo });
          map.addLayer({
            id: TRAIL_GLOW,
            type: "line",
            source: TRAIL_SOURCE,
            paint: {
              "line-color": "#0891b2",
              "line-width": 8,
              "line-opacity": 0.25,
              "line-blur": 2,
            },
          });
          map.addLayer({
            id: TRAIL_LINE,
            type: "line",
            source: TRAIL_SOURCE,
            paint: {
              "line-color": "#22d3ee",
              "line-width": 4,
              "line-opacity": 0.85,
            },
          });
        }

        const ptsSrc = map.getSource(TRAIL_POINTS_SOURCE) as GeoJSONSource | undefined;
        if (ptsSrc) {
          ptsSrc.setData(pointsGeo);
        } else {
          map.addSource(TRAIL_POINTS_SOURCE, { type: "geojson", data: pointsGeo });
          map.addLayer({
            id: TRAIL_POINTS_LAYER,
            type: "circle",
            source: TRAIL_POINTS_SOURCE,
            paint: {
              "circle-radius": 3,
              "circle-color": "#67e8f9",
              "circle-opacity": 0.5,
              "circle-stroke-width": 1,
              "circle-stroke-color": "#0e7490",
            },
          });
        }

        const start = routeCoords[0];
        if (!startMarkerRef.current) {
          const startEl = document.createElement("div");
          startEl.innerHTML = startMarkerHtml();
          startMarkerRef.current = new Marker({ element: startEl, anchor: "center" })
            .setLngLat(start)
            .addTo(map);
        } else {
          startMarkerRef.current.setLngLat(start);
        }

        if (!didFitBounds.current) {
          const lngs = routeCoords.map((c) => c[0]);
          const lats = routeCoords.map((c) => c[1]);
          const bounds: LngLatBoundsLike = [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ];
          map.fitBounds(bounds, { padding: 60, maxZoom: MAP_FOCUS_ZOOM, duration: 800 });
          didFitBounds.current = true;
        }
      } else if (markerPos && !didFitBounds.current) {
        map.flyTo({ center: markerPos, zoom: MAP_FOCUS_ZOOM, duration: 600 });
        didFitBounds.current = true;
      }
    };

    if (map.isStyleLoaded()) {
      sync();
    } else {
      map.once("load", sync);
    }
  }, [mapReady, markerPos, heading, routeCoords, vehicle.plate_number, vehicleStatus]);

  const centerVehicle = useCallback(() => {
    const map = mapRef.current;
    if (!map || !markerPos || !map.isStyleLoaded()) return;
    map.flyTo({ center: markerPos, zoom: MAP_FOCUS_ZOOM, duration: 600 });
  }, [markerPos]);

  const fitRoute = useCallback(() => {
    const map = mapRef.current;
    if (!map || routeCoords.length < 2 || !map.isStyleLoaded()) return;
    const lngs = routeCoords.map((c) => c[0]);
    const lats = routeCoords.map((c) => c[1]);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 60, maxZoom: MAP_FOCUS_ZOOM, duration: 800 },
    );
  }, [routeCoords]);

  const routePointCount = routeCoords.length;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[var(--dash-border)] bg-[var(--surface-deep)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--dash-border)] px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--dash-text)]">Live Location</h3>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <ConnectionIndicator
              state={connectionState}
              updatedAt={current?.timestamp}
              className="!items-start !text-left"
            />
            {routePointCount >= 2 && (
              <span className="inline-flex items-center gap-1 text-xs text-cyan-500/80">
                <Route className="h-3 w-3" />
                {routePointCount} route points
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MapViewControl value={mapView} onChange={setMapView} />
          {routePointCount >= 2 && (
            <button
              type="button"
              onClick={fitRoute}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--dash-border)] px-3 py-2 text-xs text-[var(--dash-muted)] transition hover:bg-[var(--dash-hover)] hover:text-[var(--dash-text)]"
            >
              <Route className="h-3.5 w-3.5" />
              Fit route
            </button>
          )}
          <button
            type="button"
            onClick={centerVehicle}
            disabled={!hasMapData}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border border-[var(--dash-border)] px-3 py-2 text-xs text-[var(--dash-muted)] transition hover:bg-[var(--dash-hover)] hover:text-[var(--dash-text)]",
              !hasMapData && "cursor-not-allowed opacity-40",
            )}
          >
            <Crosshair className="h-3.5 w-3.5" />
            Center vehicle
          </button>
        </div>
      </div>

      <div className="relative">
        <div ref={containerRef} className="w-full" style={{ height }} />
        {!hasMapData && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-elevated)]/90 text-sm text-[var(--dash-muted)]">
            GPS location unavailable
          </div>
        )}
        {hasMapData && (
          <>
            <VehicleMapOverlay
              vehicle={vehicle}
              current={current}
              vehicleStatus={vehicleStatus}
            />
            {routePointCount >= 2 && (
              <div className="pointer-events-none absolute right-4 top-4 rounded-lg border border-[var(--dash-border)]/80 bg-[var(--surface-deep)]/90 px-3 py-2 text-[10px] backdrop-blur-sm">
                <div className="flex items-center gap-3 text-[var(--dash-muted)]">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                    Start
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-0 w-0 border-x-4 border-b-[7px] border-x-transparent border-b-cyan-400" />
                    Vehicle
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
});

function statusColor(status: string): string {
  if (status === "MOVING") return "#34d399";
  if (status === "IDLE") return "#fbbf24";
  if (status === "ALERT") return "#f87171";
  return "#22d3ee";
}

function vehicleMarkerHtml(plate: string, status: string): string {
  const color = statusColor(status);
  return `
    <div style="display:flex;flex-direction:column;align-items:center;width:48px;">
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="2.5"/>
        <path d="M20 8 L28 30 L20 25 L12 30 Z" fill="${color}" stroke="#0b0d10" stroke-width="1.2"/>
      </svg>
      <div style="
        margin-top:2px;
        padding:1px 6px;
        border-radius:4px;
        background:rgba(11,13,16,0.85);
        border:1px solid ${color}66;
        font-family:ui-monospace,monospace;
        font-size:9px;
        font-weight:600;
        color:${color};
        white-space:nowrap;
        max-width:72px;
        overflow:hidden;
        text-overflow:ellipsis;
      ">${plate}</div>
    </div>
  `;
}

function startMarkerHtml(): string {
  return `
    <div style="width:14px;height:14px;border-radius:50%;background:#34d399;border:2px solid #fff;box-shadow:0 0 8px rgba(52,211,153,0.6);"></div>
  `;
}
