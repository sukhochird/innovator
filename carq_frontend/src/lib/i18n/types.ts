export type Locale = "mn" | "en";

export interface TranslationDict {
  meta: {
    title: string;
    description: string;
    keywords: string;
  };
  nav: {
    solutions: string;
    industries: string;
    howItWorks: string;
    whyCarq: string;
    pricing: string;
    requestDemo: string;
    login: string;
  };
  hero: {
    title: string;
    titleLine2: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    liveLabel: string;
    online: string;
  };
  trust: {
    items: string[];
  };
  problem: {
    headline: string;
    cards: { title: string; description: string }[];
  };
  solution: {
    headline: string;
    description: string;
    layers: string[];
  };
  howItWorks: {
    headline: string;
    steps: { num: string; title: string; description: string }[];
  };
  telemetry: {
    headline: string;
    subheadline: string;
    cards: { title: string; description: string }[];
    statusOnline: string;
  };
  fleet: {
    headline: string;
    description: string;
    stats: { label: string; value: string }[];
    columns: string[];
  };
  businessValue: {
    headline: string;
    cards: { title: string; description: string }[];
  };
  whyCarq: {
    headline: string;
    items: { title: string; description: string }[];
  };
  comparison: {
    headline: string;
    traditional: string;
    traditionalItems: string[];
    carq: string;
    carqItems: string[];
  };
  industries: {
    headline: string;
    subheadline: string;
    items: { name: string; description: string; useCases: string }[];
  };
  useCases: {
    headline: string;
    cases: { title: string; problem: string; solution: string; result: string }[];
  };
  vehicleHealth: {
    headline: string;
    subheadline: string;
  };
  dtc: {
    headline: string;
    description: string;
    disclaimer: string;
    exampleCode: string;
    exampleDesc: string;
    exampleSeverity: string;
  };
  security: {
    headline: string;
    items: { title: string; description: string }[];
  };
  pricing: {
    headline: string;
    description: string;
    factors: string[];
    cta: string;
  };
  demo: {
    headline: string;
    subheadline: string;
    primaryCta: string;
    secondaryCta: string;
  };
  contact: {
    headline: string;
    requestDemo: string;
    getQuote: string;
    contactSales: string;
  };
  faq: {
    headline: string;
    items: { question: string; answer: string }[];
  };
  presentation: {
    headline: string;
    subheadline: string;
    techBadge: string;
    businessBadge: string;
    tech: {
      title: string;
      introTitle: string;
      intro: string;
      stack: { name: string; reason: string }[];
      prototypeTitle: string;
      prototype: string;
      features: string[];
      demoNote: string;
      futureTitle: string;
      future: string;
      futureItems: string[];
    };
    business: {
      title: string;
      definitionTitle: string;
      targetLabel: string;
      targetUsers: string;
      problemLabel: string;
      problem: string;
      solutionLabel: string;
      solution: string;
      marketTitle: string;
      market: string;
      revenueItems: { label: string; description: string }[];
      planTitle: string;
      planIntro: string;
      plRows: { line: string; year1: string; year2: string; year3: string }[];
      plNote: string;
      plHeader: string;
      year1Label: string;
      year2Label: string;
      year3Label: string;
    };
  };
  footer: {
    tagline: string;
    products: string;
    productLinks: string[];
    solutionsLabel: string;
    solutionLinks: string[];
    company: string;
    companyLinks: string[];
    legal: string;
    legalLinks: string[];
    copyright: string;
  };
  forms: {
    name: string;
    company: string;
    phone: string;
    email: string;
    fleetSize: string;
    industry: string;
    features: string;
    contactMethod: string;
    message: string;
    submit: string;
    success: string;
    error: string;
    demoTitle: string;
    pricingTitle: string;
    contactTitle: string;
    required: string;
    invalidEmail: string;
    vehicleCount: string;
  };
  alerts: {
    items: string[];
  };
}
