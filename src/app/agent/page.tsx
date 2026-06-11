import { DashboardFrame } from "@/components/DashboardFrame";
import { PiaChatRightPanel } from "@/components/PiaChatRightPanel";
import { PiaCoreSection } from "@/components/PiaCoreSection";
import { SystemMonitor } from "./SystemMonitor";

export default function AgentPage() {
  return (
    <DashboardFrame rightPanel={<PiaChatRightPanel />}>
      <main className="min-w-0 flex-1 overflow-y-auto bg-pia-bg">
        <div className="flex flex-col items-center gap-3 border-b border-border bg-pia-bg px-4 py-6 lg:hidden">
          <PiaCoreSection compact embedded />
        </div>
        <SystemMonitor />
      </main>
    </DashboardFrame>
  );
}
