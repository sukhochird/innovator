"use client";

import { useCallback, useState } from "react";

import { Hero } from "@/components/landing/Hero";
import { LeadFormModal } from "@/components/landing/LeadFormModal";
import { Navbar } from "@/components/landing/Navbar";
import {
  BusinessValueSection,
  ComparisonSection,
  DemoCTASection,
  DtcSection,
  FAQSection,
  FleetSection,
  Footer,
  HowItWorksSection,
  IndustriesSection,
  PricingSection,
  ProblemSection,
  SecuritySection,
  SolutionSection,
  TelemetrySection,
  TrustBar,
  UseCasesSection,
  VehicleHealthSection,
  WhyCarqSection,
} from "@/components/landing/Sections";
import { I18nProvider } from "@/components/providers/I18nProvider";
import type { LeadType } from "@/lib/leads";

function LandingContent() {
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<LeadType>("demo");

  const openForm = useCallback((type: LeadType) => {
    setFormType(type);
    setFormOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--landing-bg)] text-[var(--landing-text)]">
      <Navbar onOpenDemo={() => openForm("demo")} />
      <main>
        <Hero onDemo={() => openForm("demo")} onQuote={() => openForm("pricing")} />
        <TrustBar />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <TelemetrySection />
        <FleetSection />
        <VehicleHealthSection />
        <DtcSection />
        <BusinessValueSection />
        <WhyCarqSection />
        <ComparisonSection />
        <IndustriesSection />
        <UseCasesSection />
        <SecuritySection />
        <PricingSection onQuote={() => openForm("pricing")} />
        <FAQSection />
        <DemoCTASection
          onDemo={() => openForm("demo")}
          onContact={() => openForm("contact")}
        />
        <Footer
          onDemo={() => openForm("demo")}
          onQuote={() => openForm("pricing")}
          onContact={() => openForm("contact")}
        />
      </main>
      <LeadFormModal open={formOpen} onOpenChange={setFormOpen} type={formType} />
    </div>
  );
}

export function LandingPage() {
  return (
    <I18nProvider>
      <LandingContent />
    </I18nProvider>
  );
}
