import type { TelemetryData, Vehicle } from "@/lib/types";

export const DEFAULT_MAP_CENTER: [number, number] = [106.917, 47.918];

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

export function statusColor(status: string): string {
  if (status === "MOVING") return "#34d399";
  if (status === "IDLE") return "#fbbf24";
  if (status === "STOPPED") return "#71717a";
  if (status === "ALERT") return "#f87171";
  if (status === "OFFLINE") return "#52525b";
  return "#22d3ee";
}

export function vehicleMarkerHtml(plate: string, status: string, selected = false): string {
  const color = statusColor(status);
  const scale = selected ? 1.15 : 1;
  return `
    <div style="display:flex;flex-direction:column;align-items:center;width:48px;transform:scale(${scale});">
      <svg width="36" height="36" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="2.5"/>
        <path d="M20 8 L28 30 L20 25 L12 30 Z" fill="${color}" stroke="#0b0d10" stroke-width="1.2"/>
      </svg>
      <div style="
        margin-top:2px;padding:1px 6px;border-radius:4px;
        background:rgba(11,13,16,0.85);border:1px solid ${color}66;
        font-family:ui-monospace,monospace;font-size:9px;font-weight:600;
        color:${color};white-space:nowrap;max-width:72px;overflow:hidden;text-overflow:ellipsis;
      ">${plate}</div>
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
    const lat = toNum(v.current_telemetry?.latitude);
    const lng = toNum(v.current_telemetry?.longitude);
    if (lat != null && lng != null) coords.push([lng, lat]);
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
