"use client";

import { memo, useEffect, useRef } from "react";
import { Radio, RefreshCw } from "lucide-react";

import { useVehicleRawLogs } from "@/hooks/useVehicleRawLogs";
import type { TelemetryRawLog } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logs]);

  const terminalTitle = deviceSerial ? `device://${deviceSerial}` : "device://raw-stream";

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--dash-border)] bg-[var(--surface-elevated)]">
      {/* Terminal chrome */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--dash-border)] bg-[#0d1117] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <Radio className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            <span className="truncate font-mono text-xs text-[#8b949e]">{terminalTitle}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-[#6e7681]">
          <span>{data?.count ?? 0} packets</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden text-emerald-500/80 sm:inline">tail -f</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1 rounded border border-[#30363d] px-2 py-0.5 text-[#8b949e] transition hover:border-emerald-500/30 hover:text-emerald-400"
          >
            <RefreshCw className={cn("h-3 w-3", isFetching && "animate-spin")} />
            refresh
          </button>
        </div>
      </div>

      {/* Terminal body */}
      <div
        ref={scrollRef}
        className="max-h-[480px] overflow-y-auto bg-[#0a0e14] p-4 font-mono text-[11px] leading-relaxed"
      >
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-[#161b22]" style={{ width: `${70 - i * 10}%` }} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-[#6e7681]">
            <span className="text-emerald-500/70">$</span> waiting for device packets…
          </p>
        ) : (
          <div className="space-y-3">
            {[...logs].reverse().map((log) => (
              <TerminalLogBlock key={log.id} log={log} />
            ))}
          </div>
        )}

        {!isLoading && logs.length > 0 && (
          <p className="mt-4 text-[#484f58]">
            <span className="animate-pulse text-emerald-500">▋</span>
          </p>
        )}
      </div>
    </section>
  );
});

function TerminalLogBlock({ log }: { log: TelemetryRawLog }) {
  const ts = formatTerminalTime(log.timestamp);
  const raw = log.raw_payload ?? {};
  const tlv = (raw.tlv as Record<string, unknown> | undefined) ?? {};
  const hex =
    typeof raw.packet_hex === "string" && raw.packet_hex.length > 0
      ? raw.packet_hex
      : null;

  return (
    <div className="group border-l-2 border-transparent pl-3 transition hover:border-emerald-500/40">
      {/* Primary line */}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-[#6e7681]">[{ts}]</span>
        <span className="text-cyan-400">IN</span>
        <span className="text-[#79c0ff]">{log.protocol}</span>
        {raw.msg_id != null && (
          <span className="text-[#a5d6ff]">{String(raw.msg_id)}</span>
        )}
        {raw.terminal_phone != null && (
          <span className="text-[#8b949e]">
            phone=<span className="text-[#d2a8ff]">{String(raw.terminal_phone)}</span>
          </span>
        )}
        {log.speed != null && (
          <span className="text-[#8b949e]">
            speed=<span className="text-emerald-400">{Math.round(log.speed)}</span>
          </span>
        )}
        {log.latitude != null && log.longitude != null && (
          <span className="text-[#8b949e]">
            gps=<span className="text-amber-300/90">
              {Number(log.latitude).toFixed(5)},{Number(log.longitude).toFixed(5)}
            </span>
          </span>
        )}
      </div>

      {/* TLV line */}
      {Object.keys(tlv).length > 0 && (
        <div className="mt-0.5 pl-4 text-[#8b949e]">
          <span className="text-[#484f58]">└─ </span>
          tlv{" "}
          {Object.entries(tlv).map(([k, v], i) => (
            <span key={k}>
              {i > 0 && " "}
              <span className="text-[#79c0ff]">{k}</span>=
              <span className="text-emerald-400/90">{formatTlvValue(v)}</span>
            </span>
          ))}
        </div>
      )}

      {/* Hex line */}
      {hex && (
        <div className="mt-0.5 break-all pl-4 text-[#8b949e]">
          <span className="text-[#484f58]">└─ </span>
          hex <span className="text-amber-400/80">{formatHex(hex)}</span>
        </div>
      )}

      {/* Raw JSON */}
      <div className="mt-0.5 pl-4 text-[#6e7681]">
        <span className="text-[#484f58]">└─ </span>
        <span className="text-[#8b949e]">raw </span>
        <span className="whitespace-pre-wrap break-all text-[#7ee787]/80">
          {JSON.stringify(raw)}
        </span>
      </div>
    </div>
  );
}

function formatTerminalTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

function formatTlvValue(v: unknown): string {
  if (Array.isArray(v)) return v.join(",");
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(1);
  return String(v);
}

function formatHex(hex: string): string {
  const chunks: string[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    chunks.push(hex.slice(i, i + 2));
  }
  return chunks.join(" ");
}
