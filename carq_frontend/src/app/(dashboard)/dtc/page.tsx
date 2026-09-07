"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DtcHub } from "@/components/dtc/DtcHub";

export default function DtcPage() {
  return (
    <DashboardLayout>
      <DtcHub />
    </DashboardLayout>
  );
}
