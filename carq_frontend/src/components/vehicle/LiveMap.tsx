"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Crosshair } from "lucide-react";
import {
  Map,
  Marker,
  NavigationControl,
  type GeoJSONSource,
  type Map as MapInstance,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { TelemetryData, Vehicle } from "@/lib/types";
import { formatSecondsAgo } from "@/lib/vehicle-utils";
import { cn } from "@/lib/utils";

import { ConnectionIndicator } from "./VehicleStatusBadge";
import { VehicleMapOverlay } from "./VehicleMapOverlay";

const TRAIL_SOURCE = "vehicle-trail";
const TRAIL_LAYER = "vehicle-trail-line";
const DEFAULT_CENTER: [number, number] = [106.917, 47.918];

interface LiveMapProps {
  vehicle: Vehicle;
  current: TelemetryData | null;
  history: TelemetryData[];
  connectionState: "live" | "reconnecting" | "offline";
  vehicleStatus: string;
  height?: string;
}

function whenStyleReady(map: MapInstance, fn: () => void) {
  if (map.isStyleLoaded()) {
    fn();
    return () => {};
  }
  map.once("load", fn);
  return () => {
    map.off("load", fn);
  };
}

export const LiveMap = memo(function LiveMap({
  vehicle,
  current,
  history,
  connectionState,
  vehicleStatus,
  height = "420px",
}: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);
  const markerInstanceRef = useRef<Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const lat = current?.latitude;
  const lng = current?.longitude;
  const heading = current?.heading ?? 0;
  const hasGps = lat != null && lng != null;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: hasGps ? [lng!, lat!] : DEFAULT_CENTER,
      zoom: 14,
      attributionControl: false,
    });

    map.addControl(new NavigationControl(), "top-right");
    mapRef.current = map;

    const onLoad = () => setMapReady(true);
    map.on("load", onLoad);

    const el = document.createElement("div");
    el.innerHTML = vehicleMarkerSvg(vehicleStatus);
    markerRef.current = el;

    whenStyleReady(map, () => {
      markerInstanceRef.current = new Marker({ element: el, rotationAlignment: "map" })
        .setLngLat(hasGps ? [lng!, lat!] : DEFAULT_CENTER)
        .addTo(map);
    });

    return () => {
      map.off("load", onLoad);
      markerInstanceRef.current?.remove();
      markerInstanceRef.current = null;
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // Map initializes once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !hasGps) return;

    const update = () => {
      markerInstanceRef.current?.setLngLat([lng!, lat!]);
      markerInstanceRef.current?.setRotation(heading);
      if (markerRef.current) {
        markerRef.current.innerHTML = vehicleMarkerSvg(vehicleStatus);
      }

      const trailCoords = history
        .filter((t) => t.latitude != null && t.longitude != null)
        .slice(0, 50)
        .reverse()
        .map((t) => [t.longitude!, t.latitude!] as [number, number]);

      if (trailCoords.length < 2) return;

      const geojson = {
        type: "Feature" as const,
        geometry: { type: "LineString" as const, coordinates: trailCoords },
        properties: {},
      };

      const existing = map.getSource(TRAIL_SOURCE) as GeoJSONSource | undefined;
      if (existing) {
        existing.setData(geojson);
        return;
      }

      map.addSource(TRAIL_SOURCE, { type: "geojson", data: geojson });
      map.addLayer({
        id: TRAIL_LAYER,
        type: "line",
        source: TRAIL_SOURCE,
        paint: {
          "line-color": "#22d3ee",
          "line-width": 3,
          "line-opacity": 0.6,
        },
      });
    };

    return whenStyleReady(map, update);
  }, [mapReady, lat, lng, heading, history, hasGps, vehicleStatus]);

  const centerVehicle = useCallback(() => {
    if (mapRef.current && hasGps && mapRef.current.isStyleLoaded()) {
      mapRef.current.flyTo({ center: [lng!, lat!], zoom: 15, duration: 800 });
    }
  }, [hasGps, lat, lng]);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[var(--dash-border)] bg-[var(--surface-deep)]">
      <div className="flex items-center justify-between border-b border-[var(--dash-border)] px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--dash-text)]">Live Location</h3>
          <div className="mt-1 flex items-center gap-2">
            <ConnectionIndicator
              state={connectionState}
              updatedAt={current?.timestamp}
              className="!items-start !text-left"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={centerVehicle}
          disabled={!hasGps}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-[var(--dash-border)] px-3 py-2 text-xs text-[var(--dash-muted)] transition hover:bg-[var(--dash-hover)] hover:text-[var(--dash-text)]",
            !hasGps && "cursor-not-allowed opacity-40",
          )}
        >
          <Crosshair className="h-3.5 w-3.5" />
          Center vehicle
        </button>
      </div>

      <div className="relative">
        <div ref={containerRef} className="w-full" style={{ height }} />
        {!hasGps && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-elevated)]/90 text-sm text-[var(--dash-muted)]">
            GPS location unavailable
          </div>
        )}
        {hasGps && (
          <VehicleMapOverlay
            vehicle={vehicle}
            current={current}
            vehicleStatus={vehicleStatus}
          />
        )}
      </div>
    </section>
  );
});

function vehicleMarkerSvg(status: string): string {
  const color =
    status === "MOVING"
      ? "#34d399"
      : status === "IDLE"
        ? "#fbbf24"
        : status === "ALERT"
          ? "#f87171"
          : "#71717a";

  return `
    <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" style="transform-origin: center;">
      <circle cx="18" cy="18" r="16" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>
      <path d="M18 6 L24 26 L18 22 L12 26 Z" fill="${color}" stroke="#0b0d10" stroke-width="1"/>
    </svg>
  `;
}

export function formatMapUpdated(iso?: string | null) {
  return formatSecondsAgo(iso);
}
