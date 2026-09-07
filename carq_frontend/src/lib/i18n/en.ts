import type { TranslationDict } from "./types";

const en: TranslationDict = {
  meta: {
    title: "CARQ | Intelligent Vehicle Monitoring & Fleet Management",
    description:
      "Monitor vehicles in realtime with GPS, OBD telemetry, diagnostics and fleet management tools.",
    keywords:
      "vehicle monitoring, fleet management, vehicle tracking, OBD monitoring, vehicle diagnostics, fleet tracking, GPS fleet management, vehicle telemetry",
  },
  nav: {
    solutions: "Solutions",
    industries: "Industries",
    howItWorks: "How It Works",
    whyCarq: "Why CARQ",
    pricing: "Pricing",
    requestDemo: "Request Demo",
    login: "Sign In",
  },
  hero: {
    title: "Know Your Vehicles.",
    titleLine2: "Control Your Fleet.",
    description:
      "CARQ turns your vehicles into connected, intelligent assets. Monitor location, vehicle health, diagnostics and realtime performance from one powerful platform.",
    primaryCta: "Request a Demo",
    secondaryCta: "Get a Quote",
    liveLabel: "CARQ LIVE",
    online: "● ONLINE",
  },
  trust: {
    items: [
      "Realtime Monitoring",
      "GPS Tracking",
      "Vehicle Diagnostics",
      "Fleet Management",
      "OBD / IoT Integration",
    ],
  },
  problem: {
    headline: "Your vehicles are working. But do you know what they are doing?",
    cards: [
      {
        title: "Limited Visibility",
        description:
          "You don't always know where your vehicles are or whether they are actually operating.",
      },
      {
        title: "Unexpected Problems",
        description: "Small vehicle problems can become expensive repairs.",
      },
      {
        title: "Fleet Management Complexity",
        description:
          "Managing dozens of vehicles through spreadsheets, phone calls and disconnected systems doesn't scale.",
      },
      {
        title: "No Centralized Data",
        description:
          "Vehicle information is scattered across devices, drivers and maintenance records.",
      },
    ],
  },
  solution: {
    headline: "One Platform. Every Vehicle.",
    description:
      "CARQ brings all vehicle data into one place and transforms it into clear, actionable information.",
    layers: ["GPS", "Diagnostics", "Analytics", "Fleet Control", "Vehicle Health", "Alerts"],
  },
  howItWorks: {
    headline: "How CARQ Works",
    steps: [
      {
        num: "01",
        title: "Connect",
        description: "Connect a CARQ-compatible device to your vehicle.",
      },
      {
        num: "02",
        title: "Collect",
        description: "The device collects vehicle data and location information.",
      },
      {
        num: "03",
        title: "Transmit",
        description: "Data is securely transmitted to the CARQ platform.",
      },
      {
        num: "04",
        title: "Control",
        description: "Monitor your vehicles in realtime and make better operational decisions.",
      },
    ],
  },
  telemetry: {
    headline: "What Can You See?",
    subheadline: "Realtime vehicle intelligence at a glance",
    cards: [
      {
        title: "Realtime Status",
        description: "Speed, RPM, temperature, battery — all on one screen.",
      },
      {
        title: "GPS Location",
        description: "See vehicle position, heading and route on a live map.",
      },
      {
        title: "Vehicle Health",
        description: "Engine load, battery, fuel level and other OBD parameters.",
      },
      {
        title: "Diagnostics (DTC)",
        description: "Get notified when diagnostic trouble codes appear.",
      },
    ],
    statusOnline: "ONLINE",
  },
  fleet: {
    headline: "One Vehicle Is Easy. Fifty Vehicles Is a System.",
    description:
      "CARQ gives fleet managers a single operational view of the entire fleet.",
    stats: [
      { label: "Online", value: "42" },
      { label: "Moving", value: "25" },
      { label: "Idle", value: "10" },
      { label: "Offline", value: "7" },
      { label: "Critical", value: "2" },
      { label: "DTC", value: "5" },
    ],
    columns: ["Vehicle", "Driver", "Status", "Speed", "RPM", "Alerts"],
  },
  businessValue: {
    headline: "From Vehicle Data to Business Decisions",
    cards: [
      {
        title: "Reduce Operational Blind Spots",
        description: "Know where vehicles are and what state they are in.",
      },
      {
        title: "Detect Problems Earlier",
        description: "Identify abnormal conditions before they become bigger issues.",
      },
      {
        title: "Manage More With Less Effort",
        description: "Centralize fleet information in one platform.",
      },
      {
        title: "Build a Data-Driven Fleet",
        description: "Use historical telemetry to understand utilization and performance.",
      },
    ],
  },
  whyCarq: {
    headline: "Why CARQ?",
    items: [
      {
        title: "Vehicle-Level Intelligence",
        description: "Not just GPS — GPS + OBD + diagnostics + realtime telemetry.",
      },
      {
        title: "Realtime Updates",
        description: "Information updates continuously as vehicles operate.",
      },
      {
        title: "Fleet + Vehicle in One Platform",
        description: "Managers see the fleet. Drivers see their assigned vehicle.",
      },
      {
        title: "Device-Agnostic Architecture",
        description: "Designed to support different compatible OBD/IoT devices.",
      },
      {
        title: "Scalable",
        description: "From 1 vehicle to 1000+ vehicles.",
      },
      {
        title: "Localizable",
        description: "Built for Mongolian businesses and international markets.",
      },
      {
        title: "API-Ready",
        description: "Integrate with ERP, logistics, maintenance and other systems.",
      },
    ],
  },
  comparison: {
    headline: "More Than Where Your Vehicle Is",
    traditional: "Traditional GPS",
    traditionalItems: ["Location", "Speed", "Basic route"],
    carq: "CARQ",
    carqItems: [
      "Location + speed",
      "RPM, temperature, battery",
      "DTC diagnostics",
      "Alerts",
      "Vehicle health",
      "Fleet dashboard",
      "Realtime telemetry",
      "API integration",
    ],
  },
  industries: {
    headline: "Built for Your Industry",
    subheadline: "CARQ adapts to different operational environments",
    items: [
      {
        name: "Logistics",
        description: "Delivery fleet, location and status monitoring.",
        useCases: "Delivery, warehouse, transport",
      },
      {
        name: "Delivery",
        description: "Driver, vehicle and route visibility.",
        useCases: "E-commerce, food delivery",
      },
      {
        name: "Transportation",
        description: "Taxi, bus and passenger transport fleets.",
        useCases: "Taxi, shuttle, bus",
      },
      {
        name: "Construction",
        description: "Field vehicles, utilization and location.",
        useCases: "Construction, equipment",
      },
      {
        name: "Mining",
        description: "Site transport and support vehicles.",
        useCases: "Mining transport, site vehicles",
      },
      {
        name: "Rental & Leasing",
        description: "Rented vehicle location and health.",
        useCases: "Car rental, leasing",
      },
      {
        name: "Corporate Fleet",
        description: "Employee and service vehicle fleets.",
        useCases: "Sales, service teams",
      },
      {
        name: "Field Service",
        description: "Technician and maintenance team vehicles.",
        useCases: "Utility, maintenance",
      },
      {
        name: "Individual Owners",
        description: "Vehicle diagnostics, health and GPS.",
        useCases: "Personal vehicles",
      },
    ],
  },
  useCases: {
    headline: "Real-World Examples",
    cases: [
      {
        title: "Delivery Company",
        problem: "30 delivery vehicles — manager must call every driver for updates.",
        solution: "CARQ: realtime location, status, alerts and diagnostics.",
        result: "The manager can understand the entire fleet without calling every driver.",
      },
      {
        title: "Construction Company",
        problem: "Vehicles operate across multiple project sites.",
        solution: "GPS, utilization, vehicle health and alerts.",
        result: "Monitor every site vehicle from one centralized system.",
      },
      {
        title: "Corporate Fleet",
        problem: "Many service vehicles with no centralized visibility.",
        solution: "Fleet dashboard, driver assignment, diagnostics.",
        result: "All vehicle information in one operational view.",
      },
    ],
  },
  vehicleHealth: {
    headline: "Your Vehicle Talks. CARQ Listens.",
    subheadline: "Premium cockpit-style monitoring",
  },
  dtc: {
    headline: "Don't Wait for the Warning Light",
    description:
      "CARQ can detect diagnostic trouble codes reported by compatible vehicles and show them in a simple dashboard.",
    disclaimer:
      "Available parameters and diagnostic capabilities depend on the vehicle, ECU and connected device.",
    exampleCode: "P0420",
    exampleDesc: "Catalyst System Efficiency Below Threshold",
    exampleSeverity: "WARNING",
  },
  security: {
    headline: "Secure & Reliable Platform",
    items: [
      { title: "Secure Authentication", description: "JWT authentication with role-based access." },
      { title: "Company Data Isolation", description: "Each company sees only their own data." },
      { title: "Device Authentication", description: "Only registered devices can send telemetry." },
      { title: "Realtime Communication", description: "Continuous updates via WebSocket." },
      { title: "Scalable Architecture", description: "Built for many vehicles and users." },
    ],
  },
  pricing: {
    headline: "Flexible for Your Fleet",
    description: "Pricing depends on:",
    factors: [
      "Number of vehicles",
      "Device type",
      "Telemetry frequency",
      "Features & integrations",
      "Support requirements",
    ],
    cta: "Request Pricing",
  },
  demo: {
    headline: "Ready to See Your Fleet Differently?",
    subheadline: "Experience CARQ with a live demonstration",
    primaryCta: "Request a Demo",
    secondaryCta: "Talk to Sales",
  },
  contact: {
    headline: "Let's Talk About Your Fleet",
    requestDemo: "Request Demo",
    getQuote: "Get a Quote",
    contactSales: "Contact Sales",
  },
  faq: {
    headline: "Frequently Asked Questions",
    items: [
      {
        question: "What is CARQ?",
        answer:
          "CARQ is a vehicle telemetry, GPS, diagnostics and fleet management platform that centralizes vehicle data.",
      },
      {
        question: "Does CARQ work with every vehicle?",
        answer:
          "CARQ supports compatible vehicles and devices. Available telemetry and diagnostic parameters depend on the vehicle and device.",
      },
      {
        question: "Do I need an OBD device?",
        answer: "Vehicle telemetry requires a compatible connected device.",
      },
      {
        question: "Can CARQ monitor multiple vehicles?",
        answer: "Yes. CARQ is designed for fleets from a few vehicles to large operations.",
      },
      {
        question: "Can drivers use CARQ?",
        answer: "Yes. Drivers can access their assigned vehicle through their own account.",
      },
      {
        question: "Can CARQ integrate with our existing system?",
        answer: "CARQ is designed with APIs for connecting to ERP, logistics and other business systems.",
      },
      {
        question: "Is GPS included?",
        answer: "GPS functionality depends on the connected device configuration.",
      },
      {
        question: "What information can CARQ monitor?",
        answer:
          "Location, speed, RPM, coolant temperature, battery voltage, engine load, diagnostics, alerts and other supported OBD parameters.",
      },
    ],
  },
  presentation: {
    headline: "CARQ — Technology & Business Presentation",
    subheadline:
      "Technology stack, working prototype and business model for an intelligent fleet platform",
    techBadge: "🧑‍💻 Technology",
    businessBadge: "🪙 Business",
    tech: {
      title: "Technology Solution",
      introTitle: "Overview",
      intro:
        "CARQ is a unified platform for vehicle GPS, OBD telemetry, diagnostics and fleet management. We ingest data from JT808 hardware, then expose realtime dashboards, maps, alerts and geofences.",
      stack: [
        {
          name: "Django + DRF + Channels",
          reason: "REST API, JWT auth and WebSocket realtime suited for IoT telemetry.",
        },
        {
          name: "PostgreSQL + Redis",
          reason: "Reliable telemetry history and fleet data; Redis cache and channel layer.",
        },
        {
          name: "Next.js + TypeScript",
          reason: "Fast dashboard UI, SEO landing page and production-ready deploy.",
        },
        {
          name: "MapLibre GL + OpenFreeMap",
          reason: "Key-free maps with fleet tracking, trails and geofence support.",
        },
        {
          name: "JT808 TCP + simulator.py",
          reason: "Supports real GPS/OBD device protocol for demo and testing.",
        },
      ],
      prototypeTitle: "Prototype Demo",
      prototype:
        "The working prototype includes Fleet Command Center (/fleet), company dashboard, per-vehicle detail pages, DTC/Alerts hubs, geofence management, track history and playback.",
      features: [
        "Realtime WebSocket — live telemetry updates",
        "Fleet map — multi-vehicle GPS trails, focus, dark/light views",
        "JT808 simulator — demo routes around Ulaanbaatar center",
        "DTC diagnostics + AI insights — fault codes and alerts",
        "Geofence — automatic entry/exit alerts",
        "Docker production deploy — live at carq.autos",
      ],
      demoNote:
        "Demo login: company@carq.local / company123 → /fleet, /dashboard. Run simulator.py for live map tracks.",
      futureTitle: "Future Outlook",
      future:
        "CARQ can scale to logistics, delivery, construction, mining and corporate fleets with ERP/TMS API integrations.",
      futureItems: [
        "SaaS fleet management for Mongolian logistics companies",
        "Predictive maintenance for service centers",
        "Vehicle health + GPS for rental companies",
        "Site equipment monitoring for mining and construction",
        "White-label fleet platform for international markets",
      ],
    },
    business: {
      title: "Business Model",
      definitionTitle: "Business Definition",
      targetLabel: "Target customers",
      targetUsers:
        "Logistics, delivery, taxi/transport, construction, mining, corporate fleets and rental companies with 5–500+ vehicles.",
      problemLabel: "Problem",
      problem:
        "Managers lack a single view of location, status and vehicle health; Excel, phone calls and separate GPS tools waste time; small faults become expensive repairs.",
      solutionLabel: "Solution",
      solution:
        "CARQ combines GPS + OBD + diagnostics + alerts in one SaaS platform with realtime dashboard, map tracking, DTC alerts and geofences.",
      marketTitle: "Business Model & Market",
      market:
        "Mongolia's transport, logistics, construction and mining sectors include 10,000+ businesses, many without modern fleet visibility. CARQ adds telemetry value beyond traditional GPS.",
      revenueItems: [
        {
          label: "SaaS subscription",
          description: "Monthly fee per vehicle based on telemetry frequency and features.",
        },
        {
          label: "Hardware + installation",
          description: "OBD/GPS device sales and installation services.",
        },
        {
          label: "Enterprise license",
          description: "100+ vehicles, custom integrations and dedicated support.",
        },
        {
          label: "API / integration",
          description: "Additional projects connecting ERP, TMS and maintenance systems.",
        },
      ],
      planTitle: "Implementation Plan",
      planIntro: "Simple 3-year P&L plan (MNT, millions) — 50-vehicle pilot to 200+ vehicle scale:",
      plRows: [
        { line: "Revenue", year1: "45", year2: "180", year3: "420" },
        { line: "Hardware + COGS", year1: "18", year2: "54", year3: "105" },
        { line: "Dev + cloud", year1: "12", year2: "24", year3: "36" },
        { line: "Sales + marketing", year1: "8", year2: "20", year3: "35" },
        { line: "Net profit (P&L)", year1: "7", year2: "82", year3: "244" },
      ],
      plNote: "*Plan assumes year 1: 2 pilot companies (50 vehicles); year 2: 8 companies (200 vehicles); year 3: 20 companies (500+ vehicles).",
      plHeader: "P&L",
      year1Label: "Year 1",
      year2Label: "Year 2",
      year3Label: "Year 3",
    },
  },
  footer: {
    tagline: "Intelligent Vehicle Monitoring & Fleet Management Platform",
    products: "Products",
    productLinks: ["Fleet Management", "Vehicle Monitoring", "Diagnostics", "GPS"],
    solutionsLabel: "Solutions",
    solutionLinks: ["Logistics", "Construction", "Transportation", "Corporate Fleet", "Rental"],
    company: "Company",
    companyLinks: ["About", "Contact", "Request Demo"],
    legal: "Legal",
    legalLinks: ["Privacy Policy", "Terms of Service"],
    copyright: "© 2026 CARQ. All rights reserved.",
  },
  forms: {
    name: "Name",
    company: "Company",
    phone: "Phone",
    email: "Email",
    fleetSize: "Fleet size",
    industry: "Industry",
    features: "Interested features",
    contactMethod: "Preferred contact method",
    message: "Message",
    submit: "Submit",
    success: "Thank you. Our team will contact you shortly.",
    error: "Something went wrong. Please try again.",
    demoTitle: "Request a Demo",
    pricingTitle: "Request Pricing",
    contactTitle: "Contact Sales",
    required: "Required",
    invalidEmail: "Invalid email address",
    vehicleCount: "Number of vehicles",
  },
  alerts: {
    items: ["Overheating", "Low battery", "DTC detected", "Device offline", "Overspeed"],
  },
};

export default en;
