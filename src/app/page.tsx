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
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden
          >
            <div className="absolute left-1/2 top-0 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-[100px]" />
            <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-palette-pink/[0.06] blur-[80px]" />
          </div>

          <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 py-10 md:py-14 md:px-8">
            <PiaCoreSection greeting={timeOfDay} hero />
            <AiOverviewPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
