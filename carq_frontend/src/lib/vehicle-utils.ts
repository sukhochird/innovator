export type MetricStatus = "normal" | "warning" | "critical";

export type HealthLevel = "GOOD" | "ATTENTION" | "WARNING" | "CRITICAL";

export type ConnectionState = "live" | "reconnecting" | "offline";

export function getMetricStatus(
  value: number | null | undefined,
  warning: number,
  critical: number,
  higherIsBad = true,
): MetricStatus {
  if (value == null) return "normal";
  if (higherIsBad) {
    if (value >= critical) return "critical";
    if (value >= warning) return "warning";
  } else {
    if (value <= critical) return "critical";
    if (value <= warning) return "warning";
  }
  return "normal";
}

export function statusLabel(status: MetricStatus): string {
  switch (status) {
    case "critical":
      return "Critical";
    case "warning":
      return "Warning";
    default:
      return "Normal";
  }
}

export function computeHealthScore(input: {
  alerts: Array<{ severity: string }>;
  dtc: Array<{ severity: string; is_active: boolean }>;
  isOnline: boolean;
  coolant?: number | null;
  battery?: number | null;
}): { score: number; level: HealthLevel } {
  let score = 100;

  if (!input.isOnline) score -= 25;

  for (const a of input.alerts) {
    if (a.severity === "CRITICAL") score -= 18;
    else if (a.severity === "WARNING") score -= 10;
    else score -= 4;
  }

  for (const d of input.dtc.filter((x) => x.is_active)) {
    if (d.severity === "CRITICAL") score -= 15;
    else score -= 8;
  }

  if (input.coolant != null) {
    if (input.coolant >= 105) score -= 12;
    else if (input.coolant >= 95) score -= 6;
  }

  if (input.battery != null) {
    if (input.battery < 11.5) score -= 10;
    else if (input.battery < 12) score -= 5;
  }

  score = Math.max(0, Math.min(100, score));

  let level: HealthLevel = "GOOD";
  if (score < 40) level = "CRITICAL";
  else if (score < 70) level = "WARNING";
  else if (score < 90) level = "ATTENTION";

  return { score, level };
}

export function deriveConnectionState(
  wsConnected: boolean,
  vehicleStatus: string,
  isOnline?: boolean,
): ConnectionState {
  if (vehicleStatus === "OFFLINE" || isOnline === false) return "offline";
  if (!wsConnected) return "reconnecting";
  return "live";
}

export function formatSecondsAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 5) return "Just now";
  if (sec < 60) return `${sec} sec ago`;
  const mins = Math.floor(sec / 60);
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export function formatCoord(lat?: number | null, lng?: number | null): string {
  if (lat == null || lng == null) return "—";
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
