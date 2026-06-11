import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function WidgetSectionHeader({ title }: { title: string }) {
  return (
    <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-pia-muted">
      {title}
    </p>
  );
}

export function WidgetPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("px-3 py-4", className)}>
      <WidgetSectionHeader title={title} />
      <div className="overflow-hidden rounded-lg border border-border/80 bg-pia-surface/25">
        {children}
      </div>
    </section>
  );
}
