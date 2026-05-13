import { Sidebar } from "@/components/sidebar";
import { BrainCircuit } from "lucide-react";

export default function AgentPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background pt-14 md:pt-0">
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <BrainCircuit className="h-7 w-7 text-primary/60" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-foreground">Agent</h1>
            <p className="text-sm text-muted-foreground">Under construction</p>
          </div>
        </div>
      </main>
    </div>
  );
}
