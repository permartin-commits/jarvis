"use client";

import { useState } from "react";
import { BrainCircuit, Dumbbell, Settings2 } from "lucide-react";
import { PiaCoreSection } from "@/components/PiaCoreSection";
import { StrengthTrainingLog } from "./StrengthTrainingLog";
import { StrengthActionPanel } from "./StrengthActionPanel";
import { FitnessAdminPanel } from "./FitnessAdminPanel";
import { FitnessTrenerPanel } from "./FitnessTrenerPanel";
import { cn } from "@/lib/utils";

type FitnessTab = "styrke" | "admin" | "trener";

const TABS: { id: FitnessTab; label: string; icon: typeof Dumbbell }[] = [
  { id: "styrke", label: "Styrketrening", icon: Dumbbell },
  { id: "admin", label: "Admin", icon: Settings2 },
  { id: "trener", label: "Trener", icon: BrainCircuit },
];

export function FitnessShell() {
  const [tab, setTab] = useState<FitnessTab>("styrke");
  const [strengthRefresh, setStrengthRefresh] = useState(0);

  return (
    <main className="min-w-0 flex-1 overflow-hidden bg-zinc-950 pt-14 md:pt-0">
      <div className="flex h-full overflow-hidden">
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="flex flex-col items-center gap-3 border-b border-zinc-800 bg-zinc-950 px-4 py-6 lg:hidden">
            <PiaCoreSection compact embedded />
            <StrengthActionPanel
              onWorkoutSaved={() => setStrengthRefresh((n) => n + 1)}
            />
          </div>

          <div className="space-y-4 px-4 py-6 md:px-6">
            <div className="mb-4">
              <h1 className="text-lg font-bold tracking-tight text-zinc-100">
                Fitness
              </h1>
              <p className="text-xs text-zinc-500">
                Styrketrening, øktadmin og trener
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
                    tab === id
                      ? "border-violet-500/40 bg-violet-500/10 text-violet-300 shadow-sm ring-1 ring-violet-500/20"
                      : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={tab === id ? 2.25 : 2} />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>

            {tab === "styrke" && (
              <StrengthTrainingLog refreshKey={strengthRefresh} dark />
            )}
            {tab === "admin" && (
              <FitnessAdminPanel
                refreshKey={strengthRefresh}
                onWorkoutSaved={() => setStrengthRefresh((n) => n + 1)}
                dark
              />
            )}
            {tab === "trener" && <FitnessTrenerPanel dark />}

            <div className="h-6" />
          </div>
        </div>

        <div className="hidden w-72 shrink-0 flex-col items-center gap-4 overflow-y-auto border-l border-zinc-800 bg-zinc-950 px-4 py-8 lg:flex xl:w-80">
          <PiaCoreSection compact embedded />
          <StrengthActionPanel
            onWorkoutSaved={() => setStrengthRefresh((n) => n + 1)}
          />
        </div>
      </div>
    </main>
  );
}
