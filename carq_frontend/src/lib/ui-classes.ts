/** Shared theme-aware Tailwind class strings */
export const ui = {
  pageTitle: "text-xl font-semibold text-[var(--dash-text)]",
  pageSubtitle: "text-sm text-[var(--dash-muted)]",
  card: "rounded-lg border border-[var(--dash-card-border)] bg-[var(--dash-card)]",
  cardLg: "rounded-2xl border border-[var(--dash-border)] bg-[var(--surface-elevated)]",
  cardInner: "rounded-xl border border-[var(--dash-border)] bg-[var(--surface-deep)]",
  input:
    "rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--dash-text)] placeholder:text-[var(--dash-muted)] focus:border-emerald-500 focus:outline-none",
  inputSm: "rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-1.5 text-sm text-[var(--dash-text)] placeholder:text-[var(--dash-muted)] focus:border-emerald-500 focus:outline-none",
  table: "w-full text-sm",
  tableHead: "border-b border-[var(--dash-border)] text-left text-xs uppercase text-[var(--dash-muted)]",
  tableRow: "border-b border-[var(--dash-border)]/50",
  tableRowHover: "border-b border-[var(--dash-border)]/50 hover:bg-[var(--dash-hover)]",
  skeleton: "bg-[var(--skeleton)]",
  sectionTitle: "text-sm font-semibold text-[var(--dash-text)]",
  textPrimary: "text-[var(--dash-text)]",
  textSecondary: "text-[var(--dash-text-secondary)]",
  textMuted: "text-[var(--dash-muted)]",
} as const;
