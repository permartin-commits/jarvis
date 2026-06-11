import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardPanel({
  title,
  icon,
  action,
  children,
  className,
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("pia-panel flex flex-col overflow-hidden", className)}>
      <div className="pia-panel-header flex shrink-0 items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <h2 className="truncate text-xs font-semibold uppercase tracking-widest text-pia-muted">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
