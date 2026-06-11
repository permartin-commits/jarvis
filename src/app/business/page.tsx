import { DashboardFrame } from "@/components/DashboardFrame";
import { HomeRightPanel } from "@/components/home/HomeRightPanel";
import { BusinessShell } from "./BusinessShell";

export const dynamic = "force-dynamic";

export default function BusinessPage() {
  return (
    <DashboardFrame rightPanel={<HomeRightPanel />}>
      <main className="min-w-0 flex-1 overflow-hidden bg-pia-bg">
        <BusinessShell />
      </main>
    </DashboardFrame>
  );
}
