"use client";

import { useState } from "react";
import { Mountain, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BeastmakerTimer } from "@/app/fitness/BeastmakerTimer";
import { ClimbingRouteForm } from "./ClimbingRouteForm";

interface KlatringActionPanelProps {
  onBeastmakerSaved?: () => void;
  onRouteSaved?: () => void;
}

export function KlatringActionPanel({
  onBeastmakerSaved,
  onRouteSaved,
}: KlatringActionPanelProps) {
  const [routeSheetOpen, setRouteSheetOpen] = useState(false);

  return (
    <div className="w-full space-y-3">
      <Separator className="bg-border/80" />

      <div className="w-full space-y-3 rounded-xl border border-border bg-card/80 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Beastmaker
        </p>
        <BeastmakerTimer onSessionSaved={onBeastmakerSaved} />
      </div>

      <div className="w-full space-y-3 rounded-xl border border-border bg-card/80 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Ruter
        </p>

        <Sheet open={routeSheetOpen} onOpenChange={setRouteSheetOpen}>
          <SheetTrigger
            render={
              <Button className="h-9 w-full gap-2 text-xs font-semibold shadow-sm">
                <Plus className="h-3.5 w-3.5" />
                Registrer rute
              </Button>
            }
          />
          <SheetContent
            side="right"
            className="flex w-full flex-col gap-0 border-border bg-card p-0 sm:max-w-md"
          >
            <SheetHeader className="shrink-0 border-b border-border px-4 py-3">
              <SheetTitle className="flex items-center gap-2 text-foreground">
                <Mountain className="h-4 w-4 text-primary" />
                Ny rute
              </SheetTitle>
              <SheetDescription>
                Logg send eller prosjekt. Uten send-dato tagges ruten som
                Prosjekt.
              </SheetDescription>
            </SheetHeader>
            <ClimbingRouteForm
              onSaved={onRouteSaved}
              onClose={() => setRouteSheetOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
