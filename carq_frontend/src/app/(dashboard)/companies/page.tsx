"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { CompaniesManager } from "@/components/companies/CompaniesManager";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth-store";

export default function CompaniesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user && user.role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (!user || user.role !== "SUPER_ADMIN") {
    return null;
  }

  return (
    <DashboardLayout>
      <CompaniesManager />
    </DashboardLayout>
  );
}
