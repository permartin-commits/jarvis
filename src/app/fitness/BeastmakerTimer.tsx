"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Timer,
  StopCircle,
  Save,
  X,
  Weight,
  MessageSquare,
} from "lucide-react";
import { AppModal } from "@/components/AppModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KLATRING_PANEL_BUTTON_CLASS } from "@/app/klatring/klatring-panel-buttons";

type Phase = "idle" | "countdown" | "running" | "form" | "saving";
type GripCm = 1 | 2 | 3;

const COUNTDOWN_FROM = -5;
const STOP_ADJUST_SEC = 1;

function formatDuration(s: number): string {
  const abs = Math.abs(s);
  const m = Math.floor(abs / 60);
  const sec = abs % 60;
  const str = `${m}:${sec.toString().padStart(2, "0")}`;
  return s < 0 ? `-${str}` : str;
}

function BeastmakerTimerModal({
  open,
  onClose,
  onSessionSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSessionSaved?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [cm, setCm] = useState<GripCm | null>(null);
  const [medVekt, setMedVekt] = useState(false);
  const [ekstravekt, setEkstravekt] = useState("");
  const [kommentar, setKommentar] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isCountdown =
    phase === "countdown" || (phase === "running" && elapsed < 0);
  const isActive = phase === "countdown" || phase === "running";
  const lockClose = isActive || phase === "saving";

  const resetAll = useCallback(() => {
    setCm(null);
    setMedVekt(false);
    setEkstravekt("");
    setKommentar("");
    setElapsed(0);
    setStartTime(null);
    setSaveError(null);
    setPhase("idle");
  }, []);

  const handleClose = useCallback(() => {
    if (lockClose) return;
    resetAll();
    onClose();
  }, [lockClose, resetAll, onClose]);

  useEffect(() => {
    if (!open) return;
    if (phase === "countdown" || phase === "running") {
      intervalRef.current = setInterval(() => {
        setElapsed((s) => {
          const next = s + 1;
          if (next === 0) setStartTime(new Date());
          if (next >= 0) setPhase("running");
          return next;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open, phase]);

  useEffect(() => {
    if (!open) resetAll();
  }, [open, resetAll]);

  function handleStart() {
    setElapsed(COUNTDOWN_FROM);
    setStartTime(null);
    setPhase("countdown");
  }

  function handleStop() {
    setElapsed((s) => Math.max(0, s - STOP_ADJUST_SEC));
    setPhase("form");
  }

  async function handleSave() {
    if (!cm || !startTime) return;
    setPhase("saving");
    setSaveError(null);
    try {
      const res = await fetch("/api/beastmaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          starttid: startTime.toISOString(),
          varighet_sekunder: Math.max(0, elapsed),
          cm_grip: cm,
          med_vekt: medVekt,
          ekstravekt_kg: medVekt && ekstravekt ? Number(ekstravekt) : null,
          kommentar: kommentar || null,
        }),
      });
      if (!res.ok) throw new Error("Lagring feilet");
      resetAll();
      onClose();
      onSessionSaved?.();
    } catch {
      setSaveError("Kunne ikke lagre. Prøv igjen.");
      setPhase("form");
    }
  }

  const modalDescription =
    isActive
      ? isCountdown
        ? "Gjør deg klar…"
        : "Henger nå…"
      : phase === "form"
        ? "Registrer grep og vekt"
        : "5 sek nedtelling, deretter heng-tid";

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      closeOnBackdrop={!lockClose}
      showCloseButton={!lockClose}
      maxWidth="max-w-md"
      aria-labelledby="beastmaker-timer-title"
      title={
        <span id="beastmaker-timer-title" className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          Beastmaker stoppeklokke
        </span>
      }
      description={modalDescription}
    >
      <div className="space-y-4 px-4 py-4">
        {phase === "idle" && (
          <div className="flex flex-col items-center gap-4 py-2">
            <p className="font-mono text-5xl font-bold tabular-nums text-foreground/20">
              0:00
            </p>
            <p className="text-center text-xs text-muted-foreground">
              Nedtelling fra -5, deretter teller klokken heng-tiden.
            </p>
            <Button
              type="button"
              className="h-10 w-full gap-2 text-sm font-semibold"
              onClick={handleStart}
            >
              <Timer className="h-4 w-4" />
              Start økt
            </Button>
          </div>
        )}

        {isActive && (
          <div className="flex flex-col items-center gap-4 py-4">
            <p
              className={cn(
                "font-mono text-5xl font-bold tabular-nums",
                isCountdown
                  ? "text-orange-500 animate-pulse"
                  : "text-primary animate-pulse"
              )}
            >
              {isCountdown ? elapsed : formatDuration(elapsed)}
            </p>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-10 w-full gap-2 text-sm font-semibold",
                isCountdown &&
                  "cursor-not-allowed border-border/40 text-muted-foreground/40"
              )}
              onClick={handleStop}
              disabled={isCountdown}
            >
              <StopCircle className="h-4 w-4" />
              Stopp
            </Button>
          </div>
        )}

        {(phase === "form" || phase === "saving") && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
              <Timer className="h-3.5 w-3.5 shrink-0 text-primary/70" />
              <span className="text-xs text-muted-foreground">Varighet</span>
              <span className="ml-auto text-sm font-bold tabular-nums text-primary">
                {formatDuration(Math.max(0, elapsed))}
              </span>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Grep
              </p>
              <div className="flex gap-2">
                {([1, 2, 3] as GripCm[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setCm(s)}
                    className={cn(
                      "flex-1 rounded-md border py-2 text-xs font-semibold transition-all",
                      cm === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {s} cm
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <Weight className="h-3 w-3" />
                Vekt
              </p>
              <div className="flex gap-2">
                {[false, true].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setMedVekt(val)}
                    className={cn(
                      "flex-1 rounded-md border py-2 text-xs font-semibold transition-all",
                      medVekt === val
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {val ? "Med" : "Uten"}
                  </button>
                ))}
              </div>
              {medVekt && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/20 px-2.5 py-2">
                  <input
                    type="number"
                    value={ekstravekt}
                    onChange={(e) => setEkstravekt(e.target.value)}
                    placeholder="0"
                    min={0}
                    step={0.5}
                    className="w-16 bg-transparent text-sm font-semibold tabular-nums text-foreground outline-none"
                  />
                  <span className="text-xs text-muted-foreground">kg</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                Kommentar
              </p>
              <textarea
                value={kommentar}
                onChange={(e) => setKommentar(e.target.value)}
                placeholder="Valgfritt…"
                rows={3}
                className="w-full resize-none rounded-lg border border-border/60 bg-secondary/15 px-2.5 py-2 text-xs outline-none focus-visible:border-ring"
              />
            </div>

            {saveError && (
              <p className="text-xs text-destructive">{saveError}</p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9 shrink-0 px-3"
                disabled={phase === "saving"}
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                className="h-9 flex-1 gap-2 text-xs font-semibold"
                disabled={!cm || phase === "saving"}
                onClick={handleSave}
              >
                <Save className="h-3.5 w-3.5" />
                {phase === "saving" ? "Lagrer…" : "Lagre"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppModal>
  );
}

/** Knapp i klatring-panelet — åpner stoppeklokke i popup. */
export function BeastmakerStopwatchStartButton({
  onSessionSaved,
}: {
  onSessionSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        className={KLATRING_PANEL_BUTTON_CLASS}
        onClick={() => setOpen(true)}
      >
        <Timer className="h-4 w-4" />
        Start stoppeklokke
      </Button>
      <BeastmakerTimerModal
        open={open}
        onClose={() => setOpen(false)}
        onSessionSaved={onSessionSaved}
      />
    </>
  );
}

/** @deprecated Bruk BeastmakerStopwatchStartButton */
export function BeastmakerTimer(props: { onSessionSaved?: () => void }) {
  return <BeastmakerStopwatchStartButton {...props} />;
}
