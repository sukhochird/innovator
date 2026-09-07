"use client";

import { MAP_VIEWS, type MapViewId } from "@/lib/map-utils";
import { cn } from "@/lib/utils";

interface MapViewControlProps {
  value: MapViewId;
  onChange: (view: MapViewId) => void;
  className?: string;
}

export function MapViewControl({ value, onChange, className }: MapViewControlProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-[var(--dash-border)] bg-[var(--surface-deep)]/95 p-0.5 backdrop-blur-sm",
        className,
      )}
    >
      {MAP_VIEWS.map((view) => (
        <button
          key={view.id}
          type="button"
          onClick={() => onChange(view.id)}
          title={view.label}
          className={cn(
            "rounded-md px-2 py-1 text-[10px] font-medium transition",
            value === view.id
              ? "bg-emerald-500/15 text-emerald-400"
              : "text-[var(--dash-muted)] hover:text-[var(--dash-text)]",
          )}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}
