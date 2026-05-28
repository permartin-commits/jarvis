"use client";

import { useState } from "react";
import { Dumbbell, Pencil, Plus } from "lucide-react";
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
import { LiveWorkoutLogger } from "./LiveWorkoutLogger";
import { FastOktEditor } from "./FastOktEditor";

interface StrengthActionPanelProps {
  onWorkoutSaved?: () => void;
}

export function StrengthActionPanel({ onWorkoutSaved }: StrengthActionPanelProps) {
  const [open, setOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [templateVersion, setTemplateVersion] = useState(0);

  return (
    <div className="w-full space-y-3">
      <Separator className="bg-border/80" />

      <div className="w-full space-y-3 rounded-xl border border-border bg-card/80 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Styrke
        </p>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button className="h-9 w-full gap-2 text-xs font-semibold shadow-sm">
                <Plus className="h-3.5 w-3.5" />
                Logg økt
              </Button>
            }
          />
          <SheetContent
            side="right"
            className="flex w-full flex-col gap-0 border-border bg-card p-0 sm:max-w-md"
          >
            <SheetHeader className="shrink-0 border-b border-border px-4 py-3">
              <SheetTitle className="flex items-center gap-2 text-foreground">
                <Dumbbell className="h-4 w-4 text-primary" />
                Styrkeøkt
              </SheetTitle>
              <SheetDescription>
                Planlegg hjemme eller logg sett underveis — lagres når du
                lagrer plan eller fullfører økten.
              </SheetDescription>
            </SheetHeader>
            <LiveWorkoutLogger
              templateVersion={templateVersion}
              onWorkoutSaved={onWorkoutSaved}
              onClose={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <Button
          type="button"
          variant="outline"
          className="h-9 w-full gap-2 text-xs font-medium"
          onClick={() => setEditorOpen(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
          Rediger faste økter
        </Button>

        <FastOktEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          onChanged={() => setTemplateVersion((n) => n + 1)}
        />
      </div>
    </div>
  );
}
