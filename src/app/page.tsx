import { Sidebar } from "@/components/sidebar";
import { PiaCoreSection } from "@/components/PiaCoreSection";
import { AiOverviewPanel } from "@/components/AiOverviewPanel";

export const dynamic = "force-dynamic";

export default function Home() {
  const timeOfDay = (() => {
    const h = parseInt(
      new Intl.DateTimeFormat("nb-NO", {
        timeZone: "Europe/Oslo",
        hour: "numeric",
        hour12: false,
      }).format(new Date()),
      10
    );
    if (h < 6) return "God natt";
    if (h < 12) return "God morgen";
    if (h < 18) return "God dag";
    return "God kveld";
  })();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="home-surface flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="relative min-h-full">
          <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 py-10 md:py-14 md:px-8">
            <PiaCoreSection greeting={timeOfDay} hero />
            <AiOverviewPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
