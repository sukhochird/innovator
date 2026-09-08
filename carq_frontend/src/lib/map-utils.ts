import type { StyleSpecification } from "maplibre-gl";

import type { Theme } from "@/lib/theme-store";
import type { TelemetryData, Vehicle } from "@/lib/types";

export const DEFAULT_MAP_CENTER: [number, number] = [106.91685752514958, 47.921482718244036];

export const MAP_FOCUS_ZOOM = 18;
export const MAP_TRACKING_ZOOM = 18;
export const MAP_DEFAULT_ZOOM = 13;
export const MAP_FIT_FLEET_MAX_ZOOM = 16;

export type MapViewId = "standard" | "dark" | "satellite";

export interface MapViewConfig {
  id: MapViewId;
  label: string;
  attribution: string;
  /** Remote MapLibre style JSON — no API key */
  styleUrl?: string;
  /** Inline raster tiles — no API key */
  tiles?: string;
}

export const MAP_VIEWS: MapViewConfig[] = [
  {
    id: "standard",
    label: "Standard",
    // Inline raster — reliable, no API key (OSM data via osm.de)
    tiles: "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
  },
  {
    id: "dark",
    label: "Dark",
    styleUrl: "https://tiles.openfreemap.org/styles/dark",
    attribution: "© OpenFreeMap © OpenStreetMap",
  },
  {
    id: "satellite",
    label: "Satellite",
    tiles: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "© Esri",
  },
];

export function mapViewForTheme(_theme: Theme): MapViewId {
  return "standard";
}

export function getMapView(id: MapViewId): MapViewConfig {
  return MAP_VIEWS.find((v) => v.id === id) ?? MAP_VIEWS[0];
}

function createRasterStyle(tiles: string, attribution: string): StyleSpecification {
  return {
    version: 8,
    sources: {
      basemap: {
        type: "raster",
        tiles: [tiles],
        tileSize: 256,
        maxzoom: 19,
        attribution,
      },
    },
    layers: [{ id: "basemap", type: "raster", source: "basemap" }],
  };
}

/** MapLibre style URL or inline raster style — all providers are key-free. */
export function getMapStyle(viewId: MapViewId): string | StyleSpecification {
  const view = getMapView(viewId);
  if (view.styleUrl) return view.styleUrl;
  if (view.tiles) return createRasterStyle(view.tiles, view.attribution);
  return createRasterStyle(MAP_VIEWS[0].tiles!, MAP_VIEWS[0].attribution);
}

/** @deprecated use getMapStyle */
export function createMapStyle(viewId: MapViewId) {
  return getMapStyle(viewId);
}

/** @deprecated use getMapStyle */
export function createOsmMapStyle() {
  return getMapStyle("standard");
}

export function normalizeRectangleBounds(
  a: [number, number],
  b: [number, number],
): [[number, number], [number, number]] {
  return [
    [Math.min(a[0], b[0]), Math.min(a[1], b[1])],
    [Math.max(a[0], b[0]), Math.max(a[1], b[1])],
  ];
}

export function vehicleCoords(v: Vehicle): [number, number] | null {
  const lat = toNum(v.current_telemetry?.latitude);
  const lng = toNum(v.current_telemetry?.longitude);
  if (lat == null || lng == null) return null;
  return [lng, lat];
}

