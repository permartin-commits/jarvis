import { DashboardFrame } from "@/components/DashboardFrame";
import { PiaChatRightPanel } from "@/components/PiaChatRightPanel";
import { PiaCoreSection } from "@/components/PiaCoreSection";
import { SystemMonitor } from "./SystemMonitor";

export default function AgentPage() {
  return (
    <DashboardFrame rightPanel={<PiaChatRightPanel />}>
      <main className="min-w-0 flex-1 overflow-y-auto bg-zinc-950 pt-14 md:pt-0">
        <div className="flex flex-col items-center gap-3 border-b border-zinc-800 bg-zinc-950 px-4 py-6 lg:hidden">
          <PiaCoreSection compact embedded />
        </div>
        <SystemMonitor />
      </main>
    </DashboardFrame>
  );
}
