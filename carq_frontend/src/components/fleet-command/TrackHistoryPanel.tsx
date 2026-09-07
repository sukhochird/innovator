"use client";

import { memo, useState } from "react";
import { Loader2 } from "lucide-react";

import type { TrackHistoryResponse, TrackStatistics, Vehicle } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TrackHistoryPanelProps {
  vehicle: Vehicle | null;
  loading: boolean;
  stats: TrackStatistics | null;
  onLoad: (start: string, end: string) => void;
  onClose: () => void;
}

function toLocalInput(iso: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${iso.getFullYear()}-${pad(iso.getMonth() + 1)}-${pad(iso.getDate())}T${pad(iso.getHours())}:${pad(iso.getMinutes())}`;
}

export const TrackHistoryPanel = memo(function TrackHistoryPanel({
  vehicle,
  loading,
  stats,
  onLoad,
  onClose,
}: TrackHistoryPanelProps) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [start, setStart] = useState(toLocalInput(todayStart));
  const [end, setEnd] = useState(toLocalInput(now));

  const presets = [
    { label: "Today", hours: 0, today: true },
    { label: "Yesterday", hours: -48, today: false },
    { label: "Last 24h", hours: -24, today: false },
    { label: "Last 7 days", hours: -168, today: false },
  ];

  if (!vehicle) return null;

  return (
    <div className="absolute right-4 top-4 z-10 w-[300px] rounded-xl border border-[var(--dash-border)] bg-[var(--surface-deep)]/95 p-4 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[var(--dash-text)]">Track History</h4>
        <button type="button" onClick={onClose} className="text-[var(--dash-muted)]">×</button>
      </div>

      <p className="mt-1 text-xs text-[var(--dash-muted)]">
        {vehicle.make} {vehicle.model} · {vehicle.plate_number}
      </p>

      <div className="mt-3 flex flex-wrap gap-1">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              const endDt = new Date();
              let startDt: Date;
              if (p.today) {
                startDt = new Date();
                startDt.setHours(0, 0, 0, 0);
              } else if (p.label === "Yesterday") {
                startDt = new Date();
                startDt.setDate(startDt.getDate() - 1);
                startDt.setHours(0, 0, 0, 0);
                endDt.setDate(endDt.getDate() - 1);
                endDt.setHours(23, 59, 0, 0);
              } else {
                startDt = new Date(endDt.getTime() + p.hours * 3600000);
              }
              setStart(toLocalInput(startDt));
              setEnd(toLocalInput(endDt));
            }}
            className="rounded-md border border-[var(--dash-border)] px-2 py-1 text-[10px] text-[var(--dash-muted)] hover:bg-[var(--dash-hover)]"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        <label className="block text-xs text-[var(--dash-muted)]">
          From
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-2 py-1.5 text-xs text-[var(--dash-text)]"
          />
        </label>
        <label className="block text-xs text-[var(--dash-muted)]">
          To
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-2 py-1.5 text-xs text-[var(--dash-text)]"
          />
        </label>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={() => onLoad(new Date(start).toISOString(), new Date(end).toISOString())}
        className={cn(
          "mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-2 text-xs font-medium text-white hover:bg-violet-500",
          loading && "opacity-60",
        )}
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Load History
      </button>

      {stats && (
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[var(--dash-border)] pt-3 text-xs">
          <Stat label="Distance" value={`${stats.distance_km} km`} />
          <Stat label="Duration" value={stats.duration_display} />
          <Stat label="Avg speed" value={`${stats.average_speed_kmh} km/h`} />
          <Stat label="Max speed" value={`${stats.max_speed_kmh} km/h`} />
          <Stat label="Idle time" value={stats.idle_time_display} />
          <Stat label="Stops" value={String(stats.stops)} />
        </div>
      )}
    </div>
  );
});

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[var(--dash-muted)]">{label}</p>
      <p className="font-mono font-medium tabular-nums text-[var(--dash-text)]">{value}</p>
    </div>
  );
}

export function TrackStatisticsBar({ stats }: { stats: TrackStatistics | null }) {
  if (!stats) return null;
  return (
    <div className="flex flex-wrap gap-4 border-t border-[var(--dash-border)] px-4 py-2 text-xs">
      <span className="text-violet-400 font-semibold uppercase tracking-wide">History Playback</span>
      <StatInline label="Distance" value={`${stats.distance_km} km`} />
      <StatInline label="Duration" value={stats.duration_display} />
      <StatInline label="Avg" value={`${stats.average_speed_kmh} km/h`} />
      <StatInline label="Max" value={`${stats.max_speed_kmh} km/h`} />
    </div>
  );
}

function StatInline({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-[var(--dash-muted)]">
      {label}: <span className="font-mono text-[var(--dash-text)]">{value}</span>
    </span>
  );
}

export type { TrackHistoryResponse };
