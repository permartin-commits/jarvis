import type { ReactNode } from "react";
import { TopNav } from "@/components/TopNav";

export function DashboardFrame({
  children,
  rightPanel,
}: {
  children: ReactNode;
  rightPanel?: ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-pia-bg">
      <TopNav />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {children}
        {rightPanel}
      </div>
    </div>
  );
}