export function toNum(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

export function buildRouteCoords(
  history: TelemetryData[],
  current: TelemetryData | null,
): [number, number][] {
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

export function coordsFromTelemetry(points: TelemetryData[]): [number, number][] {
  const coords: [number, number][] = [];
  for (const t of points) {
    const lat = toNum(t.latitude);
    const lng = toNum(t.longitude);
    if (lat == null || lng == null) continue;
    const last = coords[coords.length - 1];
    if (last && last[0] === lng && last[1] === lat) continue;
    coords.push([lng, lat]);
  }
  return coords;
}

export function lerpAngle(start: number, end: number, t: number): number {
  let diff = (end - start) % 360;
  if (diff < -180) diff += 360;
  if (diff > 180) diff -= 360;
  return start + diff * t;
}

export function lerpCoord(
  a: [number, number],
  b: [number, number],
  t: number,
): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function statusColor(status: string): string {
  if (status === "MOVING") return "#10b981"; // Vibrant emerald
  if (status === "IDLE") return "#f59e0b"; // Warm amber
  if (status === "STOPPED") return "#71717a"; // Zinc
  if (status === "ALERT") return "#ef4444"; // Rose/Red
  if (status === "OFFLINE") return "#52525b"; // Dark grey
  return "#06b6d4"; // Cyan
}

export interface VehicleMarkerOptions {
  plate: string;
  status: string;
  selected?: boolean;
  tracking?: boolean;
  speed?: number | null;
  heading?: number;
  ignition?: boolean | null;
}

export function vehicleMarkerHtml(
  plateOrOpts: string | VehicleMarkerOptions,
  legacyStatus?: string,
  legacySelected?: boolean,
): string {
  let plate = "";
  let status = "STOPPED";
  let selected = false;
  let tracking = false;
  let speed: number | null = null;
  let heading = 0;
  let ignition: boolean | null = null;

  if (typeof plateOrOpts === "object") {
    plate = plateOrOpts.plate;
    status = plateOrOpts.status;
    selected = !!plateOrOpts.selected;
    tracking = !!plateOrOpts.tracking;
    speed = plateOrOpts.speed ?? null;
    heading = plateOrOpts.heading ?? 0;
    ignition = plateOrOpts.ignition ?? null;
  } else {
    plate = plateOrOpts;
    status = legacyStatus ?? "STOPPED";
    selected = !!legacySelected;
  }

  const isEngaged = selected || tracking;
  const isIgnitionOn = ignition === true || (ignition == null && (status === "MOVING" || status === "IDLE"));
  const color = statusColor(status);
  const isMoving = (speed != null && speed >= 2) || status === "MOVING";
  const speedText = speed != null && speed >= 1 ? `${Math.round(speed)}` : "";

  // Headlight beam glow when engine is on
  const headlightBeam = isIgnitionOn
    ? `<path d="M10 5 L2 -16 L14 -18 L13 5 Z" fill="url(#hbeam)" opacity="0.35"/>
       <path d="M24 5 L21 -18 L33 -16 L25 5 Z" fill="url(#hbeam)" opacity="0.35"/>`
    : "";

  return `
    <div class="car-marker-container ${isEngaged ? "engaged" : ""} ${isMoving ? "moving" : ""}">
      ${isEngaged ? `<div class="marker-pulse-ring" style="border-color:${color};"></div>` : ""}

      <!-- Rotatable Car Silhouette -->
      <div class="car-silhouette-wrapper" style="transform: rotate(${Math.round(heading)}deg);">
        <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="car-svg">
          <defs>
            <linearGradient id="hbeam" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8"/>
              <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
            </linearGradient>
            <radialGradient id="engGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="${color}" stop-opacity="0.6"/>
              <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
            </radialGradient>
          </defs>

          ${headlightBeam}

          <!-- Car Drop Shadow -->
          <rect x="6" y="7" width="24" height="36" rx="7" fill="rgba(0,0,0,0.5)" filter="blur(2px)"/>

          <!-- Main Chassis -->
          <rect x="7" y="6" width="22" height="36" rx="6" fill="#0f1115" stroke="${color}" stroke-width="${isEngaged ? "2.5" : "1.8"}"/>

          <!-- Engine Hood Glow if ON -->
          ${isIgnitionOn ? `<ellipse cx="18" cy="14" rx="7" ry="5" fill="url(#engGlow)"/>` : ""}

          <!-- Windshield (Front) -->
          <path d="M10 16 H26 L24 22 H12 Z" fill="${color}" fill-opacity="${isEngaged ? "0.9" : "0.75"}"/>

          <!-- Side Mirrors -->
          <rect x="5" y="16" width="2" height="4" rx="1" fill="${color}"/>
          <rect x="29" y="16" width="2" height="4" rx="1" fill="${color}"/>

          <!-- Roof -->
          <rect x="11.5" y="22" width="13" height="10" rx="2" fill="#1b1f26"/>

          <!-- Rear Window -->
          <path d="M12 33 H24 L25 36 H11 Z" fill="${color}" fill-opacity="0.5"/>

          <!-- Directional Arrow / Headlight Bulbs -->
          <circle cx="10.5" cy="7.5" r="1.5" fill="${isIgnitionOn ? "#ffffff" : color}"/>
          <circle cx="25.5" cy="7.5" r="1.5" fill="${isIgnitionOn ? "#ffffff" : color}"/>
          <path d="M18 8.5 L21.5 12.5 H14.5 Z" fill="${color}"/>
        </svg>
      </div>

      <!-- Upright Horizontal Label Badge (Does not rotate with car heading) -->
      <div class="car-marker-label" style="border-color: ${color}88;">
        <div class="car-label-row">
          <span class="car-ignition-dot ${isIgnitionOn ? "acc-on" : "acc-off"}" title="${isIgnitionOn ? "Мотор: Асаалттай (ACC ON)" : "Мотор: Унтраастай (ACC OFF)"}"></span>
          <span class="car-plate-text">${plate}</span>
          ${speedText ? `<span class="car-speed-badge">${speedText}<span class="unit">km/h</span></span>` : ""}
        </div>
      </div>
    </div>
  `;
}

export function startMarkerHtml(): string {
  return `<div style="width:14px;height:14px;border-radius:50%;background:#34d399;border:2px solid #fff;box-shadow:0 0 8px rgba(52,211,153,0.6);"></div>`;
}

export function endMarkerHtml(): string {
  return `<div style="width:14px;height:14px;border-radius:50%;background:#f87171;border:2px solid #fff;box-shadow:0 0 8px rgba(248,113,113,0.6);"></div>`;
}

export function computeFleetBounds(
  vehicles: Vehicle[],
): [[number, number], [number, number]] | null {
  const coords: [number, number][] = [];
  for (const v of vehicles) {
    const c = vehicleCoords(v);
    if (c) coords.push(c);
  }
  if (coords.length === 0) return null;
  if (coords.length === 1) return [coords[0], coords[0]];
  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

export function computeCoordsBounds(
  coords: [number, number][],
): [[number, number], [number, number]] | null {
  if (coords.length === 0) return null;
  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

export function recomputeFleetStats(vehicles: Vehicle[]) {
  const stats = {
    total: vehicles.length,
    online: 0,
    offline: 0,
    moving: 0,
    idle: 0,
    stopped: 0,
    alert: 0,
  };
  for (const v of vehicles) {
    const status = v.current_telemetry?.status ?? v.status;
    if (status === "MOVING") {
      stats.moving += 1;
      stats.online += 1;
    } else if (status === "IDLE") {
      stats.idle += 1;
      stats.online += 1;
    } else if (status === "STOPPED") {
      stats.stopped += 1;
      stats.online += 1;
    } else if (status === "ALERT") {
      stats.alert += 1;
      stats.online += 1;
    } else if (status === "OFFLINE") {
      stats.offline += 1;
    } else {
      stats.online += 1;
    }
  }
  return stats;
}
