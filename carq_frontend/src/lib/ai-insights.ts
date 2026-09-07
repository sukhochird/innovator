import { getDtcKnowledge } from "@/lib/dtc-knowledge";
import type { Device, FleetAlert, FleetDTC } from "@/lib/types";

export interface AiInsight {
  headline: string;
  body: string;
  priority: "info" | "watch" | "action" | "critical";
  tags: string[];
}

export function generateAlertsInsight(
  alerts: FleetAlert[],
  summary: { critical: number; warning: number },
): AiInsight {
  if (alerts.length === 0) {
    return {
      headline: "Fleet is clear",
      body: "No active alerts across your fleet. Continue monitoring coolant, battery, and speed thresholds.",
      priority: "info",
      tags: ["healthy", "monitoring"],
    };
  }

  const critical = alerts.filter((a) => a.severity === "CRITICAL");
  const byVehicle = groupBy(alerts, (a) => a.vehicle_plate);
  const repeatVehicle = Object.entries(byVehicle).sort((a, b) => b[1].length - a[1].length)[0];

  if (summary.critical > 0) {
    const top = critical[0];
    return {
      headline: `${summary.critical} critical alert${summary.critical > 1 ? "s" : ""} need immediate review`,
      body: `Highest priority: ${top.vehicle_plate} — ${top.message}. ${
        repeatVehicle && repeatVehicle[1].length > 1
          ? `${repeatVehicle[0]} has ${repeatVehicle[1].length} active alerts; inspect before next dispatch.`
          : "Assign a technician to the affected vehicle within 24 hours."
      }`,
      priority: "critical",
      tags: ["critical", "dispatch", "maintenance"],
    };
  }

  const coolant = alerts.filter((a) => a.type.includes("COOLANT"));
  if (coolant.length > 0) {
    return {
      headline: "Thermal stress detected in fleet",
      body: `${coolant.length} coolant-related warning${coolant.length > 1 ? "s" : ""}. Check radiator, coolant level, and fan operation on ${coolant[0].vehicle_plate} first.`,
      priority: "action",
      tags: ["coolant", "thermal", "preventive"],
    };
  }

  return {
    headline: `${summary.warning} warning${summary.warning !== 1 ? "s" : ""} under control`,
    body: "No critical failures, but schedule maintenance for flagged vehicles this week to prevent escalation.",
    priority: "watch",
    tags: ["warning", "scheduled"],
  };
}

export function generateDtcInsight(codes: FleetDTC[], summary: { critical: number }): AiInsight {
  if (codes.length === 0) {
    return {
      headline: "Diagnostics look healthy",
      body: "No active OBD-II trouble codes. Next scan recommended after 5,000 km or if MIL illuminates.",
      priority: "info",
      tags: ["obd", "clear"],
    };
  }

  const sorted = [...codes].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  const top = sorted[0];
  const knowledge = getDtcKnowledge(top.code);

  const sameCode = codes.filter((c) => c.code === top.code);
  const multiVehicle = new Set(sameCode.map((c) => c.vehicle_id)).size > 1;

  return {
    headline: `${codes.length} active code${codes.length > 1 ? "s" : ""} — prioritize ${top.code}`,
    body: knowledge
      ? `${top.vehicle_plate}: ${knowledge.title}. ${knowledge.action}${
          multiVehicle ? ` Same code on ${sameCode.length} records — possible batch/part issue.` : ""
        }`
      : `${top.vehicle_plate} reported ${top.code}. Review live telemetry and schedule workshop diagnosis.`,
    priority: summary.critical > 0 || top.severity === "CRITICAL" ? "critical" : "action",
    tags: [top.code, top.severity.toLowerCase(), "workshop"],
  };
}

export function generateDevicesInsight(devices: Device[]): AiInsight {
  const online = devices.filter((d) => d.is_online).length;
  const offline = devices.filter((d) => !d.is_online && d.vehicle_id).length;
  const unassigned = devices.filter((d) => !d.vehicle_id).length;
  const blocked = devices.filter((d) => d.status === "BLOCKED").length;

  if (devices.length === 0) {
    return {
      headline: "No devices registered",
      body: "Provision OBD hardware and assign devices to vehicles to enable live telemetry.",
      priority: "info",
      tags: ["onboarding"],
    };
  }

  const offlineList = devices.filter((d) => !d.is_online && d.vehicle_id);
  const stale = offlineList[0];

  if (offline > devices.length * 0.3) {
    return {
      headline: "Connectivity gap detected",
      body: `${offline} assigned devices are offline. Check SIM/GPS antenna on ${stale?.serial_number ?? "affected units"} and verify JT808 port reachability.`,
      priority: "critical",
      tags: ["offline", "connectivity", "jt808"],
    };
  }

  if (unassigned > 0) {
    return {
      headline: `${online}/${devices.length} devices online`,
      body: `${unassigned} device${unassigned > 1 ? "s" : ""} unassigned — pair with vehicles to unlock fleet map and alerts. ${
        blocked > 0 ? `${blocked} blocked unit(s) need admin review.` : ""
      }`,
      priority: "watch",
      tags: ["assignment", "fleet"],
    };
  }

  return {
    headline: "Hardware fleet is stable",
    body: `${online} of ${devices.length} devices reporting live. Signal and firmware look nominal — continue standard health checks.`,
    priority: "info",
    tags: ["online", "healthy"],
  };
}

function severityRank(s: string): number {
  if (s === "CRITICAL") return 3;
  if (s === "WARNING") return 2;
  return 1;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const k = keyFn(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {});
}
