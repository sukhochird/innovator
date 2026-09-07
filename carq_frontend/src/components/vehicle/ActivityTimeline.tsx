"use client";

import { memo, useMemo } from "react";
import { AlertTriangle, Car, MapPin, Power } from "lucide-react";

import type { DTCCode, TelemetryData, VehicleAlert } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ActivityEvent {
  id: string;
  time: string;
  label: string;
  kind: "alert" | "dtc" | "trip" | "engine" | "stop";
  severity?: string;
}

interface ActivityTimelineProps {
  alerts: VehicleAlert[];
  dtc: DTCCode[];
  history: TelemetryData[];
}

export const ActivityTimeline = memo(function ActivityTimeline({
  alerts,
  dtc,
  history,
}: ActivityTimelineProps) {
  const events = useMemo(() => buildActivityEvents(alerts, dtc, history), [alerts, dtc, history]);

  const todayEvents = events.filter((e) => isToday(e.time));

  return (
    <section className="rounded-2xl border border-[var(--dash-border)] bg-[var(--surface-elevated)] p-5">
      <h3 className="mb-4 text-sm font-semibold text-[var(--dash-text)]">Activity</h3>

      {todayEvents.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--dash-muted)]">No activity recorded today.</p>
      ) : (
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--dash-muted)]">Today</p>
          <ul className="relative space-y-0 border-l border-[var(--dash-border)] pl-4">
            {todayEvents.map((event, i) => (
              <ActivityRow key={event.id} event={event} isLast={i === todayEvents.length - 1} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
});

function ActivityRow({ event, isLast }: { event: ActivityEvent; isLast: boolean }) {
  const Icon =
    event.kind === "alert" || event.kind === "dtc"
      ? AlertTriangle
      : event.kind === "engine"
        ? Power
        : event.kind === "stop"
          ? MapPin
          : Car;

  return (
    <li className={cn("relative pb-4", isLast && "pb-0")}>
      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface-elevated)] bg-[var(--dash-muted)]" />
      <div className="flex gap-3">
        <Icon
          className={cn(
            "mt-0.5 h-3.5 w-3.5 shrink-0",
            event.severity === "CRITICAL" && "text-red-400",
            event.severity === "WARNING" && "text-amber-400",
            !event.severity && "text-[var(--dash-muted)]",
          )}
          aria-hidden
        />
        <div>
          <p className="text-xs text-[var(--dash-muted)]">{formatTime(event.time)}</p>
          <p className="text-sm text-[var(--dash-text-secondary)]">{event.label}</p>
        </div>
      </div>
    </li>
  );
}

function buildActivityEvents(
  alerts: VehicleAlert[],
  dtc: DTCCode[],
  history: TelemetryData[],
): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  alerts.forEach((a) => {
    events.push({
      id: `alert-${a.id}`,
      time: a.created_at,
      label: a.message,
      kind: "alert",
      severity: a.severity,
    });
  });

  dtc.filter((d) => d.is_active).forEach((d) => {
    events.push({
      id: `dtc-${d.id}`,
      time: d.last_detected_at ?? d.first_detected_at ?? new Date().toISOString(),
      label: `Diagnostic trouble code detected — ${d.code}`,
      kind: "dtc",
      severity: d.severity,
    });
  });

  const sortedHistory = [...history]
    .filter((t) => t.timestamp)
    .sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());

  for (let i = 1; i < sortedHistory.length; i++) {
    const prev = sortedHistory[i - 1];
    const curr = sortedHistory[i];
    if (!curr.timestamp) continue;

    const wasMoving = (prev.speed ?? 0) > 5;
    const isMoving = (curr.speed ?? 0) > 5;

    if (!wasMoving && isMoving) {
      events.push({
        id: `trip-${i}`,
        time: curr.timestamp,
        label: "Trip started",
        kind: "trip",
      });
    }
    if (wasMoving && !isMoving) {
      events.push({
        id: `stop-${i}`,
        time: curr.timestamp,
        label: "Vehicle stopped",
        kind: "stop",
      });
    }
    if (!prev.ignition && curr.ignition) {
      events.push({
        id: `engine-${i}`,
        time: curr.timestamp,
        label: "Vehicle started",
        kind: "engine",
      });
    }
  }

  return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 20);
}

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
