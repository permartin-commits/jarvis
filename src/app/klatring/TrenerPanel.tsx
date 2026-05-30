"use client";

import { BrainCircuit, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function TrenerPanel() {
  return (
    <section className="overflow-hidden rounded-xl border border-border">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
          <BrainCircuit className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <h2 className="text-sm font-semibold text-foreground">AI-trener</h2>
          <p className="text-xs text-muted-foreground">Kommer snart</p>
        </div>
      </header>

      <div className="p-4">
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary ring-1 ring-border">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-2 max-w-sm">
              <p className="text-sm font-medium text-foreground">
                Chat om progresjon og trening
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Her får du snart en AI-trener som kjenner Beastmaker-loggen og
                rutene dine, og kan hjelpe med planlegging og analyse.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
