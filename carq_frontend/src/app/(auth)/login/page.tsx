"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Gauge, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ui } from "@/lib/ui-classes";
import { apiFetch, login } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { User } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("company@carq.local");
  const [password, setPassword] = useState("company123");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      const user = await apiFetch<User>("/api/auth/me/");
      setUser(user);
      router.push("/dashboard");
    } catch {
      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--dash-bg)] px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10">
            <Gauge className="h-7 w-7 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--dash-text)]">CARQ</h1>
          <p className="mt-1 text-sm text-[var(--dash-muted)]">Fleet Command Center</p>
        </div>

        <form onSubmit={handleSubmit} className={`${ui.card} p-6 shadow-xl`}>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--dash-muted)]">
                Email
              </label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${ui.input} w-full py-2.5`} required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--dash-muted)]">
                Password
              </label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${ui.input} w-full py-2.5`} required />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
          </button>

          <p className="mt-4 text-center text-xs text-[var(--dash-muted)]">
            Demo: company@carq.local / company123
          </p>
        </form>
      </div>
    </div>
  );
}
