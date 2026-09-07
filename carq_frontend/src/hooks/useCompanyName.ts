"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { CompanyDashboard } from "@/lib/types";

export const DASHBOARD_QUERY_KEY = "company-dashboard";

export function useCompanyName() {
  const user = useAuthStore((s) => s.user);

  const { data } = useQuery({
    queryKey: [DASHBOARD_QUERY_KEY, user?.role],
    queryFn: () => apiFetch<CompanyDashboard>("/api/dashboard/company/"),
    enabled: user?.role === "COMPANY_ADMIN" && !!user.company,
    staleTime: 60_000,
    select: (d) => d?.company?.name ?? null,
  });

  return user?.company_name ?? data ?? null;
}
