"use client";

import { memo, useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import {
  Map,
  Marker,
  NavigationControl,
  AttributionControl,
  type GeoJSONSource,
  type Map as MapInstance,
  type MapMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { Crosshair } from "lucide-react";
import {
  computeCoordsBounds,
  computeFleetBounds,
  coordsFromTelemetry,
  getMapStyle,
  DEFAULT_MAP_CENTER,
  endMarkerHtml,
  lerpAngle,
  lerpCoord,
  MAP_DEFAULT_ZOOM,
  MAP_FIT_FLEET_MAX_ZOOM,
  MAP_FOCUS_ZOOM,
  MAP_TRACKING_ZOOM,
  normalizeRectangleBounds,
  startMarkerHtml,
  toNum,
  vehicleCoords,
  vehicleMarkerHtml,
  type MapViewId,
} from "@/lib/map-utils";
import type { FleetMapMode, Geofence, TelemetryData, Vehicle } from "@/lib/types";

const TRAIL_SOURCE = "fleet-trail";
const TRAIL_LINE = "fleet-trail-line";
const HISTORY_SOURCE = "fleet-history";
const HISTORY_LINE = "fleet-history-line";
const GEOFENCE_SOURCE = "geofence-zones";
const DRAW_PREVIEW = "draw-preview";
const DRAW_PREVIEW_LAYER = "draw-preview-layer";

export type DrawMode = "CIRCLE" | "POLYGON" | "RECTANGLE" | null;

export interface FleetMapHandle {
  fitFleet: () => void;
  focusVehicle: (vehicleId: number, zoom?: number) => void;
  focusAt: (lng: number, lat: number, zoom?: number) => void;
  resumeFollow: () => void;
}

interface FleetMapProps {
  vehicles: Vehicle[];
  allVehicles?: Vehicle[];
  selectedId?: number | null;
  trackingId?: number | null;
  onSelect?: (id: number) => void;
  mapView?: MapViewId;
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
      allVehicles,
      selectedId,
      trackingId,
      onSelect,
      mapView = "standard",
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
    const markerKeysRef = useRef<globalThis.Map<number, string>>(new globalThis.Map());
    const animStatesRef = useRef<
      globalThis.Map<
        number,
        {
          fromCoord: [number, number];
          toCoord: [number, number];
          currentCoord: [number, number];
          fromHeading: number;
          toHeading: number;
          currentHeading: number;
          startTime: number;
          duration: number;
        }
      >
    >(new globalThis.Map());
    const playbackMarkerRef = useRef<Marker | null>(null);
    const startMarkerRef = useRef<Marker | null>(null);
    const endMarkerRef = useRef<Marker | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const [styleEpoch, setStyleEpoch] = useState(0);
    const [isPausedFollow, setIsPausedFollow] = useState(false);
    const userMovedMap = useRef(false);
    const drawPointsRef = useRef<[number, number][]>([]);
    const drawStartRef = useRef<[number, number] | null>(null);
    const prevMapView = useRef(mapView);
    const focusPool = allVehicles ?? vehicles;

    const flyToVehicle = useCallback((lng: number, lat: number, zoom = MAP_FOCUS_ZOOM) => {
      const map = mapRef.current;
      if (!map) return;
      userMovedMap.current = false;
      setIsPausedFollow(false);
      const go = () => {
        map.flyTo({
          center: [lng, lat],
          zoom,
          duration: 500,
          essential: true,
        });
      };
      if (map.isStyleLoaded()) go();
      else map.once("idle", go);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        fitFleet: () => {
          const map = mapRef.current;
          if (!map) return;
          const bounds = computeFleetBounds(focusPool);
          if (!bounds) return;
          userMovedMap.current = false;
          setIsPausedFollow(false);
          const [[minLng, minLat], [maxLng, maxLat]] = bounds;
          if (minLng === maxLng && minLat === maxLat) {
            flyToVehicle(minLng, minLat, MAP_FOCUS_ZOOM);
          } else {
            map.fitBounds(bounds, {
              padding: 80,
              maxZoom: MAP_FIT_FLEET_MAX_ZOOM,
              duration: 700,
            });
          }
        },
        focusVehicle: (vehicleId: number, zoom?: number) => {
          const anim = animStatesRef.current.get(vehicleId);
          const v = focusPool.find((x) => x.id === vehicleId);
          const coords = anim?.currentCoord ?? (v ? vehicleCoords(v) : null);
          if (coords) flyToVehicle(coords[0], coords[1], zoom ?? MAP_TRACKING_ZOOM);
        },
        focusAt: (lng: number, lat: number, zoom?: number) => {
          flyToVehicle(lng, lat, zoom ?? MAP_TRACKING_ZOOM);
        },
        resumeFollow: () => {
          userMovedMap.current = false;
          setIsPausedFollow(false);
          const targetId = trackingId ?? selectedId;
          if (!targetId) return;
          const anim = animStatesRef.current.get(targetId);
          const v = focusPool.find((x) => x.id === targetId);
          const coords = anim?.currentCoord ?? (v ? vehicleCoords(v) : null);
          if (coords) flyToVehicle(coords[0], coords[1], MAP_TRACKING_ZOOM);
        },
      }),
      [focusPool, flyToVehicle, trackingId, selectedId],
    );

    useEffect(() => {
      if (!containerRef.current || mapRef.current) return;
      const map = new Map({
        container: containerRef.current,
        style: getMapStyle(mapView),
        center: DEFAULT_MAP_CENTER,
        zoom: MAP_DEFAULT_ZOOM,
        attributionControl: false,
      });
      map.addControl(new NavigationControl(), "top-right");
      map.addControl(new AttributionControl({ compact: true }), "bottom-right");
      map.on("dragstart", () => {
        userMovedMap.current = true;
        if (followTracking || trackingId || selectedId) {
          setIsPausedFollow(true);
        }
      });
      mapRef.current = map;
      map.on("load", () => {
        map.jumpTo({ center: DEFAULT_MAP_CENTER, zoom: MAP_DEFAULT_ZOOM });
        setMapReady(true);
      });
      return () => {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current.clear();
        markerKeysRef.current.clear();
        animStatesRef.current.clear();
        playbackMarkerRef.current?.remove();
        startMarkerRef.current?.remove();
        endMarkerRef.current?.remove();
        map.remove();
        mapRef.current = null;
        setMapReady(false);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
    }, []);

    useEffect(() => {
      const map = mapRef.current;
      if (!map || !mapReady || prevMapView.current === mapView) return;
      prevMapView.current = mapView;
      const center = map.getCenter();
      const zoom = map.getZoom();
      const bearing = map.getBearing();
      map.setStyle(getMapStyle(mapView));
      map.once("style.load", () => {
        map.jumpTo({ center, zoom, bearing });
        setStyleEpoch((n) => n + 1);
      });
    }, [mapView, mapReady]);

    // RequestAnimationFrame interpolation loop for all animated vehicles
    useEffect(() => {
      let reqId: number;
      const loop = () => {
        const now = performance.now();
        animStatesRef.current.forEach((anim, id) => {
          const elapsed = now - anim.startTime;
          const progress = Math.min(1, elapsed / anim.duration);
          // Ease-out cubic curve
          const ease = 1 - Math.pow(1 - progress, 3);
          anim.currentCoord = lerpCoord(anim.fromCoord, anim.toCoord, ease);
          anim.currentHeading = lerpAngle(anim.fromHeading, anim.toHeading, ease);

          const marker = markersRef.current.get(id);
          if (marker) {
            marker.setLngLat(anim.currentCoord);
            const wrapper = marker.getElement().querySelector<HTMLElement>(".car-silhouette-wrapper");
            if (wrapper) {
              wrapper.style.transform = `rotate(${Math.round(anim.currentHeading)}deg)`;
            }
          }

          // Smooth camera lock-follow for active tracking vehicle
          const isTargetFollow = (followTracking && (trackingId === id || selectedId === id)) || trackingId === id;
          if (isTargetFollow && !userMovedMap.current && mapRef.current) {
            mapRef.current.setCenter(anim.currentCoord);
          }
        });

        reqId = requestAnimationFrame(loop);
      };

      reqId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(reqId);
    }, [followTracking, trackingId, selectedId]);

    useEffect(() => {
      if (!mapReady || !selectedId || drawMode) return;
      const anim = animStatesRef.current.get(selectedId);
      const v = focusPool.find((x) => x.id === selectedId);
      const coords = anim?.currentCoord ?? (v ? vehicleCoords(v) : null);
      if (coords) flyToVehicle(coords[0], coords[1], MAP_TRACKING_ZOOM);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- focus only when selection changes
    }, [selectedId, mapReady, drawMode, flyToVehicle]);

    const syncMarkers = useCallback(() => {
      const map = mapRef.current;
      if (!map || !mapReady) return;

      const now = performance.now();
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
        const speed = tel?.speed ?? null;
        const ignition = tel?.ignition ?? null;

        // Manage animation state for smooth movement
        let anim = animStatesRef.current.get(v.id);
        if (!anim) {
          anim = {
            fromCoord: [lng, lat],
            toCoord: [lng, lat],
            currentCoord: [lng, lat],
            fromHeading: heading,
            toHeading: heading,
            currentHeading: heading,
            startTime: now,
            duration: 1,
          };
          animStatesRef.current.set(v.id, anim);
        } else {
          const dist = Math.hypot(lng - anim.toCoord[0], lat - anim.toCoord[1]);
          if (dist > 0.000001 || Math.abs(heading - anim.toHeading) > 0.5) {
            anim.fromCoord = [...anim.currentCoord];
            anim.toCoord = [lng, lat];
            anim.fromHeading = anim.currentHeading;
            anim.toHeading = heading;
            anim.startTime = now;
            anim.duration = 1800;
          }
        }

        let marker = markersRef.current.get(v.id);
        const handleMarkerClick = (e: MouseEvent) => {
          e.stopPropagation();
          userMovedMap.current = false;
          setIsPausedFollow(false);
          flyToVehicle(lng, lat, MAP_TRACKING_ZOOM);
          onSelect?.(v.id);
        };

        const markerKey = `${v.plate_number}_${status}_${isSelected}_${isTracking}_${Math.round(speed ?? 0)}_${ignition}`;
        const prevKey = markerKeysRef.current.get(v.id);

        if (marker) {
          if (prevKey !== markerKey) {
            const el = marker.getElement();
            el.innerHTML = vehicleMarkerHtml({
              plate: v.plate_number,
              status,
              selected: isSelected,
              tracking: isTracking,
              speed,
              heading: anim.currentHeading,
              ignition,
            });
            el.className = `fleet-marker ${isSelected ? "selected" : ""}`;
            el.onclick = handleMarkerClick;
            markerKeysRef.current.set(v.id, markerKey);
          }
        } else {
          const el = document.createElement("div");
          el.className = `fleet-marker ${isSelected ? "selected" : ""}`;
          el.innerHTML = vehicleMarkerHtml({
            plate: v.plate_number,
            status,
            selected: isSelected,
            tracking: isTracking,
            speed,
            heading: anim.currentHeading,
            ignition,
          });
          el.onclick = handleMarkerClick;
          marker = new Marker({
            element: el,
            anchor: "center",
          })
            .setLngLat(anim.currentCoord)
            .addTo(map);
          markersRef.current.set(v.id, marker);
          markerKeysRef.current.set(v.id, markerKey);
        }
      });

      markersRef.current.forEach((marker, id) => {
        if (!activeIds.has(id)) {
          marker.remove();
          markersRef.current.delete(id);
          markerKeysRef.current.delete(id);
          animStatesRef.current.delete(id);
        }
      });
    }, [vehicles, selectedId, trackingId, onSelect, mapReady, mode, flyToVehicle]);

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
    }, [trailCoords, mapReady, mode, syncLine, styleEpoch]);

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
    }, [historyCoords, mapReady, mode, syncLine, styleEpoch]);

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
    }, [geofences, showGeofences, mapReady, styleEpoch]);

    useEffect(() => {
      const map = mapRef.current;
      if (!map || !mapReady || !drawMode) return;

      map.doubleClickZoom.disable();
      map.getCanvas().style.cursor = "crosshair";

      const setPreview = (geojson: GeoJSON.Feature | GeoJSON.FeatureCollection | null) => {
        if (!geojson) {
          if (map.getLayer(DRAW_PREVIEW_LAYER)) map.removeLayer(DRAW_PREVIEW_LAYER);
          if (map.getSource(DRAW_PREVIEW)) map.removeSource(DRAW_PREVIEW);
          return;
        }
        const src = map.getSource(DRAW_PREVIEW) as GeoJSONSource | undefined;
        if (src) {
          src.setData(geojson);
        } else {
          map.addSource(DRAW_PREVIEW, { type: "geojson", data: geojson });
          map.addLayer({
            id: DRAW_PREVIEW_LAYER,
            type: "fill",
            source: DRAW_PREVIEW,
            paint: { "fill-color": "#22d3ee", "fill-opacity": 0.2 },
          });
          map.addLayer({
            id: `${DRAW_PREVIEW_LAYER}-line`,
            type: "line",
            source: DRAW_PREVIEW,
            paint: { "line-color": "#22d3ee", "line-width": 2, "line-dasharray": [2, 2] },
          });
        }
      };

      const onClick = (e: MapMouseEvent) => {
        const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        if (drawMode === "CIRCLE") {
          onDrawComplete?.({ center: lngLat, radius_m: 500 }, drawMode);
          setPreview(null);
        } else if (drawMode === "RECTANGLE") {
          if (!drawStartRef.current) {
            drawStartRef.current = lngLat;
          } else {
            const bounds = normalizeRectangleBounds(drawStartRef.current, lngLat);
            onDrawComplete?.({ bounds }, drawMode);
            drawStartRef.current = null;
            setPreview(null);
          }
        } else if (drawMode === "POLYGON") {
          drawPointsRef.current.push(lngLat);
          setPreview({
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[...drawPointsRef.current, drawPointsRef.current[0]]],
            },
            properties: {},
          });
        }
      };

      const onDblClick = (e: MapMouseEvent) => {
        if (drawMode !== "POLYGON") return;
        e.preventDefault();
        if (drawPointsRef.current.length >= 3) {
          onDrawComplete?.({ coordinates: [...drawPointsRef.current] }, drawMode);
          drawPointsRef.current = [];
          setPreview(null);
        }
      };

      const onMove = (e: MapMouseEvent) => {
        if (drawMode === "RECTANGLE" && drawStartRef.current) {
          const bounds = normalizeRectangleBounds(drawStartRef.current, [e.lngLat.lng, e.lngLat.lat]);
          const [[swLng, swLat], [neLng, neLat]] = bounds;
          setPreview({
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[[swLng, swLat], [neLng, swLat], [neLng, neLat], [swLng, neLat], [swLng, swLat]]],
            },
            properties: {},
          });
        }
      };

      map.on("click", onClick);
      map.on("dblclick", onDblClick);
      map.on("mousemove", onMove);
      return () => {
        map.doubleClickZoom.enable();
        map.getCanvas().style.cursor = "";
        map.off("click", onClick);
        map.off("dblclick", onDblClick);
        map.off("mousemove", onMove);
        drawPointsRef.current = [];
        drawStartRef.current = null;
        setPreview(null);
      };
    }, [drawMode, mapReady, onDrawComplete]);

    const targetFollowVehicle = focusPool.find((v) => v.id === (trackingId ?? selectedId));

    return (
      <div className="relative h-full w-full overflow-hidden rounded-lg">
        <div
          ref={containerRef}
          className="fleet-map h-full w-full rounded-lg border border-[var(--dash-border)]"
          style={{ height, minHeight: height === "100%" ? "480px" : undefined }}
        />

        {isPausedFollow && targetFollowVehicle && (
          <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
            <button
              type="button"
              onClick={() => {
                userMovedMap.current = false;
                setIsPausedFollow(false);
                const targetId = trackingId ?? selectedId;
                if (targetId) {
                  const anim = animStatesRef.current.get(targetId);
                  const coords = anim?.currentCoord ?? vehicleCoords(targetFollowVehicle);
                  if (coords) flyToVehicle(coords[0], coords[1], MAP_TRACKING_ZOOM);
                }
              }}
              className="flex items-center gap-2 rounded-full border border-emerald-500/60 bg-[var(--surface-deep)]/95 px-4 py-2 text-xs font-semibold text-emerald-400 shadow-2xl backdrop-blur-md hover:bg-emerald-500/20 transition cursor-pointer"
            >
              <Crosshair className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "3s" }} />
              <span>{targetFollowVehicle.plate_number} дээр дахин төвлөрөх</span>
            </button>
          </div>
        )}
      </div>
    );
  }),
);

export { coordsFromTelemetry };
