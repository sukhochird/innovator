import { cn } from "@/lib/utils";

export function Section({
  id,
  className,
  children,
  dark = true,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative px-4 py-20 md:px-8 md:py-28 lg:px-12",
        dark ? "bg-[var(--landing-bg)]" : "bg-[var(--landing-bg-alt)]",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function SectionHeading({
  title,
  subtitle,
  align = "center",
}: {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("mb-12 md:mb-16", align === "center" && "text-center")}>
      <h2 className="text-3xl font-semibold tracking-tight text-[var(--landing-text)] md:text-4xl lg:text-[2.75rem] lg:leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 max-w-2xl text-base text-[var(--landing-muted)] md:text-lg",
            align === "center" && "mx-auto",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("reveal-on-scroll", className)}>
      {children}
    </div>
  );
}
