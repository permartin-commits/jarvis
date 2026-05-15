import { Sidebar } from "@/components/sidebar";
import { PiaCoreSection } from "@/components/PiaCoreSection";
import { BeastmakerLogger } from "./BeastmakerLogger";
import { StravaLog } from "./StravaLog";
import { Separator } from "@/components/ui/separator";

export default function FitnessPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-hidden bg-background pt-14 md:pt-0">
        <div className="flex h-full overflow-hidden">

          {/* ── Left: Training log ────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-10 border-r border-border">

            {/* Page title */}
            <div>
              <h1 className="text-lg font-semibold text-foreground">Fitness</h1>
              <p className="text-xs text-muted-foreground">Treningsdagbok og aktivitetslogg</p>
            </div>

            {/* Beastmaker section */}
            <BeastmakerLogger />

            <Separator className="opacity-40" />

            {/* Strava section */}
            <StravaLog />

            {/* Bottom padding */}
            <div className="h-6" />
          </div>

          {/* ── Right: PIA compact ───────────────────────────────── */}
          <div className="hidden lg:flex w-72 xl:w-80 flex-col items-center overflow-y-auto px-4 py-8 gap-4 bg-sidebar/40">
            <PiaCoreSection compact />
          </div>

        </div>
      </main>
    </div>
  );
}
