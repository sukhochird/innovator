"use client";

import { memo, useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import {
  Map,
  Marker,
  NavigationControl,
  type GeoJSONSource,
  type Map as MapInstance,
  type MapMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  computeCoordsBounds,
  computeFleetBounds,
  coordsFromTelemetry,
  DEFAULT_MAP_CENTER,
  endMarkerHtml,
  startMarkerHtml,
  toNum,
  vehicleMarkerHtml,
} from "@/lib/map-utils";
import type { FleetMapMode, Geofence, TelemetryData, Vehicle } from "@/lib/types";

const TRAIL_SOURCE = "fleet-trail";
const TRAIL_LINE = "fleet-trail-line";
const HISTORY_SOURCE = "fleet-history";
const HISTORY_LINE = "fleet-history-line";
const GEOFENCE_SOURCE = "geofence-zones";

export type DrawMode = "CIRCLE" | "POLYGON" | "RECTANGLE" | null;

export interface FleetMapHandle {
  fitFleet: () => void;
  focusVehicle: (vehicleId: number) => void;
}

interface FleetMapProps {
  vehicles: Vehicle[];
  selectedId?: number | null;
  trackingId?: number | null;
  onSelect?: (id: number) => void;
  height?: string;
  trailCoords?: [number, number][];
  historyCoords?: [number, number][];
  playbackCoord?: [number, number] | null;
  playbackHeading?: number;
  geofences?: Geofence[];
  showGeofences?: boolean;
  mode?: FleetMapMode;
  drawMode?: DrawMode;
  onDrawComplete?: (geometry: Record<string, unknown>, type: DrawMode) => void;
  followTracking?: boolean;
}

function geofenceToFeature(gf: Geofence) {
  const geom = gf.geometry;
  const props = { name: gf.name, id: gf.id, active: gf.is_active };
  if (gf.type === "CIRCLE" && geom.center && (geom.radius_m || gf.radius_m)) {
    const [lng, lat] = geom.center;
    const radius = geom.radius_m || gf.radius_m || 100;
    const points = 64;
    const coords: [number, number][] = [];
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = (radius / 111320) * Math.cos(angle) / Math.cos((lat * Math.PI) / 180);
      const dy = (radius / 110540) * Math.sin(angle);
      coords.push([lng + dx, lat + dy]);
    }
    return {
      type: "Feature" as const,
      geometry: { type: "Polygon" as const, coordinates: [coords] },
      properties: props,
    };
  }
  if (gf.type === "POLYGON" && geom.coordinates?.length) {
    const ring = [...geom.coordinates];
    if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
      ring.push(ring[0]);
    }
    return {
      type: "Feature" as const,
      geometry: { type: "Polygon" as const, coordinates: [ring] },
      properties: props,
    };
  }
  if (gf.type === "RECTANGLE" && geom.bounds?.length === 2) {
    const [[swLng, swLat], [neLng, neLat]] = geom.bounds;
    const ring: [number, number][] = [
      [swLng, swLat],
      [neLng, swLat],
      [neLng, neLat],
      [swLng, neLat],
      [swLng, swLat],
    ];
    return {
      type: "Feature" as const,
      geometry: { type: "Polygon" as const, coordinates: [ring] },
      properties: props,
    };
  }
  return null;
}

