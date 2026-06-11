"use client";

import { PiaCoreSection } from "@/components/PiaCoreSection";
import { StravaLog } from "@/app/fitness/StravaLog";

export function RunForrestShell() {
  return (
    <main className="min-w-0 flex-1 overflow-hidden bg-pia-bg">
      <div className="flex h-full overflow-hidden">
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="flex flex-col items-center gap-3 border-b border-border bg-pia-bg px-4 py-6 lg:hidden">
            <PiaCoreSection compact embedded />
          </div>

          <div className="space-y-4 px-4 py-6 md:px-8">
            <div className="mb-2 border-b border-border pb-4">
              <h1 className="text-lg font-bold tracking-tight text-pia-text">
                Run Forrest
              </h1>
              <p className="text-xs text-pia-muted">
                Strava-løp, progresjon og AI-analyse
              </p>
            </div>
            <StravaLog dark />
            <div className="h-6" />
          </div>
        </div>

        <div className="hidden w-72 shrink-0 flex-col items-center gap-4 overflow-y-auto border-l border-border bg-pia-bg px-4 py-8 lg:flex xl:w-80">
          <PiaCoreSection compact embedded />
        </div>
      </div>
    </main>
  );
}
