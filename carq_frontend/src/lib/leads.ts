export type LeadType = "demo" | "pricing" | "contact";

export interface LeadPayload {
  type: LeadType;
  name: string;
  company: string;
  phone: string;
  email: string;
  fleetSize?: string;
  industry?: string;
  features?: string;
  contactMethod?: string;
  message?: string;
}

export interface LeadResponse {
  success: boolean;
  id?: string;
  message?: string;
}

export async function submitLead(payload: LeadPayload): Promise<LeadResponse> {
  const res = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to submit");
  }

  return res.json();
}
