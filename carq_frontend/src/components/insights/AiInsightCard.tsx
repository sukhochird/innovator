"use client";

import { memo } from "react";
import { Sparkles } from "lucide-react";

import type { AiInsight } from "@/lib/ai-insights";
import { cn } from "@/lib/utils";

interface AiInsightCardProps {
  insight: AiInsight;
  className?: string;
}

const PRIORITY_STYLES = {
  info: {
    border: "border-cyan-500/20",
    bg: "bg-gradient-to-br from-cyan-500/5 to-transparent",
    icon: "text-cyan-400",
    badge: "bg-cyan-500/10 text-cyan-400",
  },
  watch: {
    border: "border-amber-500/20",
    bg: "bg-gradient-to-br from-amber-500/5 to-transparent",
    icon: "text-amber-400",
    badge: "bg-amber-500/10 text-amber-400",
  },
  action: {
    border: "border-orange-500/20",
    bg: "bg-gradient-to-br from-orange-500/5 to-transparent",
    icon: "text-orange-400",
    badge: "bg-orange-500/10 text-orange-400",
  },
  critical: {
    border: "border-red-500/25",
    bg: "bg-gradient-to-br from-red-500/8 to-transparent",
    icon: "text-red-400",
    badge: "bg-red-500/10 text-red-400",
  },
};

export const AiInsightCard = memo(function AiInsightCard({ insight, className }: AiInsightCardProps) {
  const style = PRIORITY_STYLES[insight.priority];

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5",
        style.border,
        style.bg,
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/[0.02] blur-2xl" />

      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 rounded-lg bg-[var(--surface-deep)]/80 p-2", style.icon)}>
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--dash-muted)]">
              AI Fleet Insight
            </p>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium uppercase", style.badge)}>
              {insight.priority}
            </span>
          </div>
          <h3 className="text-base font-semibold text-[var(--dash-text)]">{insight.headline}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--dash-text-secondary)]">{insight.body}</p>
          {insight.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {insight.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-[var(--dash-border)] bg-[var(--surface-deep)]/60 px-2 py-0.5 font-mono text-[10px] text-[var(--dash-muted)]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
});
