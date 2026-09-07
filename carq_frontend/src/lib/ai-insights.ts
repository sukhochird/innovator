import { getDtcKnowledge } from "@/lib/dtc-knowledge";
import type { Device, FleetAlert, FleetDTC, Vehicle } from "@/lib/types";

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

export function generateVehiclesInsight(vehicles: Vehicle[]): AiInsight {
  if (vehicles.length === 0) {
    return {
      headline: "No vehicles in fleet",
      body: "Register vehicles and assign OBD devices to start live tracking, alerts, and diagnostics.",
      priority: "info",
      tags: ["onboarding", "fleet"],
    };
  }

  const moving = vehicles.filter((v) => (v.current_telemetry?.status ?? v.status) === "MOVING").length;
  const alert = vehicles.filter((v) => (v.current_telemetry?.status ?? v.status) === "ALERT").length;
  const offline = vehicles.filter((v) => (v.current_telemetry?.status ?? v.status) === "OFFLINE").length;
  const noDevice = vehicles.filter((v) => !v.device_serial).length;

  if (alert > 0) {
    const flagged = vehicles.find((v) => (v.current_telemetry?.status ?? v.status) === "ALERT");
    return {
      headline: `${alert} vehicle${alert > 1 ? "s" : ""} in alert state`,
      body: `Review ${flagged?.plate_number ?? "flagged units"} first — check active alerts and DTC codes before next dispatch. ${moving} vehicle${moving !== 1 ? "s" : ""} currently moving.`,
      priority: "critical",
      tags: ["alert", "dispatch", "maintenance"],
    };
  }

  if (offline > vehicles.length * 0.4) {
    return {
      headline: "Large portion of fleet offline",
      body: `${offline} of ${vehicles.length} vehicles not reporting GPS. Verify device power, antenna, and JT808 connectivity on offline units.`,
      priority: "action",
      tags: ["offline", "connectivity"],
    };
  }

  if (noDevice > 0) {
    return {
      headline: `${moving} moving · ${vehicles.length - moving} stationary`,
      body: `${noDevice} vehicle${noDevice > 1 ? "s" : ""} without assigned device — pair hardware to unlock map tracking and geofence alerts.`,
      priority: "watch",
      tags: ["assignment", "devices"],
    };
  }

  return {
    headline: "Fleet operations nominal",
    body: `${moving} vehicle${moving !== 1 ? "s" : ""} active on the road. Monitor coolant and battery trends during long idle periods.`,
    priority: "info",
    tags: ["healthy", "monitoring"],
  };
}

export function generateOperationsInsight(input: {
  fleet: { total: number; moving: number; offline: number; alert: number };
  alerts: { critical: number; warning: number };
  dtc: { active: number };
}): AiInsight {
  const { fleet, alerts, dtc } = input;

  if (fleet.total === 0) {
    return {
      headline: "Welcome to CARQ",
      body: "Add vehicles and devices to start monitoring. Your operations dashboard will show alerts, diagnostics, and fleet health here.",
      priority: "info",
      tags: ["onboarding"],
    };
  }

  if (alerts.critical > 0) {
    return {
      headline: `${alerts.critical} critical alert${alerts.critical > 1 ? "s" : ""} require action`,
      body: `Review the alerts feed immediately. ${fleet.moving} vehicles moving, ${fleet.offline} offline. Open Fleet Map for live positions.`,
      priority: "critical",
      tags: ["alerts", "urgent"],
    };
  }

  if (dtc.active > 0) {
    return {
      headline: `${dtc.active} active diagnostic code${dtc.active > 1 ? "s" : ""}`,
      body: `Schedule workshop checks for affected vehicles. ${alerts.warning} warning-level alert${alerts.warning !== 1 ? "s" : ""} also active.`,
      priority: "action",
      tags: ["dtc", "maintenance"],
    };
  }

  if (fleet.offline > fleet.total * 0.3) {
    return {
      headline: "Connectivity needs attention",
      body: `${fleet.offline} of ${fleet.total} vehicles offline. Check device assignments and JT808 connectivity before peak hours.`,
      priority: "watch",
      tags: ["offline", "devices"],
    };
  }

  return {
    headline: `Today: ${fleet.moving} active · ${fleet.total} total`,
    body: `Fleet is ${alerts.critical + alerts.warning === 0 ? "clear of critical issues" : "mostly stable"}. Use Fleet Map for live tracking or review vehicle health below.`,
    priority: "info",
    tags: ["overview", "healthy"],
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
