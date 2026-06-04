import { Sidebar } from "@/components/sidebar";
import { BusinessShell } from "./BusinessShell";

export const dynamic = "force-dynamic";

export default function BusinessPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden bg-zinc-950 pt-14 md:pt-0">
        <BusinessShell />
      </main>
    </div>
  );
}
