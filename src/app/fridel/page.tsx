import { DashboardFrame } from "@/components/DashboardFrame";
import { PiaChatRightPanel } from "@/components/PiaChatRightPanel";
import { PiaCoreSection } from "@/components/PiaCoreSection";
import { FridelDashboard } from "./FridelDashboard";

export default function FridelPage() {
  return (
    <DashboardFrame rightPanel={<PiaChatRightPanel />}>
      <main className="min-w-0 flex-1 overflow-hidden bg-pia-bg">
        <div className="flex flex-col items-center gap-3 border-b border-border bg-pia-bg px-4 py-6 lg:hidden">
          <PiaCoreSection compact embedded />
        </div>

        <div className="space-y-4 overflow-y-auto px-4 py-6 md:px-6">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-foreground">Fridel</h1>
            <p className="text-xs text-muted-foreground">
              Dashboard for hytter, brukere og bookinger
            </p>
          </div>

          <FridelDashboard />

          <div className="h-6" />
        </div>
      </main>
    </DashboardFrame>
  );
}
