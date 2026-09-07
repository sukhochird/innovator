"use client";

import { memo, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { useChartTheme } from "@/hooks/useChartTheme";
import type { TelemetryData } from "@/lib/types";
import { cn } from "@/lib/utils";

type TimeRange = "1H" | "6H" | "12H" | "24H" | "7D";
type MetricKey = "speed" | "rpm" | "coolant" | "battery" | "engine_load";

const TIME_RANGES: { key: TimeRange; hours: number }[] = [
  { key: "1H", hours: 1 },
  { key: "6H", hours: 6 },
  { key: "12H", hours: 12 },
  { key: "24H", hours: 24 },
  { key: "7D", hours: 168 },
];

const METRICS: { key: MetricKey; label: string; color: string; get: (t: TelemetryData) => number | null | undefined }[] = [
  { key: "speed", label: "Speed", color: "#22d3ee", get: (t) => t.speed },
  { key: "rpm", label: "RPM", color: "#60a5fa", get: (t) => t.rpm },
  { key: "coolant", label: "Coolant", color: "#f59e0b", get: (t) => t.coolant_temperature },
  { key: "battery", label: "Battery", color: "#34d399", get: (t) => t.battery_voltage },
  { key: "engine_load", label: "Engine Load", color: "#a78bfa", get: (t) => t.engine_load },
];

interface TelemetryChartProps {
  history: TelemetryData[];
  live?: boolean;
}

export const TelemetryChart = memo(function TelemetryChart({
  history,
  live = true,
}: TelemetryChartProps) {
  const [range, setRange] = useState<TimeRange>("1H");
  const [selected, setSelected] = useState<MetricKey[]>(["speed", "rpm"]);

  const hours = TIME_RANGES.find((r) => r.key === range)?.hours ?? 1;
  const cutoff = Date.now() - hours * 60 * 60 * 1000;

  const chartData = useMemo(() => {
    return history
      .filter((t) => t.timestamp && new Date(t.timestamp).getTime() >= cutoff)
      .slice()
      .reverse()
      .map((t) => ({
        time: t.timestamp ? new Date(t.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
        speed: t.speed,
        rpm: t.rpm,
        coolant: t.coolant_temperature,
        battery: t.battery_voltage,
        engine_load: t.engine_load,
        ts: t.timestamp,
      }));
  }, [history, cutoff]);

  const toggleMetric = (key: MetricKey) => {
    setSelected((prev) => {
      if (prev.includes(key)) {
        return prev.length > 1 ? prev.filter((k) => k !== key) : prev;
      }
      if (prev.length >= 3) return [...prev.slice(1), key];
      return [...prev, key];
    });
  };

  const chartTheme = useChartTheme();

  return (
    <section className="rounded-2xl border border-[var(--dash-border)] bg-[var(--surface-elevated)] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--dash-text)]">Telemetry</h3>
          {live && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition",
                range === r.key
                  ? "bg-cyan-500/15 text-cyan-400"
                  : "text-[var(--dash-muted)] hover:text-[var(--dash-text-secondary)]",
              )}
            >
              {r.key}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => toggleMetric(m.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition",
              selected.includes(m.key)
                ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                : "border-[var(--dash-border)] text-[var(--dash-muted)] hover:text-[var(--dash-text-secondary)]",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-[var(--dash-muted)]">
          No telemetry available for this period.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fill: chartTheme.tick, fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: chartTheme.tick, fontSize: 10 }} width={40} />
            <Tooltip
              contentStyle={{
                background: chartTheme.tooltipBg,
                border: `1px solid ${chartTheme.tooltipBorder}`,
                borderRadius: 8,
                fontSize: 12,
                color: "var(--dash-text)",
              }}
            />
            {METRICS.filter((m) => selected.includes(m.key)).map((m) => (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                stroke={m.color}
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </section>
  );
});
