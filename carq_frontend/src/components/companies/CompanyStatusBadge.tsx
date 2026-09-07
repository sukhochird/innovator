import { cn } from "@/lib/utils";
import type { CompanyStatus } from "@/lib/types";

const STATUS_STYLES: Record<CompanyStatus, string> = {
  PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  ACTIVE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  SUSPENDED: "border-red-500/30 bg-red-500/10 text-red-500",
  REJECTED: "border-zinc-500/30 bg-zinc-500/10 text-zinc-500",
};

export function CompanyStatusBadge({ status }: { status: string }) {
  const key = status as CompanyStatus;
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        STATUS_STYLES[key] ?? STATUS_STYLES.REJECTED,
      )}
    >
      {status}
    </span>
  );
}
