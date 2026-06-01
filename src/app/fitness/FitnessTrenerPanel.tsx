"use client";

import { BrainCircuit } from "lucide-react";

export function FitnessTrenerPanel() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
        <BrainCircuit className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Trener</p>
        <p className="mt-1 text-xs text-muted-foreground">
          AI-treningsveiledning kommer snart.
        </p>
      </div>
    </div>
  );
}
