"use client";

import { PiaCoreSection } from "@/components/PiaCoreSection";

/** Mørk høyre kolonne med PIA-orb og chat — Agent, Fridel m.fl. */
export function PiaChatRightPanel() {
  return (
    <aside className="hidden h-screen w-72 shrink-0 flex-col overflow-y-auto border-l border-zinc-800 bg-zinc-950 lg:flex xl:w-80">
      <div className="flex flex-1 flex-col items-center px-4 py-8">
        <PiaCoreSection compact embedded />
      </div>
    </aside>
  );
}
