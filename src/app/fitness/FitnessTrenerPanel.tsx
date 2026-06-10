"use client";

import { BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

export function FitnessTrenerPanel({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl ring-1",
          dark
            ? "bg-violet-500/10 ring-violet-500/25"
            : "bg-primary/10 ring-primary/20"
        )}
      >
        <BrainCircuit className={cn("h-6 w-6", dark ? "text-violet-400" : "text-primary")} />
      </div>
      <div>
        <p className={cn("text-sm font-semibold", dark ? "text-zinc-200" : "text-foreground")}>
          Trener
        </p>
        <p className={cn("mt-1 text-xs", dark ? "text-zinc-500" : "text-muted-foreground")}>
          AI-treningsveiledning kommer snart.
        </p>
      </div>
    </div>
  );
}
