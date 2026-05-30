"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { PiaCoreSection } from "@/components/PiaCoreSection";
import { StrengthTrainingLog } from "./StrengthTrainingLog";
import { StrengthActionPanel } from "./StrengthActionPanel";

export function FitnessShell() {
  const [strengthRefresh, setStrengthRefresh] = useState(0);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-hidden bg-background pt-14 md:pt-0">
        <div className="flex h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col items-center gap-3 border-b border-border bg-background px-4 py-6 lg:hidden">
              <PiaCoreSection compact />
              <StrengthActionPanel
                onWorkoutSaved={() => setStrengthRefresh((n) => n + 1)}
              />
            </div>

            <div className="space-y-4 px-4 py-6 md:px-6">
              <div className="mb-6">
                <h1 className="text-lg font-semibold text-foreground">Fitness</h1>
                <p className="text-xs text-muted-foreground">
                  Styrketrening og øktlogg
                </p>
              </div>

              <StrengthTrainingLog refreshKey={strengthRefresh} />

              <div className="h-6" />
            </div>
          </div>

          <div className="hidden w-72 shrink-0 flex-col items-center gap-4 overflow-y-auto border-l border-border bg-background px-4 py-8 lg:flex xl:w-80">
            <PiaCoreSection compact />
            <StrengthActionPanel
              onWorkoutSaved={() => setStrengthRefresh((n) => n + 1)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
