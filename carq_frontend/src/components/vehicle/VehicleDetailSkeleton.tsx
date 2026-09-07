"use client";

export function VehicleDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="space-y-2 border-b border-[var(--dash-border)] pb-4">
        <div className="h-3 w-12 rounded bg-[var(--skeleton)]" />
        <div className="h-6 w-72 rounded bg-[var(--skeleton)]" />
        <div className="h-3 w-48 rounded bg-[var(--skeleton)]" />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-[var(--skeleton)]" />
        ))}
      </div>

      <div className="h-16 rounded-xl bg-[var(--skeleton)]" />

      <div className="h-[420px] rounded-2xl bg-[var(--skeleton)]" />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-2xl bg-[var(--skeleton)]" />
        <div className="h-64 rounded-2xl bg-[var(--skeleton)]" />
      </div>
    </div>
  );
}
