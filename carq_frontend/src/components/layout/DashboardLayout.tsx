"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Gauge,
  LayoutDashboard,
  LogOut,
  Map,
  Settings,
  Shield,
  Truck,
  Users,
  Wrench,
} from "lucide-react";

import { ThemeToggle } from "@/components/ui/ThemeToggle";

import { useCompanyName } from "@/hooks/useCompanyName";
import { useAuthStore } from "@/lib/auth-store";
import { clearTokens } from "@/lib/api";
import { useThemeStore } from "@/lib/theme-store";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

const NAV_ITEMS: Record<
  UserRole,
  Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }> }>
> = {
  SUPER_ADMIN: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/companies", label: "Companies", icon: Building2 },
    { href: "/devices", label: "Devices", icon: Cpu },
    { href: "/vehicles", label: "Vehicles", icon: Truck },
  ],
  COMPANY_ADMIN: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/fleet", label: "Fleet", icon: Map },
    { href: "/vehicles", label: "Vehicles", icon: Truck },
    { href: "/drivers", label: "Drivers", icon: Users },
    { href: "/devices", label: "Devices", icon: Cpu },
    { href: "/alerts", label: "Alerts", icon: AlertTriangle },
    { href: "/dtc", label: "DTC", icon: Wrench },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
  DRIVER: [{ href: "/dashboard", label: "My Vehicle", icon: Gauge }],
};

const ROLE_CONFIG = {
  SUPER_ADMIN: {
    accentClass: "text-violet-400",
    accentBg: "bg-violet-500/10",
    accentBorder: "border-violet-500/25",
    badge: "Platform Admin",
    subtitle: "CARQ system administration",
    logoIcon: Shield,
  },
  COMPANY_ADMIN: {
    accentClass: "text-cyan-400",
    accentBg: "bg-cyan-500/10",
    accentBorder: "border-cyan-500/25",
    badge: "Fleet",
    subtitle: "Operations & fleet management",
    logoIcon: Map,
  },
  DRIVER: {
    accentClass: "text-emerald-400",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/25",
    badge: "Driver",
    subtitle: "Vehicle monitoring",
    logoIcon: Gauge,
  },
} as const;

const SIDEBAR_EXPANDED = 240;
const SIDEBAR_COLLAPSED = 72;

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { sidebarCollapsed, toggleSidebar } = useThemeStore();
  const companyNameFromApi = useCompanyName();

  if (!user) return null;

  const items = NAV_ITEMS[user.role] || [];
  const roleConfig = ROLE_CONFIG[user.role];
  const LogoIcon = roleConfig.logoIcon;
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isCompanyAdmin = user.role === "COMPANY_ADMIN";
  const companyName = companyNameFromApi;
  const headerTitle =
    isCompanyAdmin && companyName
      ? companyName
      : isSuperAdmin
        ? "CARQ Platform"
        : "CARQ";
  const headerSubtitle = isCompanyAdmin
    ? roleConfig.subtitle
    : isSuperAdmin
      ? roleConfig.subtitle
      : roleConfig.subtitle;

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  const handleLogout = () => {
    clearTokens();
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[var(--dash-bg)] text-[var(--dash-text)]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[var(--dash-border)] bg-[var(--sidebar-bg)] transition-[width] duration-200 ease-in-out",
          isSuperAdmin && "border-violet-500/10",
          isCompanyAdmin && "border-cyan-500/10",
        )}
        style={{ width: sidebarWidth }}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b border-[var(--dash-border)] px-3",
            sidebarCollapsed ? "justify-center" : "justify-between gap-2",
          )}
        >
          {!sidebarCollapsed && (
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                  roleConfig.accentBg,
                  roleConfig.accentBorder,
                  roleConfig.accentClass,
                )}
              >
                <LogoIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight">CARQ</p>
                <p className={cn("truncate text-[10px] font-medium uppercase tracking-wider", roleConfig.accentClass)}>
                  {isCompanyAdmin && companyName ? companyName : roleConfig.badge}
                </p>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg border",
                roleConfig.accentBg,
                roleConfig.accentBorder,
                roleConfig.accentClass,
              )}
            >
              <LogoIcon className="h-4 w-4" />
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="rounded-md p-1.5 text-[var(--dash-muted)] hover:bg-[var(--dash-hover)] hover:text-[var(--dash-text)]"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {sidebarCollapsed && (
          <div className="flex justify-center border-b border-[var(--dash-border)] py-2">
            <button
              type="button"
              onClick={toggleSidebar}
              className="rounded-md p-1.5 text-[var(--dash-muted)] hover:bg-[var(--dash-hover)] hover:text-[var(--dash-text)]"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                title={sidebarCollapsed ? label : undefined}
                className={cn(
                  "flex items-center rounded-lg text-sm transition-colors",
                  sidebarCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2",
                  active
                    ? cn(
                        "bg-[var(--dash-active)] text-[var(--dash-text)]",
                        isSuperAdmin && "ring-1 ring-violet-500/20",
                        isCompanyAdmin && "ring-1 ring-cyan-500/20",
                      )
                    : "text-[var(--dash-muted)] hover:bg-[var(--dash-hover)] hover:text-[var(--dash-text)]",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--dash-border)] p-2">
          {!sidebarCollapsed && (
            <div className="mb-2 truncate px-3 text-xs text-[var(--dash-muted)]">
              {user.first_name} {user.last_name}
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            title={sidebarCollapsed ? "Sign out" : undefined}
            className={cn(
              "flex w-full items-center rounded-lg text-sm text-[var(--dash-muted)] hover:bg-[var(--dash-hover)] hover:text-[var(--dash-text)]",
              sidebarCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2",
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && "Sign out"}
          </button>
        </div>
      </aside>

      <div className="transition-[margin-left] duration-200 ease-in-out" style={{ marginLeft: sidebarWidth }}>
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--dash-border)] bg-[var(--dash-header-bg)] px-4 backdrop-blur-md sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-base font-semibold text-[var(--dash-text)] sm:text-lg">
                {headerTitle}
              </h1>
              {isSuperAdmin && (
                <span className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-400">
                  Super Admin
                </span>
              )}
              {isCompanyAdmin && companyName && (
                <span className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                  Company
                </span>
              )}
            </div>
            <p className="truncate text-xs text-[var(--dash-muted)]">{headerSubtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden items-center gap-2 text-xs text-[var(--dash-muted)] sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              LIVE
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
