"use client";

import { useAnimatedTelemetry } from "@/components/landing/hooks";
import { useI18n } from "@/components/providers/I18nProvider";

export function LiveVehicleDemo({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const v = useAnimatedTelemetry();

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-gradient-to-br from-[var(--landing-surface)] via-[var(--landing-bg-alt)] to-[var(--landing-surface)] shadow-2xl shadow-cyan-500/5 ${
        compact ? "p-4" : "p-6 md:p-8"
      }`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-400/80">
            {t.hero.liveLabel}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            {t.hero.online.replace("● ", "")}
          </span>
        </div>

        <div className="flex flex-col items-center py-4">
          <div
            className={`font-mono font-semibold tabular-nums text-[var(--landing-text)] transition-all duration-700 ${
              compact ? "text-5xl" : "text-6xl md:text-7xl"
            }`}
          >
            {v.speed}
          </div>
          <div className="mt-1 text-sm uppercase tracking-wider text-[var(--landing-muted)]">km/h</div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--landing-border)]/80 pt-4">
          {[
            { label: "RPM", value: v.rpm },
            { label: "TEMP", value: `${v.temp}°C` },
            { label: "BAT", value: `${v.battery}V` },
            { label: "LOAD", value: `${v.load}%` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-[var(--landing-surface-hover)]/60 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-[var(--landing-muted)]">{label}</div>
              <div className="font-mono text-sm tabular-nums text-[var(--landing-text)] transition-all duration-700">
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
