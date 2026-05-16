import { Sidebar } from "@/components/sidebar";
import { SystemMonitor } from "./SystemMonitor";

export default function AgentPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background pt-14 md:pt-0">
        <SystemMonitor />
      </main>
    </div>
  );
}
