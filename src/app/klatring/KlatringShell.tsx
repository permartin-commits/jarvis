"use client";

import { useState } from "react";
import { BrainCircuit, Grip, Timer } from "lucide-react";
import { PiaCoreSection } from "@/components/PiaCoreSection";
import { BeastmakerLogger } from "@/app/fitness/BeastmakerLogger";
import { TrainingSessionsLog } from "./TrainingSessionsLog";
import { cn } from "@/lib/utils";
import { PIA_TAB_ACTIVE, PIA_TAB_INACTIVE } from "@/lib/pia-panel-styles";
import { ClimbingRouteLog } from "./ClimbingRouteLog";
import { KlatringActionPanel } from "./KlatringActionPanel";

type KlatringTab = "beastmaker" | "klatring" | "trener";

const TABS: { id: KlatringTab; label: string; icon: typeof Timer }[] = [
  { id: "beastmaker", label: "Beastmaker", icon: Timer },
  { id: "klatring", label: "Klatring", icon: Grip },
  { id: "trener", label: "Trener", icon: BrainCircuit },
];

export function KlatringShell() {
  const [tab, setTab] = useState<KlatringTab>("beastmaker");
  const [beastmakerRefresh, setBeastmakerRefresh] = useState(0);
  const [routesRefresh, setRoutesRefresh] = useState(0);

  const isTrener = tab === "trener";

  return (
    <main className="min-w-0 flex-1 overflow-hidden bg-pia-bg">
      <div className="flex h-full overflow-hidden">
        <div className="min-w-0 flex-1 overflow-y-auto">
          {!isTrener && (
            <div className="flex flex-col items-center gap-3 border-b border-border bg-pia-bg px-4 py-6 lg:hidden">
              <PiaCoreSection compact embedded />
              <KlatringActionPanel
                onBeastmakerSaved={() => setBeastmakerRefresh((n) => n + 1)}
                onRouteSaved={() => setRoutesRefresh((n) => n + 1)}
              />
            </div>
          )}

          <div className="space-y-4 px-4 py-6 md:px-6">
            <div className="mb-4">
              <h1 className="text-lg font-bold tracking-tight text-pia-text">
                Klatring
              </h1>
              <p className="text-xs text-pia-muted">
                Beastmaker, rutelogg og trener
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-all",
                    tab === id ? PIA_TAB_ACTIVE : PIA_TAB_INACTIVE
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={tab === id ? 2.25 : 2} />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>

            {tab === "beastmaker" && (
              <>
                <TrainingSessionsLog refreshKey={beastmakerRefresh} />
                <BeastmakerLogger refreshKey={beastmakerRefresh} dark />
              </>
            )}
            {tab === "klatring" && (
              <ClimbingRouteLog refreshKey={routesRefresh} />
            )}
            {tab === "trener" && (
              <PiaCoreSection
                chatApi="/api/trener-chat"
                labelText="TRENER"
                sublabelText="Klatring AI"
                waitingText="Trener tenker…"
                embedded
              />
            )}

            <div className="h-6" />
          </div>
        </div>

        <div className="hidden w-72 shrink-0 flex-col items-center gap-4 overflow-y-auto border-l border-border bg-pia-bg px-4 py-8 lg:flex xl:w-80">
          {isTrener ? (
            <KlatringActionPanel
              onBeastmakerSaved={() => setBeastmakerRefresh((n) => n + 1)}
              onRouteSaved={() => setRoutesRefresh((n) => n + 1)}
            />
          ) : (
            <>
              <PiaCoreSection compact embedded />
              <KlatringActionPanel
                onBeastmakerSaved={() => setBeastmakerRefresh((n) => n + 1)}
                onRouteSaved={() => setRoutesRefresh((n) => n + 1)}
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
