"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";

import type { TelemetryData } from "@/lib/types";
import { cn } from "@/lib/utils";

const SPEEDS = [0.5, 1, 2, 4, 8];

interface TrackPlaybackProps {
  points: TelemetryData[];
  onPositionChange: (coord: [number, number] | null, heading: number, point: TelemetryData | null) => void;
  active: boolean;
}

export const TrackPlayback = memo(function TrackPlayback({
  points,
  onPositionChange,
  active,
}: TrackPlaybackProps) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const validPoints = points.filter((p) => p.latitude != null && p.longitude != null);

  useEffect(() => {
    if (!active) {
      setPlaying(false);
      setIndex(0);
    }
  }, [active]);

  useEffect(() => {
    if (!active || validPoints.length === 0) {
      onPositionChange(null, 0, null);
      return;
    }
    const p = validPoints[index];
    if (p?.latitude != null && p.longitude != null) {
      onPositionChange([p.longitude, p.latitude], p.heading ?? 0, p);
    }
  }, [index, validPoints, active, onPositionChange]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!playing || validPoints.length === 0) return;

    timerRef.current = setInterval(() => {
      setIndex((i) => {
        if (i >= validPoints.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 500 / speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, speed, validPoints.length]);

  const seek = useCallback(
    (pct: number) => {
      const idx = Math.round(pct * (validPoints.length - 1));
      setIndex(idx);
    },
    [validPoints.length],
  );

  if (!active || validPoints.length === 0) return null;

  const current = validPoints[index];
  const progress = validPoints.length > 1 ? index / (validPoints.length - 1) : 0;

  return (
    <div className="border-t border-[var(--dash-border)] bg-[var(--surface-deep)] px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-violet-400">
          History Playback
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="rounded p-1 text-[var(--dash-muted)] hover:bg-[var(--dash-hover)]"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="rounded-lg bg-violet-600 p-2 text-white hover:bg-violet-500"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(validPoints.length - 1, i + 1))}
            className="rounded p-1 text-[var(--dash-muted)] hover:bg-[var(--dash-hover)]"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={cn(
                "rounded px-2 py-0.5 text-[10px] font-medium",
                speed === s ? "bg-violet-500/20 text-violet-400" : "text-[var(--dash-muted)]",
              )}
            >
              {s}x
            </button>
          ))}
        </div>
        {current?.timestamp && (
          <span className="font-mono text-xs text-[var(--dash-muted)]">
            {new Date(current.timestamp).toLocaleTimeString()}
            {current.speed != null && ` · ${Math.round(current.speed)} km/h`}
          </span>
        )}
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={progress * 100}
        onChange={(e) => seek(Number(e.target.value) / 100)}
        className="mt-2 w-full accent-violet-500"
      />
    </div>
  );
});
