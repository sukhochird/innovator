import { cn, getStatusColor } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  online?: boolean;
  className?: string;
}

export function StatusBadge({ status, online, className }: StatusBadgeProps) {
  const isOnline = online ?? status !== "OFFLINE";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium",
        "border-[var(--dash-card-border)] bg-[var(--dash-card)]",
        getStatusColor(status),
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isOnline ? "bg-current animate-pulse" : "bg-zinc-600",
        )}
      />
      {status}
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  accent?: string;
}

export function StatCard({ label, value, accent = "text-[var(--dash-text)]" }: StatCardProps) {
  return (
    <div className="rounded-lg border border-[var(--dash-card-border)] bg-[var(--dash-card)] p-4">
      <p className="text-xs uppercase tracking-wider text-[var(--dash-muted)]">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums", accent)}>
        {value}
      </p>
    </div>
  );
}
