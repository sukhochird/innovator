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
