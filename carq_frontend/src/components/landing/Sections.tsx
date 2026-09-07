"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  Car,
  HardHat,
  MapPin,
  Package,
  Pickaxe,
  Shield,
  Truck,
  Users,
  Wrench,
} from "lucide-react";

import { Section, SectionHeading } from "@/components/landing/Section";
import { useScrollReveal } from "@/components/landing/hooks";
import { LiveVehicleDemo } from "@/components/landing/LiveVehicleDemo";
import { SpeedGauge, RpmGauge, TemperatureGauge, BatteryGauge } from "@/components/gauges/Gauges";
import { useI18n } from "@/components/providers/I18nProvider";
import { cn } from "@/lib/utils";

const INDUSTRY_ICONS = [
  Package,
  Truck,
  Car,
  HardHat,
  Pickaxe,
  Building2,
  Users,
  Wrench,
  Activity,
];

export function TrustBar() {
  const { t } = useI18n();
  const icons = [Activity, MapPin, Wrench, Truck, Shield];

  return (
    <div className="border-y border-[var(--landing-border)]/80 bg-[var(--landing-bg)] py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-4 px-4 md:gap-x-12">
        {t.trust.items.map((item, i) => {
          const Icon = icons[i];
          return (
            <div key={item} className="flex items-center gap-2 text-sm text-[var(--landing-muted)]">
              <Icon className="h-4 w-4 text-cyan-500/70" />
              <span>{item}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ProblemSection() {
  const { t } = useI18n();
  const ref = useScrollReveal();

  return (
    <Section id="problem">
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={t.problem.headline} align="left" />
        <div className="grid gap-4 md:grid-cols-2">
          {t.problem.cards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface)]/50 p-6 transition hover:border-[var(--landing-border)]"
            >
              <h3 className="text-lg font-medium text-[var(--landing-text)]">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)]">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function SolutionSection() {
  const { t } = useI18n();
  const ref = useScrollReveal();

  return (
    <Section id="solution" dark={false}>
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={t.solution.headline} subtitle={t.solution.description} />
        <div className="mx-auto max-w-lg">
          <div className="flex flex-col items-center gap-2 text-center">
            <FlowBox label="VEHICLES" />
            <FlowArrow />
            <FlowBox label="OBD / DEVICE" accent />
            <FlowArrow />
            <FlowBox label="CARQ" highlight />
            <div className="my-2 grid w-full grid-cols-3 gap-2">
              {t.solution.layers.slice(0, 3).map((l) => (
                <FlowBox key={l} label={l} small />
              ))}
            </div>
            <div className="grid w-full grid-cols-3 gap-2">
              {t.solution.layers.slice(3).map((l) => (
                <FlowBox key={l} label={l} small />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function FlowBox({
  label,
  small,
  accent,
  highlight,
}: {
  label: string;
  small?: boolean;
  accent?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "w-full rounded-lg border px-4 py-3 font-mono text-xs uppercase tracking-wider",
        highlight && "border-cyan-500/50 bg-cyan-500/10 text-cyan-300",
        accent && "border-[var(--landing-border)] bg-[var(--landing-surface-hover)] text-[var(--landing-text)]",
        !highlight && !accent && "border-[var(--landing-border)] bg-[var(--landing-surface)] text-[var(--landing-muted)]",
        small && "py-2 text-[10px]",
      )}
    >
      {label}
    </div>
  );
}

function FlowArrow() {
  return <div className="text-[var(--landing-muted)]">↓</div>;
}

export function HowItWorksSection() {
  const { t } = useI18n();
  const ref = useScrollReveal();

  return (
    <Section id="how-it-works">
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={t.howItWorks.headline} />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {t.howItWorks.steps.map((step) => (
            <div
              key={step.num}
              className="group relative rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface)]/40 p-6 transition hover:border-cyan-500/30"
            >
              <span className="font-mono text-3xl font-bold text-cyan-500/20 group-hover:text-cyan-500/40">
                {step.num}
              </span>
              <h3 className="mt-2 text-lg font-medium text-[var(--landing-text)]">{step.title}</h3>
              <p className="mt-2 text-sm text-[var(--landing-muted)]">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function TelemetrySection() {
  const { t } = useI18n();
  const ref = useScrollReveal();

  return (
    <Section id="telemetry" dark={false}>
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={t.telemetry.headline} subtitle={t.telemetry.subheadline} />
        <div className="grid gap-8 lg:grid-cols-2">
          <LiveVehicleDemo />
          <div className="grid gap-4 sm:grid-cols-2">
            {t.telemetry.cards.map((card) => (
              <div key={card.title} className="rounded-xl border border-[var(--landing-border)] p-5">
                <h3 className="font-medium text-[var(--landing-text)]">{card.title}</h3>
                <p className="mt-2 text-sm text-[var(--landing-muted)]">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

export function FleetSection() {
  const { t } = useI18n();
  const ref = useScrollReveal();

  const rows = [
    { vehicle: "Toyota Prius", driver: "John S.", status: "MOVING", speed: 72, rpm: 2450, alert: false },
    { vehicle: "Honda Civic", driver: "Jane D.", status: "IDLE", speed: 0, rpm: 850, alert: false },
    { vehicle: "Ford Transit", driver: "Mike J.", status: "ALERT", speed: 55, rpm: 2100, alert: true },
  ];

  return (
    <Section id="fleet">
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={t.fleet.headline} subtitle={t.fleet.description} align="left" />
        <div className="mb-8 grid grid-cols-3 gap-3 md:grid-cols-6">
          {t.fleet.stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-[var(--landing-border)] bg-[var(--landing-surface)] p-4 text-center">
              <div className="font-mono text-2xl font-semibold tabular-nums text-[var(--landing-text)]">{s.value}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-[var(--landing-muted)]">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto rounded-xl border border-[var(--landing-border)]">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-[var(--landing-border)] text-left text-xs uppercase text-[var(--landing-muted)]">
                {t.fleet.columns.map((col) => (
                  <th key={col} className="px-4 py-3">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.vehicle} className="border-b border-[var(--landing-border)]/50">
                  <td className="px-4 py-3 text-[var(--landing-text)]">{r.vehicle}</td>
                  <td className="px-4 py-3 text-[var(--landing-muted)]">{r.driver}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded px-2 py-0.5 text-xs", r.status === "MOVING" ? "bg-emerald-500/10 text-emerald-400" : r.status === "ALERT" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400")}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums">{r.speed}</td>
                  <td className="px-4 py-3 font-mono tabular-nums">{r.rpm}</td>
                  <td className="px-4 py-3">
                    {r.alert ? <AlertTriangle className="h-4 w-4 text-amber-400" /> : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}

export function BusinessValueSection() {
  const { t } = useI18n();
  const ref = useScrollReveal();

  return (
    <Section id="business-value" dark={false}>
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={t.businessValue.headline} />
        <div className="grid gap-4 md:grid-cols-2">
          {t.businessValue.cards.map((card, i) => (
            <div key={card.title} className="rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface)]/30 p-6">
              <span className="font-mono text-sm text-cyan-500/60">0{i + 1}</span>
              <h3 className="mt-2 text-lg font-medium text-[var(--landing-text)]">{card.title}</h3>
              <p className="mt-2 text-sm text-[var(--landing-muted)]">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function WhyCarqSection() {
  const { t } = useI18n();
  const ref = useScrollReveal();

  return (
    <Section id="why-carq">
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={t.whyCarq.headline} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {t.whyCarq.items.map((item) => (
            <div key={item.title} className="rounded-xl border border-[var(--landing-border)] p-5 hover:border-cyan-500/20">
              <h3 className="font-medium text-[var(--landing-text)]">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--landing-muted)]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function ComparisonSection() {
  const { t } = useI18n();
  const ref = useScrollReveal();

  return (
    <Section id="comparison" dark={false}>
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={t.comparison.headline} />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface-hover)]/30 p-6">
            <h3 className="text-lg font-medium text-[var(--landing-muted)]">{t.comparison.traditional}</h3>
            <ul className="mt-4 space-y-2">
              {t.comparison.traditionalItems.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-[var(--landing-muted)]">
                  <span className="h-1 w-1 rounded-full bg-[var(--landing-muted)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-6">
            <h3 className="text-lg font-medium text-cyan-400">{t.comparison.carq}</h3>
            <ul className="mt-4 space-y-2">
              {t.comparison.carqItems.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-[var(--landing-text)]">
                  <span className="h-1 w-1 rounded-full bg-cyan-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}

export function IndustriesSection() {
  const { t } = useI18n();
  const ref = useScrollReveal();

  return (
    <Section id="industries">
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={t.industries.headline} subtitle={t.industries.subheadline} />
        <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-3">
          {t.industries.items.map((item, i) => {
            const Icon = INDUSTRY_ICONS[i] || Package;
            return (
              <div
                key={item.name}
                className="min-w-[260px] flex-shrink-0 rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface)]/50 p-5 transition hover:border-cyan-500/30 hover:bg-[var(--landing-surface-hover)]/50 md:min-w-0"
              >
                <Icon className="h-8 w-8 text-cyan-500/70" />
                <h3 className="mt-4 font-medium text-[var(--landing-text)]">{item.name}</h3>
                <p className="mt-2 text-sm text-[var(--landing-muted)]">{item.description}</p>
                <p className="mt-3 text-xs text-[var(--landing-muted)]">{item.useCases}</p>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

export function UseCasesSection() {
  const { t } = useI18n();
  const ref = useScrollReveal();

  return (
    <Section id="use-cases" dark={false}>
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={t.useCases.headline} />
        <div className="space-y-6">
          {t.useCases.cases.map((c) => (
            <div key={c.title} className="rounded-xl border border-[var(--landing-border)] p-6 md:p-8">
              <h3 className="text-xl font-medium text-[var(--landing-text)]">{c.title}</h3>
              <p className="mt-3 text-sm text-[var(--landing-muted)]">
                <span className="text-[var(--landing-muted)]">Problem: </span>
                {c.problem}
              </p>
              <p className="mt-2 text-sm text-[var(--landing-muted)]">
                <span className="text-[var(--landing-muted)]">CARQ: </span>
                {c.solution}
              </p>
              <p className="mt-4 border-l-2 border-cyan-500/50 pl-4 text-sm text-[var(--landing-text)] italic">
                {c.result}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function VehicleHealthSection() {
  const { t } = useI18n();
  const ref = useScrollReveal();

  return (
    <Section id="vehicle-health">
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={t.vehicleHealth.headline} subtitle={t.vehicleHealth.subheadline} />
        <div className="flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)]/50 p-8">
          <SpeedGauge value={72} />
          <RpmGauge value={2450} />
          <TemperatureGauge value={91} />
          <BatteryGauge value={13.8} />
        </div>
      </div>
    </Section>
  );
}

export function DtcSection() {
  const { t } = useI18n();
  const ref = useScrollReveal();

  return (
    <Section id="dtc" dark={false}>
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={t.dtc.headline} subtitle={t.dtc.description} />
        <div className="mx-auto max-w-md rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-lg font-semibold text-amber-400">{t.dtc.exampleCode}</span>
              <p className="mt-1 text-sm text-[var(--landing-muted)]">{t.dtc.exampleDesc}</p>
            </div>
            <span className="rounded bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-400">
              {t.dtc.exampleSeverity}
            </span>
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-[var(--landing-muted)]">{t.dtc.disclaimer}</p>
      </div>
    </Section>
  );
}

export function SecuritySection() {
  const { t } = useI18n();
  const ref = useScrollReveal();

  return (
    <Section id="security">
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={t.security.headline} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {t.security.items.map((item) => (
            <div key={item.title} className="flex gap-4 rounded-xl border border-[var(--landing-border)] p-5">
              <Shield className="h-5 w-5 shrink-0 text-cyan-500/70" />
              <div>
                <h3 className="font-medium text-[var(--landing-text)]">{item.title}</h3>
                <p className="mt-1 text-sm text-[var(--landing-muted)]">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function PricingSection({ onQuote }: { onQuote: () => void }) {
  const { t } = useI18n();
  const ref = useScrollReveal();

  return (
    <Section id="pricing" dark={false}>
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={t.pricing.headline} subtitle={t.pricing.description} />
        <ul className="mx-auto mb-8 max-w-md space-y-2">
          {t.pricing.factors.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-[var(--landing-muted)]">
              <span className="text-cyan-500">•</span>
              {f}
            </li>
          ))}
        </ul>
        <div className="text-center">
          <button
            onClick={onQuote}
            className="rounded-lg bg-cyan-500 px-8 py-3.5 text-sm font-semibold text-[#09090b] hover:bg-cyan-400"
          >
            {t.pricing.cta}
          </button>
        </div>
      </div>
    </Section>
  );
}

export function DemoCTASection({ onDemo, onContact }: { onDemo: () => void; onContact: () => void }) {
  const { t } = useI18n();

  return (
    <Section id="demo-cta">
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/5 p-8 text-center md:p-12">
        <h2 className="text-3xl font-semibold text-[var(--landing-text)] md:text-4xl">{t.demo.headline}</h2>
        <p className="mt-4 text-[var(--landing-muted)]">{t.demo.subheadline}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={onDemo} className="rounded-lg bg-cyan-500 px-8 py-3.5 text-sm font-semibold text-[#09090b]">
            {t.demo.primaryCta}
          </button>
          <button onClick={onContact} className="rounded-lg border border-[var(--landing-border)] px-8 py-3.5 text-sm font-semibold text-[var(--landing-text)]">
            {t.demo.secondaryCta}
          </button>
        </div>
      </div>
    </Section>
  );
}

export function FAQSection() {
  const { t } = useI18n();
  const ref = useScrollReveal();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section id="faq" dark={false}>
      <div ref={ref} className="reveal-on-scroll">
        <SectionHeading title={t.faq.headline} />
        <div className="mx-auto max-w-2xl divide-y divide-[var(--landing-border)]">
          {t.faq.items.map((item, i) => (
            <div key={item.question}>
              <button
                className="flex w-full items-center justify-between py-4 text-left text-[var(--landing-text)]"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium">{item.question}</span>
                <span className="text-[var(--landing-muted)]">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && (
                <p className="pb-4 text-sm leading-relaxed text-[var(--landing-muted)]">{item.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function Footer({ onDemo, onQuote, onContact }: { onDemo: () => void; onQuote: () => void; onContact: () => void }) {
  const { t } = useI18n();

  return (
    <footer id="contact" className="border-t border-[var(--landing-border)] bg-[#060608] px-4 py-16 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center md:text-left">
          <h2 className="text-2xl font-semibold text-[var(--landing-text)]">{t.contact.headline}</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
            <button onClick={onDemo} className="rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-medium text-[#09090b]">
              {t.contact.requestDemo}
            </button>
            <button onClick={onQuote} className="rounded-lg border border-[var(--landing-border)] px-5 py-2.5 text-sm text-[var(--landing-text)]">
              {t.contact.getQuote}
            </button>
            <button onClick={onContact} className="rounded-lg border border-[var(--landing-border)] px-5 py-2.5 text-sm text-[var(--landing-text)]">
              {t.contact.contactSales}
            </button>
          </div>
        </div>

        <div className="grid gap-10 border-t border-[var(--landing-border)] pt-12 md:grid-cols-4">
          <div>
            <div className="text-lg font-semibold text-[var(--landing-text)]">CARQ</div>
            <p className="mt-2 text-sm text-[var(--landing-muted)]">{t.footer.tagline}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-[var(--landing-muted)]">{t.footer.products}</h4>
            <ul className="mt-3 space-y-2 text-sm text-[var(--landing-muted)]">
              {t.footer.productLinks.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-[var(--landing-muted)]">{t.footer.solutionsLabel}</h4>
            <ul className="mt-3 space-y-2 text-sm text-[var(--landing-muted)]">
              {t.footer.solutionLinks.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-[var(--landing-muted)]">{t.footer.company}</h4>
            <ul className="mt-3 space-y-2 text-sm text-[var(--landing-muted)]">
              {t.footer.companyLinks.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--landing-border)] pt-8 text-xs text-[var(--landing-muted)] md:flex-row">
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
