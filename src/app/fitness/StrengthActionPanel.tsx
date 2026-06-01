"use client";

import { useState } from "react";
import { Dumbbell, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AppModal } from "@/components/AppModal";
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

      <div className="w-full space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Styrke
        </p>

        <Button
          className="h-10 w-full gap-2 text-sm font-semibold shadow-sm"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Logg økt
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-10 w-full gap-2 text-sm font-medium"
          onClick={() => setEditorOpen(true)}
        >
          <Pencil className="h-4 w-4" />
          Rediger faste økter
        </Button>
      </div>

      <AppModal
        open={open}
        onClose={() => setOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            Styrkeøkt
          </span>
        }
        description="Planlegg hjemme eller logg sett underveis — lagres når du lagrer plan eller fullfører økten."
        maxWidth="max-w-xl"
        closeOnBackdrop={false}
      >
        <LiveWorkoutLogger
          templateVersion={templateVersion}
          onWorkoutSaved={() => {
            onWorkoutSaved?.();
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      </AppModal>

      <FastOktEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onChanged={() => setTemplateVersion((n) => n + 1)}
      />
    </div>
  );
}
