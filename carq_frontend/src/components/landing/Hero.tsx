"use client";

import { LiveVehicleDemo } from "@/components/landing/LiveVehicleDemo";
import { useI18n } from "@/components/providers/I18nProvider";

export function Hero({ onDemo, onQuote }: { onDemo: () => void; onQuote: () => void }) {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(6,182,212,0.15),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 md:px-8 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-cyan-400/90">
            CARQ Platform
          </p>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-[var(--landing-text)] md:text-5xl lg:text-6xl">
            {t.hero.title}
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {t.hero.titleLine2}
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--landing-muted)] md:text-lg">
            {t.hero.description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onDemo}
              className="rounded-lg bg-cyan-500 px-6 py-3.5 text-sm font-semibold text-[#09090b] transition hover:bg-cyan-400"
            >
              {t.hero.primaryCta}
            </button>
            <button
              onClick={onQuote}
              className="rounded-lg border border-[var(--landing-border)] bg-[var(--landing-surface-hover)]/50 px-6 py-3.5 text-sm font-semibold text-[var(--landing-text)] transition hover:border-[var(--landing-border)] hover:bg-[var(--landing-surface-hover)]/50"
            >
              {t.hero.secondaryCta}
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-cyan-500/10 blur-3xl" />
          <LiveVehicleDemo />
          <MiniFleetPreview />
        </div>
      </div>
    </section>
  );
}

function MiniFleetPreview() {
  return (
    <div className="mt-4 hidden rounded-xl border border-[var(--landing-border)]/80 bg-[var(--landing-surface)]/80 p-3 md:block">
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--landing-muted)]">
        <span>Fleet Overview</span>
        <span className="text-emerald-400">42 online</span>
      </div>
      <div className="space-y-1.5">
        {[
          { plate: "UBX-1234", status: "MOVING", speed: 72 },
          { plate: "UBX-5678", status: "IDLE", speed: 0 },
          { plate: "UBX-9012", status: "ONLINE", speed: 45 },
        ].map((v) => (
          <div
            key={v.plate}
            className="flex items-center justify-between rounded-md bg-[var(--landing-surface-hover)]/60 px-2 py-1.5 text-xs"
          >
            <span className="font-mono text-[var(--landing-text)]">{v.plate}</span>
            <span className="text-[var(--landing-muted)]">{v.status}</span>
            <span className="font-mono tabular-nums text-cyan-400/80">{v.speed} km/h</span>
          </div>
        ))}
      </div>
    </div>
  );
}