export const FleetMap = memo(
  forwardRef<FleetMapHandle, FleetMapProps>(function FleetMap(
    {
      vehicles,
      selectedId,
      trackingId,
      onSelect,
      height = "100%",
      trailCoords = [],
      historyCoords = [],
      playbackCoord,
      playbackHeading = 0,
      geofences = [],
      showGeofences = true,
      mode = "live",
      drawMode = null,
      onDrawComplete,
      followTracking = false,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapInstance | null>(null);
    const markersRef = useRef<globalThis.Map<number, Marker>>(new globalThis.Map());
    const playbackMarkerRef = useRef<Marker | null>(null);
    const startMarkerRef = useRef<Marker | null>(null);
    const endMarkerRef = useRef<Marker | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const userMovedMap = useRef(false);
    const drawPointsRef = useRef<[number, number][]>([]);
    const drawStartRef = useRef<[number, number] | null>(null);

    useImperativeHandle(ref, () => ({
      fitFleet: () => {
        const map = mapRef.current;
        if (!map) return;
        const bounds = computeFleetBounds(vehicles);
        if (!bounds) return;
        userMovedMap.current = false;
        const [[minLng, minLat], [maxLng, maxLat]] = bounds;
        if (minLng === maxLng && minLat === maxLat) {
          map.flyTo({ center: [minLng, minLat], zoom: 14, duration: 800 });
        } else {
          map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 800 });
        }
      },
      focusVehicle: (vehicleId: number) => {
        const map = mapRef.current;
        const v = vehicles.find((x) => x.id === vehicleId);
        if (!map || !v?.current_telemetry) return;
        const lat = toNum(v.current_telemetry.latitude);
        const lng = toNum(v.current_telemetry.longitude);
        if (lat == null || lng == null) return;
        userMovedMap.current = false;
        map.flyTo({ center: [lng, lat], zoom: 15, duration: 800 });
      },
    }));

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
        center: DEFAULT_MAP_CENTER,
        zoom: 11,
        attributionControl: false,
      });
      map.addControl(new NavigationControl(), "top-right");
      map.on("dragstart", () => {
        userMovedMap.current = true;
      });
      mapRef.current = map;
      map.on("load", () => setMapReady(true));
      return () => {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current.clear();
        playbackMarkerRef.current?.remove();
        startMarkerRef.current?.remove();
        endMarkerRef.current?.remove();
        map.remove();
        mapRef.current = null;
        setMapReady(false);
      };
    }, []);

    const syncMarkers = useCallback(() => {
      const map = mapRef.current;
      if (!map || !mapReady) return;

      const activeIds = new Set<number>();
      vehicles.forEach((v) => {
        const tel = v.current_telemetry;
        const lat = toNum(tel?.latitude);
        const lng = toNum(tel?.longitude);
        if (lat == null || lng == null) return;
        if (mode === "history" && v.id !== selectedId) return;

        activeIds.add(v.id);
        const status = tel?.status ?? v.status;
        const isSelected = selectedId === v.id;
        const isTracking = trackingId === v.id;
        const heading = tel?.heading ?? 0;

        let marker = markersRef.current.get(v.id);
        if (marker) {
          marker.setLngLat([lng, lat]);
          marker.setRotation(isTracking || isSelected ? heading : 0);
          const el = marker.getElement();
          el.innerHTML = vehicleMarkerHtml(v.plate_number, status, isSelected || isTracking);
          el.className = `fleet-marker ${isSelected ? "selected" : ""}`;
        } else {
          const el = document.createElement("div");
          el.className = `fleet-marker ${isSelected ? "selected" : ""}`;
          el.innerHTML = vehicleMarkerHtml(v.plate_number, status, isSelected);
          el.onclick = (e) => {
            e.stopPropagation();
            onSelect?.(v.id);
          };
          marker = new Marker({
            element: el,
            anchor: "bottom",
            rotationAlignment: "map",
            pitchAlignment: "map",
          })
            .setLngLat([lng, lat])
            .setRotation(isTracking || isSelected ? heading : 0)
            .addTo(map);
          markersRef.current.set(v.id, marker);
        }
      });

      markersRef.current.forEach((marker, id) => {
        if (!activeIds.has(id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      });

      if (followTracking && trackingId && !userMovedMap.current) {
        const v = vehicles.find((x) => x.id === trackingId);
        const lat = toNum(v?.current_telemetry?.latitude);
        const lng = toNum(v?.current_telemetry?.longitude);
        if (lat != null && lng != null) {
          map.easeTo({ center: [lng, lat], duration: 500 });
        }
      }
    }, [vehicles, selectedId, trackingId, onSelect, mapReady, mode, followTracking]);

    useEffect(() => {
      syncMarkers();
    }, [syncMarkers]);

    const syncLine = useCallback(
      (sourceId: string, layerId: string, coords: [number, number][], color: string) => {
        const map = mapRef.current;
        if (!map || !mapReady || coords.length < 2) return;
        const geo = {
          type: "Feature" as const,
          geometry: { type: "LineString" as const, coordinates: coords },
          properties: {},
        };
        const src = map.getSource(sourceId) as GeoJSONSource | undefined;
        if (src) {
          src.setData(geo);
        } else {
          map.addSource(sourceId, { type: "geojson", data: geo });
          map.addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            paint: { "line-color": color, "line-width": 4, "line-opacity": 0.85 },
          });
        }
      },
      [mapReady],
    );

    useEffect(() => {
      const map = mapRef.current;
      if (!map || !mapReady) return;
      if (trailCoords.length >= 2 && mode === "live") {
        syncLine(TRAIL_SOURCE, TRAIL_LINE, trailCoords, "#22d3ee");
      } else if (map.getLayer(TRAIL_LINE)) {
        map.removeLayer(TRAIL_LINE);
        map.removeSource(TRAIL_SOURCE);
      }
    }, [trailCoords, mapReady, mode, syncLine]);

    useEffect(() => {
      const map = mapRef.current;
      if (!map || !mapReady) return;
      if (historyCoords.length >= 2 && mode === "history") {
        syncLine(HISTORY_SOURCE, HISTORY_LINE, historyCoords, "#a78bfa");
        const start = historyCoords[0];
        const end = historyCoords[historyCoords.length - 1];
        if (!startMarkerRef.current) {
          const el = document.createElement("div");
          el.innerHTML = startMarkerHtml();
          startMarkerRef.current = new Marker({ element: el, anchor: "center" })
            .setLngLat(start)
            .addTo(map);
        } else {
          startMarkerRef.current.setLngLat(start);
        }
        if (!endMarkerRef.current) {
          const el = document.createElement("div");
          el.innerHTML = endMarkerHtml();
          endMarkerRef.current = new Marker({ element: el, anchor: "center" })
            .setLngLat(end)
            .addTo(map);
        } else {
          endMarkerRef.current.setLngLat(end);
        }
        if (!userMovedMap.current) {
          const bounds = computeCoordsBounds(historyCoords);
          if (bounds) map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 800 });
        }
      } else if (map.getLayer(HISTORY_LINE)) {
        map.removeLayer(HISTORY_LINE);
        map.removeSource(HISTORY_SOURCE);
        startMarkerRef.current?.remove();
        endMarkerRef.current?.remove();
        startMarkerRef.current = null;
        endMarkerRef.current = null;
      }
    }, [historyCoords, mapReady, mode, syncLine]);

    useEffect(() => {
      const map = mapRef.current;
      if (!map || !mapReady) return;
      if (playbackCoord && mode === "history") {
        if (!playbackMarkerRef.current) {
          const el = document.createElement("div");
          el.className = "fleet-marker selected";
          playbackMarkerRef.current = new Marker({
            element: el,
            anchor: "bottom",
            rotationAlignment: "map",
          }).addTo(map);
        }
        playbackMarkerRef.current.setLngLat(playbackCoord);
        playbackMarkerRef.current.setRotation(playbackHeading);
        const v = vehicles.find((x) => x.id === selectedId);
        if (v) {
          playbackMarkerRef.current.getElement().innerHTML = vehicleMarkerHtml(
            v.plate_number,
            "MOVING",
            true,
          );
        }
      } else {
        playbackMarkerRef.current?.remove();
        playbackMarkerRef.current = null;
      }
    }, [playbackCoord, playbackHeading, mapReady, mode, selectedId, vehicles]);

    useEffect(() => {
      const map = mapRef.current;
      if (!map || !mapReady) return;
      const list = Array.isArray(geofences) ? geofences : [];
      const features = showGeofences
        ? list.filter((g) => g.is_active).map(geofenceToFeature).filter(Boolean)
        : [];
      const collection = {
        type: "FeatureCollection" as const,
        features: features as Array<{
          type: "Feature";
          geometry: { type: "Polygon"; coordinates: [number, number][][] };
          properties: Record<string, unknown>;
        }>,
      };
      const src = map.getSource(GEOFENCE_SOURCE) as GeoJSONSource | undefined;
      if (src) {
        src.setData(collection);
      } else if (features.length) {
        map.addSource(GEOFENCE_SOURCE, { type: "geojson", data: collection });
        map.addLayer({
          id: "geofence-fill",
          type: "fill",
          source: GEOFENCE_SOURCE,
          paint: {
            "fill-color": ["case", ["get", "active"], "#22d3ee", "#71717a"],
            "fill-opacity": 0.15,
          },
        });
        map.addLayer({
          id: "geofence-outline",
          type: "line",
          source: GEOFENCE_SOURCE,
          paint: {
            "line-color": ["case", ["get", "active"], "#22d3ee", "#71717a"],
            "line-width": 2,
            "line-opacity": 0.8,
          },
        });
      }
    }, [geofences, showGeofences, mapReady]);

    useEffect(() => {
      const map = mapRef.current;
      if (!map || !mapReady || !drawMode) return;

      const onClick = (e: MapMouseEvent) => {
        const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        if (drawMode === "CIRCLE") {
          onDrawComplete?.({ center: lngLat, radius_m: 500 }, drawMode);
        } else if (drawMode === "RECTANGLE") {
          if (!drawStartRef.current) {
            drawStartRef.current = lngLat;
          } else {
            const start = drawStartRef.current;
            onDrawComplete?.(
              { bounds: [start, lngLat] },
              drawMode,
            );
            drawStartRef.current = null;
          }
        } else if (drawMode === "POLYGON") {
          drawPointsRef.current.push(lngLat);
        }
      };

      const onDblClick = (e: MapMouseEvent) => {
        if (drawMode !== "POLYGON") return;
        e.preventDefault();
        if (drawPointsRef.current.length >= 3) {
          onDrawComplete?.({ coordinates: [...drawPointsRef.current] }, drawMode);
          drawPointsRef.current = [];
        }
      };

      map.getCanvas().style.cursor = "crosshair";
      map.on("click", onClick);
      map.on("dblclick", onDblClick);
      return () => {
        map.getCanvas().style.cursor = "";
        map.off("click", onClick);
        map.off("dblclick", onDblClick);
        drawPointsRef.current = [];
        drawStartRef.current = null;
      };
    }, [drawMode, mapReady, onDrawComplete]);

    return (
      <div
        ref={containerRef}
        className="fleet-map w-full rounded-lg border border-[var(--dash-border)]"
        style={{ height, minHeight: height === "100%" ? "480px" : undefined }}
      />
    );
  }),
);

export { coordsFromTelemetry };
