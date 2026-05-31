"use client";

import { Separator } from "@/components/ui/separator";
import { BeastmakerStopwatchStartButton } from "@/app/fitness/BeastmakerTimer";
import { MaxHangsStartButton } from "./MaxHangsPlayer";
import { RepeatersStartButton } from "./RepeatersPlayer";
import { ClimbingRouteRegisterButton } from "./ClimbingRouteForm";

interface KlatringActionPanelProps {
  onBeastmakerSaved?: () => void;
  onRouteSaved?: () => void;
}

export function KlatringActionPanel({
  onBeastmakerSaved,
  onRouteSaved,
}: KlatringActionPanelProps) {
  return (
    <div className="w-full space-y-3">
      <Separator className="bg-border/80" />

      <MaxHangsStartButton onSessionSaved={onBeastmakerSaved} />
      <RepeatersStartButton onSessionSaved={onBeastmakerSaved} />
      <BeastmakerStopwatchStartButton onSessionSaved={onBeastmakerSaved} />
      <ClimbingRouteRegisterButton onRouteSaved={onRouteSaved} />
    </div>
  );
}
