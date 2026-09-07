"use client";

import { useEffect, useRef } from "react";
import { Map, Marker, NavigationControl, type Map as MapInstance } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { Vehicle } from "@/lib/types";

interface FleetMapProps {
  vehicles: Vehicle[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  height?: string;
  showPath?: boolean;
}

export function FleetMap({
  vehicles,
  selectedId,
  onSelect,
  height = "100%",
}: FleetMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const markersRef = useRef<globalThis.Map<number, Marker>>(new globalThis.Map());

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
      center: [106.917, 47.918],
      zoom: 11,
      attributionControl: false,
    });

    map.addControl(new NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const existing = markersRef.current;
    const activeIds = new Set<number>();

    vehicles.forEach((v) => {
      const tel = v.current_telemetry;
      if (!tel?.latitude || !tel?.longitude) return;
      activeIds.add(v.id);

      const el = document.createElement("div");
      el.className = `fleet-marker ${selectedId === v.id ? "selected" : ""}`;
      el.innerHTML = `<div class="marker-dot ${v.status.toLowerCase()}"></div>`;
      el.onclick = () => onSelect?.(v.id);

      const marker = existing.get(v.id);
      if (marker) {
        marker.setLngLat([tel.longitude!, tel.latitude!]);
      } else {
        const m = new Marker({ element: el })
          .setLngLat([tel.longitude!, tel.latitude!])
          .addTo(map);
        existing.set(v.id, m);
      }
    });

    existing.forEach((marker: Marker, id: number) => {
      if (!activeIds.has(id)) {
        marker.remove();
        existing.delete(id);
      }
    });
  }, [vehicles, selectedId, onSelect]);

  return (
    <div
      ref={containerRef}
      className="fleet-map w-full rounded-lg border border-[var(--dash-border)]"
      style={{ height }}
    />
  );
}
