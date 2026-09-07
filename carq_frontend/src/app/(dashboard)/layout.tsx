"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { User } from "@/lib/types";

export default function DashboardAuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("carq_access");
    if (!token) {
      router.replace("/login");
      return;
    }

    apiFetch<User>("/api/auth/me/")
      .then((freshUser) => {
        setUser(freshUser);
        setProfileReady(true);
      })
      .catch(() => router.replace("/login"));
  }, [setUser, router]);

  if (!profileReady || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--dash-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
