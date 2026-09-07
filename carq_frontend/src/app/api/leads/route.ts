import { NextResponse } from "next/server";

import type { LeadPayload } from "@/lib/leads";

const leads: LeadPayload[] = [];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LeadPayload;

    if (!body.name?.trim() || !body.email?.trim() || !body.company?.trim()) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email" },
        { status: 400 },
      );
    }

    const record = {
      ...body,
      submittedAt: new Date().toISOString(),
    };

    leads.push(body);

    // Temporary in-memory store — replace with backend POST /api/leads/ when ready
    console.info("[CARQ Lead]", JSON.stringify(record));

    return NextResponse.json({
      success: true,
      id: `lead_${Date.now()}`,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ count: leads.length });
}
