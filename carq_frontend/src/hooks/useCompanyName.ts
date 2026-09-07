"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { CompanyDashboard } from "@/lib/types";

export function useCompanyName() {
  const user = useAuthStore((s) => s.user);

  const { data } = useQuery({
    queryKey: ["company-dashboard-meta", user?.company],
    queryFn: () => apiFetch<CompanyDashboard>("/api/dashboard/company/"),
    enabled: user?.role === "COMPANY_ADMIN" && !!user.company,
    staleTime: 60_000,
  });

  return user?.company_name ?? data?.company?.name ?? null;
}
