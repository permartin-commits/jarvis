"use client";

import { PiaCoreSection } from "@/components/PiaCoreSection";
import { StravaLog } from "@/app/fitness/StravaLog";

export function RunForrestShell() {
  return (
    <main className="min-w-0 flex-1 overflow-hidden bg-zinc-950 pt-14 md:pt-0">
      <div className="flex h-full overflow-hidden">
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="flex flex-col items-center gap-3 border-b border-zinc-800 bg-zinc-950 px-4 py-6 lg:hidden">
            <PiaCoreSection compact embedded />
          </div>

          <div className="space-y-4 px-4 py-6 md:px-8">
            <div className="mb-2 border-b border-zinc-800 pb-4">
              <h1 className="text-lg font-bold tracking-tight text-zinc-100">
                Run Forrest
              </h1>
              <p className="text-xs text-zinc-500">
                Strava-løp, progresjon og AI-analyse
              </p>
            </div>
            <StravaLog dark />
            <div className="h-6" />
          </div>
        </div>

        <div className="hidden w-72 shrink-0 flex-col items-center gap-4 overflow-y-auto border-l border-zinc-800 bg-zinc-950 px-4 py-8 lg:flex xl:w-80">
          <PiaCoreSection compact embedded />
        </div>
      </div>
    </main>
  );
}
