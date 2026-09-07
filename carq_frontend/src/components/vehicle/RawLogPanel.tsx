"use client";

import { memo, useState } from "react";
import { ChevronDown, ChevronRight, Radio, RefreshCw } from "lucide-react";

import { useVehicleRawLogs } from "@/hooks/useVehicleRawLogs";
import type { TelemetryRawLog } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

interface RawLogPanelProps {
  vehicleId: number;
  deviceSerial?: string | null;
}

export const RawLogPanel = memo(function RawLogPanel({
  vehicleId,
  deviceSerial,
}: RawLogPanelProps) {
  const { data, isLoading, isFetching, refetch } = useVehicleRawLogs(vehicleId);
  const logs = data?.results ?? [];

  return (
    <section className="rounded-2xl border border-[var(--dash-border)] bg-[var(--surface-elevated)] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-cyan-500" />
          <h3 className="text-sm font-semibold text-[var(--dash-text)]">Device Raw Log</h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--dash-muted)]">
          {deviceSerial && <span className="font-mono">{deviceSerial}</span>}
          <span>{data?.count ?? 0} rows</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--dash-border)] px-2 py-1 hover:text-[var(--dash-text)]"
          >
            <RefreshCw className={cn("h-3 w-3", isFetching && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-[var(--skeleton)]" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--dash-muted)]">
          No device packets recorded yet.
        </p>
      ) : (
        <div className="max-h-[480px] overflow-y-auto rounded-lg border border-[var(--dash-border)]">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 border-b border-[var(--dash-border)] bg-[var(--dash-card)]">
              <tr className="text-[var(--dash-muted)]">
                <th className="px-3 py-2 font-medium">Time</th>
                <th className="px-3 py-2 font-medium">Protocol</th>
                <th className="px-3 py-2 font-medium">Speed</th>
                <th className="px-3 py-2 font-medium">Summary</th>
                <th className="px-3 py-2 font-medium">Raw</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <RawLogRow key={log.id} log={log} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
});

function RawLogRow({ log }: { log: TelemetryRawLog }) {
  const [open, setOpen] = useState(false);
  const summary = buildSummary(log.raw_payload);

  return (
    <>
      <tr className="border-b border-[var(--dash-border)]/60 hover:bg-[var(--dash-card)]/40">
        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[var(--dash-text-secondary)]">
          <div>{formatRelativeTime(log.timestamp)}</div>
          <div className="text-[10px] text-[var(--dash-muted)]">
            {new Date(log.timestamp).toLocaleTimeString()}
          </div>
        </td>
        <td className="px-3 py-2.5">
          <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-cyan-400">
            {log.protocol}
          </span>
        </td>
        <td className="px-3 py-2.5 font-mono tabular-nums text-[var(--dash-text)]">
          {log.speed != null ? `${Math.round(log.speed)} km/h` : "—"}
        </td>
        <td className="max-w-[220px] truncate px-3 py-2.5 text-[var(--dash-muted)]" title={summary}>
          {summary}
        </td>
        <td className="px-3 py-2.5">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-cyan-500 hover:text-cyan-400"
          >
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            JSON
          </button>
        </td>
      </tr>
      {open && (
        <tr className="border-b border-[var(--dash-border)]/60 bg-[var(--dash-bg)]/50">
          <td colSpan={5} className="px-3 py-3">
            <pre className="max-h-64 overflow-auto rounded-lg border border-[var(--dash-border)] bg-[var(--dash-card)] p-3 font-mono text-[11px] leading-relaxed text-[var(--dash-text-secondary)]">
              {JSON.stringify(log.raw_payload, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

function buildSummary(raw: Record<string, unknown>): string {
  if (!raw || typeof raw !== "object") return "—";
  const parts: string[] = [];
  if (raw.terminal_phone) parts.push(`phone:${raw.terminal_phone}`);
  if (raw.msg_id) parts.push(String(raw.msg_id));
  if (raw.serial_number) parts.push(String(raw.serial_number));
  const tlv = raw.tlv;
  if (tlv && typeof tlv === "object") {
    const t = tlv as Record<string, unknown>;
    if (t.rpm != null) parts.push(`rpm:${t.rpm}`);
    if (t.dtc_codes) parts.push(`dtc:${(t.dtc_codes as string[]).join(",")}`);
  }
  if (raw.packet_hex && typeof raw.packet_hex === "string") {
    parts.push(`hex:${raw.packet_hex.slice(0, 16)}…`);
  }
  return parts.length > 0 ? parts.join(" · ") : JSON.stringify(raw).slice(0, 80);
}
