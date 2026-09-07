export interface DtcKnowledge {
  title: string;
  cause: string;
  impact: string;
  action: string;
  urgency: "low" | "medium" | "high";
}

export const DTC_KNOWLEDGE: Record<string, DtcKnowledge> = {
  P0300: {
    title: "Random/Multiple Cylinder Misfire",
    cause: "Worn spark plugs, ignition coils, or fuel delivery inconsistency.",
    impact: "Reduced power, higher fuel use, possible catalytic converter damage.",
    action: "Inspect spark plugs and coils first. Avoid heavy load until resolved.",
    urgency: "high",
  },
  P0171: {
    title: "System Too Lean (Bank 1)",
    cause: "Vacuum leak, dirty MAF sensor, or weak fuel pump pressure.",
    impact: "Rough idle, hesitation under acceleration.",
    action: "Check air intake leaks and MAF sensor. Verify fuel pressure.",
    urgency: "medium",
  },
  P0420: {
    title: "Catalyst System Efficiency Below Threshold",
    cause: "Aging catalytic converter or upstream misfire/rich running.",
    impact: "Emissions failure, possible power loss over time.",
    action: "Confirm no active misfire codes first, then evaluate catalytic converter.",
    urgency: "medium",
  },
  P0115: {
    title: "Engine Coolant Temperature Circuit",
    cause: "Faulty ECT sensor or wiring/connectors.",
    impact: "Incorrect fan operation and fuel trim; overheating risk if ignored.",
    action: "Test coolant temp sensor and harness continuity.",
    urgency: "high",
  },
};

export function getDtcKnowledge(code: string): DtcKnowledge | null {
  return DTC_KNOWLEDGE[code.toUpperCase()] ?? null;
}

export function enrichDtcDescription(code: string, fallback?: string): string {
  return getDtcKnowledge(code)?.title ?? fallback ?? "Unknown diagnostic code";
}
