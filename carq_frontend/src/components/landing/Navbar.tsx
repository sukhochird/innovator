"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Gauge, Menu, X } from "lucide-react";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useI18n } from "@/components/providers/I18nProvider";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const NAV_IDS = [
  { key: "solutions", href: "#platform" },
  { key: "howItWorks", href: "#how-it-works" },
  { key: "whyCarq", href: "#why-carq" },
  { key: "industries", href: "#industries" },
  { key: "pricing", href: "#pricing" },
] as const;

export function Navbar({ onOpenDemo }: { onOpenDemo: () => void }) {
  const { t, locale, setLocale } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = t.nav;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-[var(--landing-border)]/80 bg-[var(--landing-bg)]/90 py-3 backdrop-blur-md"
          : "border-transparent bg-transparent py-5",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/20">
            <Gauge className="h-4 w-4 text-cyan-400" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-[var(--landing-text)]">CARQ</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_IDS.map(({ key, href }) => (
            <a
              key={key}
              href={href}
              className="text-sm text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-text)]"
            >
              {nav[key]}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle size="sm" />
          <LanguageSwitcher locale={locale} setLocale={setLocale} />

          <Link
            href="/login"
            className="hidden text-sm text-[var(--landing-muted)] hover:text-[var(--landing-text)] sm:inline"
          >
            {nav.login}
          </Link>

          <button
            onClick={onOpenDemo}
            className="hidden rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-[#09090b] transition hover:bg-cyan-400 sm:inline-flex"
          >
            {nav.requestDemo}
          </button>

          <button
            className="rounded-lg p-2 text-[var(--landing-muted)] hover:bg-[var(--landing-surface-hover)] lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[var(--landing-border)] bg-[var(--landing-bg)] px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_IDS.map(({ key, href }) => (
              <a
                key={key}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="py-2 text-[var(--landing-text)]"
              >
                {nav[key]}
              </a>
            ))}
            <Link href="/login" className="py-2 text-[var(--landing-muted)]">
              {nav.login}
            </Link>
            <button
              onClick={() => {
                setMobileOpen(false);
                onOpenDemo();
              }}
              className="mt-2 rounded-lg bg-cyan-500 py-3 text-sm font-medium text-[#09090b]"
            >
              {nav.requestDemo}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

function LanguageSwitcher({
  locale,
  setLocale,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-[var(--landing-border)] bg-[var(--landing-surface-hover)]/50 p-0.5 text-xs font-medium">
      <button
        onClick={() => setLocale("mn")}
        className={cn(
          "rounded-md px-2.5 py-1 transition",
          locale === "mn" ? "bg-[var(--dash-active)] text-[var(--landing-text)]" : "text-[var(--landing-muted)] hover:text-[var(--landing-text)]",
        )}
      >
        MN
      </button>
      <button
        onClick={() => setLocale("en")}
        className={cn(
          "rounded-md px-2.5 py-1 transition",
          locale === "en" ? "bg-[var(--dash-active)] text-[var(--landing-text)]" : "text-[var(--landing-muted)] hover:text-[var(--landing-text)]",
        )}
      >
        EN
      </button>
    </div>
  );
}
