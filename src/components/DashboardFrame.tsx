import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";

export function DashboardFrame({
  children,
  rightPanel,
}: {
  children: ReactNode;
  rightPanel?: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 overflow-hidden">
        {children}
        {rightPanel}
      </div>
    </div>
  );
}
