"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Building2,
  Car,
  Check,
  Coins,
  Cpu,
  HardHat,
  Package,
  Pickaxe,
  Shield,
  Truck,
} from "lucide-react";

import { Section, SectionHeading } from "@/components/landing/Section";
import { useScrollReveal } from "@/components/landing/hooks";
import { LiveVehicleDemo } from "@/components/landing/LiveVehicleDemo";
import { SpeedGauge, RpmGauge, TemperatureGauge, BatteryGauge } from "@/components/gauges/Gauges";
import { useI18n } from "@/components/providers/I18nProvider";
import { cn } from "@/lib/utils";

const INDUSTRY_ICONS = [Package, Truck, Car, HardHat, Pickaxe, Building2];

type PlatformTab = "live" | "fleet" | "health";

/* ── 1. Overview: Problem + Solution ───────────────────────── */

export function OverviewSection() {
  const { t } = useI18n();
  const ref = useScrollReveal();

  return (
    <Section id="overview">
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={t.problem.headline} subtitle={t.solution.description} align="left" />
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="grid gap-3 sm:grid-cols-2">
            {t.problem.cards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface)]/40 p-5"
              >
                <h3 className="text-sm font-medium text-[var(--landing-text)]">{card.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--landing-muted)]">{card.description}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
            <p className="text-lg font-semibold text-[var(--landing-text)]">{t.solution.headline}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {t.solution.layers.map((layer) => (
                <span
                  key={layer}
                  className="rounded-full border border-cyan-500/30 bg-[var(--landing-surface)]/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-cyan-300"
                >
                  {layer}
                </span>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-[var(--landing-muted)]">
              <span className="rounded bg-[var(--landing-surface)] px-2 py-1">VEHICLES</span>
              <span>→</span>
              <span className="rounded bg-[var(--landing-surface)] px-2 py-1">OBD / DEVICE</span>
              <span>→</span>
              <span className="rounded bg-cyan-500/20 px-2 py-1 text-cyan-300">CARQ</span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ── 2. Platform: tabbed Live / Fleet / Health ───────────────── */

export function PlatformSection() {
  const { t } = useI18n();
  const ref = useScrollReveal();
  const [tab, setTab] = useState<PlatformTab>("live");

  const tabs: { id: PlatformTab; label: string }[] = [
    { id: "live", label: t.telemetry.headline },
    { id: "fleet", label: t.fleet.headline.split(".")[0] },
    { id: "health", label: t.vehicleHealth.headline.split(".")[0] },
  ];

  const fleetRows = [
    { vehicle: "UBX-1234", driver: "Bat", status: "MOVING", speed: 72, rpm: 2450, alert: false },
    { vehicle: "UBX-5678", driver: "Sara", status: "IDLE", speed: 0, rpm: 850, alert: false },
    { vehicle: "UBX-9012", driver: "Bold", status: "ALERT", speed: 55, rpm: 2100, alert: true },
  ];

  return (
    <Section id="platform" dark={false}>
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={t.telemetry.subheadline} subtitle={t.fleet.description} />

        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition",
                tab === id
                  ? "bg-cyan-500 text-[#09090b]"
                  : "border border-[var(--landing-border)] text-[var(--landing-muted)] hover:text-[var(--landing-text)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)]/30 p-4 md:p-6">
          {tab === "live" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <LiveVehicleDemo />
              <div className="grid gap-3 sm:grid-cols-2">
                {t.telemetry.cards.map((card) => (
                  <div key={card.title} className="rounded-xl border border-[var(--landing-border)]/80 p-4">
                    <h3 className="text-sm font-medium text-[var(--landing-text)]">{card.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[var(--landing-muted)]">{card.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "fleet" && (
            <div>
              <div className="mb-4 grid grid-cols-3 gap-2 md:grid-cols-6">
                {t.fleet.stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg border border-[var(--landing-border)]/80 bg-[var(--landing-surface)]/50 p-3 text-center"
                  >
                    <div className="font-mono text-xl font-semibold tabular-nums text-[var(--landing-text)]">
                      {s.value}
                    </div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--landing-muted)]">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto rounded-xl border border-[var(--landing-border)]/80">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-[var(--landing-border)] text-left text-[10px] uppercase text-[var(--landing-muted)]">
                      {t.fleet.columns.map((col) => (
                        <th key={col} className="px-3 py-2.5">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fleetRows.map((r) => (
                      <tr key={r.vehicle} className="border-b border-[var(--landing-border)]/50">
                        <td className="px-3 py-2.5 font-mono text-[var(--landing-text)]">{r.vehicle}</td>
                        <td className="px-3 py-2.5 text-[var(--landing-muted)]">{r.driver}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "rounded px-2 py-0.5 text-[10px] font-medium",
                              r.status === "MOVING"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : r.status === "ALERT"
                                  ? "bg-red-500/10 text-red-400"
                                  : "bg-amber-500/10 text-amber-400",
                            )}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono tabular-nums">{r.speed}</td>
                        <td className="px-3 py-2.5 font-mono tabular-nums">{r.rpm}</td>
                        <td className="px-3 py-2.5">
                          {r.alert ? <AlertTriangle className="h-4 w-4 text-amber-400" /> : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "health" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="flex flex-wrap items-center justify-center gap-4 rounded-xl border border-[var(--landing-border)]/80 p-6">
                <SpeedGauge value={72} />
                <RpmGauge value={2450} />
                <TemperatureGauge value={91} />
                <BatteryGauge value={13.8} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-[var(--landing-text)]">{t.dtc.headline}</h3>
                <p className="mt-2 text-xs text-[var(--landing-muted)]">{t.dtc.description}</p>
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-base font-semibold text-amber-400">{t.dtc.exampleCode}</span>
                      <p className="mt-1 text-xs text-[var(--landing-muted)]">{t.dtc.exampleDesc}</p>
                    </div>
                    <span className="shrink-0 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                      {t.dtc.exampleSeverity}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-[10px] text-[var(--landing-muted)]">{t.dtc.disclaimer}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

/* ── 3. How it works ─────────────────────────────────────────── */

export function HowItWorksSection() {
  const { t } = useI18n();
  const ref = useScrollReveal();

  return (
    <Section id="how-it-works">
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={t.howItWorks.headline} />
        <div className="grid gap-4 md:grid-cols-4">
          {t.howItWorks.steps.map((step) => (
            <div
              key={step.num}
              className="relative rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface)]/40 p-5"
            >
              <span className="font-mono text-2xl font-bold text-cyan-500/25">{step.num}</span>
              <h3 className="mt-1 text-base font-medium text-[var(--landing-text)]">{step.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--landing-muted)]">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ── 4. Advantage: comparison + why + business value + security ─ */

export function AdvantageSection() {
  const { t } = useI18n();
  const ref = useScrollReveal();
  const topWhy = t.whyCarq.items.slice(0, 4);

  return (
    <Section id="why-carq" dark={false}>
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={t.comparison.headline} subtitle={t.businessValue.headline} />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface-hover)]/20 p-5">
            <h3 className="text-sm font-medium text-[var(--landing-muted)]">{t.comparison.traditional}</h3>
            <ul className="mt-3 space-y-2">
              {t.comparison.traditionalItems.map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-[var(--landing-muted)]">
                  <span className="h-1 w-1 rounded-full bg-[var(--landing-muted)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5">
            <h3 className="text-sm font-medium text-cyan-400">{t.comparison.carq}</h3>
            <ul className="mt-3 space-y-2">
              {t.comparison.carqItems.map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-[var(--landing-text)]">
                  <Check className="h-3 w-3 shrink-0 text-cyan-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {topWhy.map((item) => (
            <div key={item.title} className="rounded-xl border border-[var(--landing-border)] p-4">
              <h3 className="text-sm font-medium text-[var(--landing-text)]">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--landing-muted)]">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.businessValue.cards.map((card) => (
            <div
              key={card.title}
              className="rounded-lg border border-[var(--landing-border)]/80 bg-[var(--landing-surface)]/30 px-4 py-3"
            >
              <p className="text-xs font-medium text-[var(--landing-text)]">{card.title}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-[var(--landing-muted)]">{card.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-4 border-t border-[var(--landing-border)]/60 pt-6">
          {t.security.items.slice(0, 4).map((item) => (
            <div key={item.title} className="flex items-center gap-2 text-xs text-[var(--landing-muted)]">
              <Shield className="h-3.5 w-3.5 text-cyan-500/70" />
              <span>{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ── 5. Markets: industries + use cases ──────────────────────── */

export function MarketsSection() {
  const { t } = useI18n();
  const ref = useScrollReveal();
  const industries = t.industries.items.slice(0, 6);

  return (
    <Section id="industries">
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={t.industries.headline} subtitle={t.industries.subheadline} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((item, i) => {
            const Icon = INDUSTRY_ICONS[i] || Package;
            return (
              <div
                key={item.name}
                className="flex gap-4 rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface)]/40 p-4 transition hover:border-cyan-500/25"
              >
                <Icon className="h-6 w-6 shrink-0 text-cyan-500/70" />
                <div>
                  <h3 className="text-sm font-medium text-[var(--landing-text)]">{item.name}</h3>
                  <p className="mt-1 text-xs text-[var(--landing-muted)]">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--landing-muted)]">
            {t.useCases.headline}
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {t.useCases.cases.map((c) => (
              <div key={c.title} className="rounded-xl border border-[var(--landing-border)] p-4">
                <h4 className="font-medium text-[var(--landing-text)]">{c.title}</h4>
                <p className="mt-2 text-xs leading-relaxed text-[var(--landing-muted)]">{c.problem}</p>
                <p className="mt-3 border-l-2 border-cyan-500/40 pl-3 text-xs text-[var(--landing-text)]">
                  {c.result}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ── 6. Innovator: compact tech + business tabs ────────────────── */

export function InnovatorSection() {
  const { t } = useI18n();
  const ref = useScrollReveal();
  const p = t.presentation;
  const [tab, setTab] = useState<"tech" | "business">("tech");

  return (
    <Section id="innovator" dark={false}>
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={p.headline} subtitle={p.subheadline} />

        <div className="mb-5 flex gap-2">
          <button
            onClick={() => setTab("tech")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
              tab === "tech"
                ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
                : "text-[var(--landing-muted)] hover:text-[var(--landing-text)]",
            )}
          >
            <Cpu className="h-4 w-4" />
            {p.techBadge}
          </button>
          <button
            onClick={() => setTab("business")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
              tab === "business"
                ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30"
                : "text-[var(--landing-muted)] hover:text-[var(--landing-text)]",
            )}
          >
            <Coins className="h-4 w-4" />
            {p.businessBadge}
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)]/30 p-5 md:p-6">
          {tab === "tech" ? (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed text-[var(--landing-muted)]">{p.tech.intro}</p>
              <div className="flex flex-wrap gap-2">
                {p.tech.stack.map((s) => (
                  <span
                    key={s.name}
                    title={s.reason}
                    className="cursor-default rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface-hover)]/40 px-3 py-1 font-mono text-[10px] text-cyan-300"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {p.tech.features.slice(0, 6).map((f) => (
                  <li key={f} className="flex gap-2 text-xs text-[var(--landing-muted)]">
                    <span className="text-cyan-500">▸</span>
                    {f}
                  </li>
                ))}
              </ul>
              <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 font-mono text-[10px] text-cyan-300/90">
                {p.tech.demoNote}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 text-xs text-[var(--landing-muted)] sm:grid-cols-3">
                <p>
                  <span className="font-medium text-[var(--landing-text)]">{p.business.targetLabel}: </span>
                  {p.business.targetUsers}
                </p>
                <p>
                  <span className="font-medium text-[var(--landing-text)]">{p.business.problemLabel}: </span>
                  {p.business.problem}
                </p>
                <p>
                  <span className="font-medium text-[var(--landing-text)]">{p.business.solutionLabel}: </span>
                  {p.business.solution}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {p.business.revenueItems.map((item) => (
                  <div key={item.label} className="rounded-lg border border-[var(--landing-border)]/80 p-3">
                    <p className="text-xs font-medium text-[var(--landing-text)]">{item.label}</p>
                    <p className="mt-1 text-[10px] text-[var(--landing-muted)]">{item.description}</p>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto rounded-xl border border-[var(--landing-border)]">
                <table className="w-full min-w-[300px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--landing-border)] bg-[var(--landing-surface-hover)]/40 text-[10px] uppercase text-[var(--landing-muted)]">
                      <th className="px-3 py-2">{p.business.plHeader}</th>
                      <th className="px-3 py-2">{p.business.year1Label}</th>
                      <th className="px-3 py-2">{p.business.year2Label}</th>
                      <th className="px-3 py-2">{p.business.year3Label}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.business.plRows.map((row) => (
                      <tr
                        key={row.line}
                        className={cn(
                          "border-b border-[var(--landing-border)]/50",
                          row.line.includes("ашиг") || row.line.includes("profit")
                            ? "font-medium text-emerald-400"
                            : "text-[var(--landing-muted)]",
                        )}
                      >
                        <td className="px-3 py-2 text-[var(--landing-text)]">{row.line}</td>
                        <td className="px-3 py-2 font-mono tabular-nums">{row.year1}</td>
                        <td className="px-3 py-2 font-mono tabular-nums">{row.year2}</td>
                        <td className="px-3 py-2 font-mono tabular-nums">{row.year3}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-[var(--landing-muted)]">{p.business.plNote}</p>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

/* ── 7. Closing: pricing + FAQ + CTA ─────────────────────────── */

export function ClosingSection({
  onDemo,
  onQuote,
  onContact,
}: {
  onDemo: () => void;
  onQuote: () => void;
  onContact: () => void;
}) {
  const { t } = useI18n();
  const ref = useScrollReveal();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const faqItems = t.faq.items.slice(0, 5);

  return (
    <Section id="pricing">
      <div ref={ref} className="reveal-on-scroll space-y-12">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading title={t.pricing.headline} subtitle={t.pricing.description} align="left" />
            <ul className="space-y-2">
              {t.pricing.factors.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-[var(--landing-muted)]">
                  <span className="text-cyan-500">•</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={onQuote}
              className="mt-6 rounded-lg bg-cyan-500 px-6 py-3 text-sm font-semibold text-[#09090b] hover:bg-cyan-400"
            >
              {t.pricing.cta}
            </button>
          </div>

          <div id="faq">
            <SectionHeading title={t.faq.headline} align="left" />
            <div className="divide-y divide-[var(--landing-border)]">
              {faqItems.map((item, i) => (
                <div key={item.question}>
                  <button
                    className="flex w-full items-center justify-between py-3.5 text-left text-sm text-[var(--landing-text)]"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-medium">{item.question}</span>
                    <span className="ml-4 shrink-0 text-[var(--landing-muted)]">{openFaq === i ? "−" : "+"}</span>
                  </button>
                  {openFaq === i && (
                    <p className="pb-3.5 text-xs leading-relaxed text-[var(--landing-muted)]">{item.answer}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/5 p-8 text-center md:p-10">
          <h2 className="text-2xl font-semibold text-[var(--landing-text)] md:text-3xl">{t.demo.headline}</h2>
          <p className="mt-3 text-sm text-[var(--landing-muted)]">{t.demo.subheadline}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={onDemo}
              className="rounded-lg bg-cyan-500 px-8 py-3 text-sm font-semibold text-[#09090b] hover:bg-cyan-400"
            >
              {t.demo.primaryCta}
            </button>
            <button
              onClick={onContact}
              className="rounded-lg border border-[var(--landing-border)] px-8 py-3 text-sm font-semibold text-[var(--landing-text)]"
            >
              {t.demo.secondaryCta}
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ── Footer ──────────────────────────────────────────────────── */

export function Footer({
  onDemo,
  onQuote,
  onContact,
}: {
  onDemo: () => void;
  onQuote: () => void;
  onContact: () => void;
}) {
  const { t } = useI18n();

  return (
    <footer id="contact" className="border-t border-[var(--landing-border)] bg-[#060608] px-4 py-12 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="text-lg font-semibold text-[var(--landing-text)]">CARQ</div>
            <p className="mt-1 max-w-sm text-sm text-[var(--landing-muted)]">{t.footer.tagline}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onDemo}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-[#09090b]"
            >
              {t.contact.requestDemo}
            </button>
            <button
              onClick={onQuote}
              className="rounded-lg border border-[var(--landing-border)] px-4 py-2 text-sm text-[var(--landing-text)]"
            >
              {t.contact.getQuote}
            </button>
            <button
              onClick={onContact}
              className="rounded-lg border border-[var(--landing-border)] px-4 py-2 text-sm text-[var(--landing-text)]"
            >
              {t.contact.contactSales}
            </button>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[var(--landing-border)] pt-6 text-xs text-[var(--landing-muted)] md:flex-row">
          <span>{t.footer.copyright}</span>
          <div className="flex gap-4">
            {t.footer.legalLinks.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
