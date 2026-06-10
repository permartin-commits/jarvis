"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, Square, Timer } from "lucide-react";
import { AppModal } from "@/components/AppModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DEFAULT_HANG_SECONDS,
  DEFAULT_HOLD_SIZE,
  DEFAULT_MAX_HANGS_SETS,
  DEFAULT_REST_MINUTES,
  HOLD_SIZE_OPTIONS,
  MAX_HANGS_PREP_SECONDS,
  MAX_HANGS_PROTOCOL,
  clampMaxHangsConfig,
  formatTimerSeconds,
  phaseLabel,
  type HangLogDraft,
  type MaxHangsWorkoutConfig,
  type WorkoutPhase,
} from "@/lib/training";
import { cancelWorkoutSpeech, useWorkoutSpeechCues } from "@/lib/workout-speech";
import { KLATRING_PANEL_BUTTON_CLASS } from "./klatring-panel-buttons";

interface MaxHangsStartButtonProps {
  onSessionSaved?: () => void;
}

function CircularTimer({
  remaining,
  total,
  phase,
}: {
  remaining: number;
  total: number;
  phase: "prep" | "hang" | "rest";
}) {
  const progress = total > 0 ? remaining / total : 0;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference * (1 - progress);

  const ringClass =
    phase === "hang"
      ? "text-emerald-500"
      : phase === "rest"
        ? "text-red-500"
        : "text-amber-500";

  const bgClass =
    phase === "hang"
      ? "from-emerald-500/20 to-emerald-500/5"
      : phase === "rest"
        ? "from-red-500/20 to-red-500/5"
        : "from-amber-500/20 to-amber-500/5";

  return (
    <div
      className={cn(
        "relative mx-auto flex h-48 w-48 max-w-[min(72vw,12rem)] items-center justify-center rounded-full bg-gradient-to-b sm:h-52 sm:w-52",
        bgClass
      )}
    >
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-border/40"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "transition-[stroke-dashoffset] duration-1000 ease-linear",
            ringClass
          )}
        />
      </svg>
      <span
        className={cn(
          "relative z-10 font-mono text-4xl font-bold tabular-nums sm:text-5xl",
          ringClass
        )}
      >
        {formatTimerSeconds(remaining)}
      </span>
    </div>
  );
}

function ConfigField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      {children}
    </div>
  );
}

const inputClass =
  "h-9 w-full rounded-lg border border-border/60 bg-secondary/20 px-2.5 text-sm font-semibold tabular-nums text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function MaxHangsModal({
  open,
  onClose,
  onSessionSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSessionSaved?: () => void;
}) {
  const [phase, setPhase] = useState<WorkoutPhase>("idle");
  const [setNumber, setSetNumber] = useState(1);
  const [remaining, setRemaining] = useState(0);
  const [workout, setWorkout] = useState<MaxHangsWorkoutConfig | null>(null);

  const [totalSetsInput, setTotalSetsInput] = useState(String(DEFAULT_MAX_HANGS_SETS));
  const [hangSecondsInput, setHangSecondsInput] = useState(String(DEFAULT_HANG_SECONDS));
  const [restMinutesInput, setRestMinutesInput] = useState(String(DEFAULT_REST_MINUTES));
  const [holdSize, setHoldSize] = useState(DEFAULT_HOLD_SIZE);
  const [weightKg, setWeightKg] = useState("0");

  const [completedSets, setCompletedSets] = useState<HangLogDraft[]>([]);
  const [perceivedEffort, setPerceivedEffort] = useState(7);
  const [notes, setNotes] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [savingMode, setSavingMode] = useState<"none" | "save" | "analyze">(
    "none"
  );

  const transitioningRef = useRef(false);

  const hangSeconds = workout?.hangSeconds ?? DEFAULT_HANG_SECONDS;
  const restSeconds = workout?.restSeconds ?? DEFAULT_REST_MINUTES * 60;

  const isActive = phase === "prep" || phase === "hang" || phase === "rest";

  useWorkoutSpeechCues(phase, remaining, open && isActive, "rest");
  const phaseDuration =
    phase === "prep"
      ? MAX_HANGS_PREP_SECONDS
      : phase === "hang"
        ? hangSeconds
        : phase === "rest"
          ? restSeconds
          : 0;

  const resetAll = useCallback(() => {
    setPhase("idle");
    setSetNumber(1);
    setRemaining(0);
    setWorkout(null);
    setCompletedSets([]);
    setPerceivedEffort(7);
    setNotes("");
    setSaveError(null);
    setWebhookError(null);
    setAnalysis(null);
    transitioningRef.current = false;
    cancelWorkoutSpeech();
  }, []);

  const handleClose = useCallback(() => {
    if (isActive) return;
    resetAll();
    onClose();
  }, [isActive, resetAll, onClose]);

  const appendSet = useCallback(
    (actualSeconds: number, failed: boolean) => {
      if (!workout) return;
      setCompletedSets((prev) => [
        ...prev,
        {
          set_number: setNumber,
          rep_number: 1,
          hold_size: workout.holdSize,
          weight_added: workout.weight,
          target_time_seconds: workout.hangSeconds,
          actual_time_seconds: Math.min(
            workout.hangSeconds,
            Math.max(0, Math.round(actualSeconds))
          ),
          is_failed: failed,
        },
      ]);
    },
    [setNumber, workout]
  );

  const goToSummary = useCallback(() => {
    setPhase("summary");
    setRemaining(0);
    transitioningRef.current = false;
  }, []);

  useEffect(() => {
    if (!open) return;
    if (phase === "prep") setRemaining(MAX_HANGS_PREP_SECONDS);
    else if (phase === "hang") setRemaining(hangSeconds);
    else if (phase === "rest") setRemaining(restSeconds);
  }, [open, phase, setNumber, hangSeconds, restSeconds]);

  useEffect(() => {
    if (!open || !isActive || remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [open, isActive, remaining]);

  useEffect(() => {
    if (!open || !isActive || remaining > 0) {
      if (remaining > 0) transitioningRef.current = false;
      return;
    }
    if (transitioningRef.current || !workout) return;
    transitioningRef.current = true;

    if (phase === "prep") {
      setRemaining(hangSeconds);
      setPhase("hang");
      transitioningRef.current = false;
      return;
    }

    if (phase === "hang") {
      appendSet(hangSeconds, false);
      if (setNumber >= workout.totalSets) {
        goToSummary();
      } else {
        setRemaining(restSeconds);
        setPhase("rest");
      }
      transitioningRef.current = false;
      return;
    }

    if (phase === "rest") {
      if (setNumber >= workout.totalSets) {
        goToSummary();
      } else {
        setSetNumber((n) => n + 1);
        setRemaining(MAX_HANGS_PREP_SECONDS);
        setPhase("prep");
      }
      transitioningRef.current = false;
    }
  }, [
    open,
    remaining,
    phase,
    isActive,
    setNumber,
    appendSet,
    goToSummary,
    workout,
    hangSeconds,
    restSeconds,
  ]);

  function handleStartWorkout() {
    const { totalSets: sets, hangSeconds: hang, restSeconds: rest } =
      clampMaxHangsConfig({
        totalSets: Number(totalSetsInput),
        hangSeconds: Number(hangSecondsInput),
        restMinutes: Number(restMinutesInput),
      });

    setWorkout({
      totalSets: sets,
      hangSeconds: hang,
      restSeconds: rest,
      holdSize,
      weight: Math.max(0, Number(weightKg) || 0),
    });
    setCompletedSets([]);
    setSetNumber(1);
    setAnalysis(null);
    setWebhookError(null);
    setSaveError(null);
    transitioningRef.current = false;
    setRemaining(MAX_HANGS_PREP_SECONDS);
    setPhase("prep");
  }

  function handleFail() {
    if (phase !== "hang" || !workout) return;
    const actual = hangSeconds - remaining;
    appendSet(actual, true);
    transitioningRef.current = true;
    if (setNumber >= workout.totalSets) {
      goToSummary();
    } else {
      setRemaining(restSeconds);
      setPhase("rest");
    }
    setTimeout(() => {
      transitioningRef.current = false;
    }, 50);
  }

  function handleAbort() {
    if (isActive) goToSummary();
    else handleClose();
  }

  async function handleSave(runWebhook: boolean) {
    if (!workout || completedSets.length === 0) {
      setSaveError("Ingen sett å lagre.");
      return;
    }
    setPhase("saving");
    setSavingMode(runWebhook ? "analyze" : "save");
    setSaveError(null);
    setWebhookError(null);
    setAnalysis(null);

    const configNote = `${MAX_HANGS_PROTOCOL}: ${workout.totalSets} sett × ${workout.hangSeconds}s heng / ${workout.restSeconds / 60} min hvile · ${workout.holdSize}${workout.weight > 0 ? ` +${workout.weight} kg` : ""}`;
    const fullNotes = [configNote, notes.trim()].filter(Boolean).join("\n");

    try {
      const res = await fetch("/api/training-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocol_type: MAX_HANGS_PROTOCOL,
          perceived_effort: perceivedEffort,
          notes: fullNotes,
          is_completed: completedSets.length >= workout.totalSets,
          hang_logs: completedSets,
          run_webhook: runWebhook,
        }),
      });
      const data = await res.json();
      setSavingMode("none");

      if (!res.ok) {
        setSaveError(data.error ?? "Lagring feilet.");
        setPhase("summary");
        return;
      }

      onSessionSaved?.();

      if (!runWebhook) {
        resetAll();
        onClose();
        return;
      }

      if (!data.webhook_ok) {
        setWebhookError(
          data.webhook_error ?? "Økt lagret, men AI-analyse (n8n) feilet."
        );
      }
      if (data.analysis) setAnalysis(data.analysis);
      setPhase("analysis");
    } catch {
      setSavingMode("none");
      setSaveError("Nettverksfeil — prøv igjen.");
      setPhase("summary");
    }
  }

  const modalDescription =
    workout && isActive
      ? `Sett ${setNumber}/${workout.totalSets}`
      : phase === "idle"
        ? "5 sek forberedelse før hvert heng er alltid inkludert."
        : undefined;

  const summaryFooter =
    (phase === "summary" || phase === "saving") && workout ? (
      <div className="flex flex-col gap-2 px-4 py-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="h-9 flex-1 text-xs"
            disabled={phase === "saving"}
            onClick={resetAll}
          >
            Forkast
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 flex-1 gap-2 text-xs font-semibold"
            disabled={phase === "saving"}
            onClick={() => handleSave(false)}
          >
            {phase === "saving" && savingMode === "save" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Lagrer…
              </>
            ) : (
              "Lagre uten analyse"
            )}
          </Button>
        </div>
        <Button
          type="button"
          className="h-9 w-full gap-2 text-xs font-semibold"
          disabled={phase === "saving"}
          onClick={() => handleSave(true)}
        >
          {phase === "saving" && savingMode === "analyze" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Lagrer og analyserer…
            </>
          ) : (
            "Lagre og send til analyse"
          )}
        </Button>
      </div>
    ) : undefined;

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      closeOnBackdrop={!isActive && phase !== "saving"}
      showCloseButton={!isActive && phase !== "saving"}
      maxWidth="max-w-lg"
      aria-labelledby="max-hangs-title"
      title={
        <span id="max-hangs-title" className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          {MAX_HANGS_PROTOCOL}
        </span>
      }
      description={modalDescription}
      footer={summaryFooter}
    >
      <div className="space-y-4 px-4 py-4">
          {phase === "idle" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <ConfigField label="Sett">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={totalSetsInput}
                    onChange={(e) => setTotalSetsInput(e.target.value)}
                    className={inputClass}
                  />
                </ConfigField>
                <ConfigField label="Heng (sek)">
                  <input
                    type="number"
                    min={3}
                    max={120}
                    value={hangSecondsInput}
                    onChange={(e) => setHangSecondsInput(e.target.value)}
                    className={inputClass}
                  />
                </ConfigField>
                <ConfigField label="Hvile (min)">
                  <input
                    type="number"
                    min={0.5}
                    max={15}
                    step={0.5}
                    value={restMinutesInput}
                    onChange={(e) => setRestMinutesInput(e.target.value)}
                    className={inputClass}
                  />
                </ConfigField>
              </div>

              <ConfigField label="Grep">
                <div className="flex gap-2">
                  {HOLD_SIZE_OPTIONS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setHoldSize(size)}
                      className={cn(
                        "flex-1 rounded-md border py-2 text-xs font-semibold transition-all",
                        holdSize === size
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </ConfigField>

              <ConfigField label="Ekstra vekt (kg)">
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className={inputClass}
                />
              </ConfigField>

              <Button
                type="button"
                className="h-10 w-full gap-2 text-sm font-semibold"
                onClick={handleStartWorkout}
              >
                <Timer className="h-4 w-4" />
                Start økt
              </Button>
            </div>
          )}

          {isActive && workout && (
            <div className="flex flex-col items-center gap-4 py-2">
              <CircularTimer
                remaining={remaining}
                total={phaseDuration}
                phase={phase}
              />
              <p
                className={cn(
                  "text-center text-base font-bold uppercase tracking-wide",
                  phase === "hang" && "text-emerald-500",
                  phase === "rest" && "text-red-500",
                  phase === "prep" && "text-amber-500"
                )}
              >
                {phaseLabel(phase, workout.holdSize, setNumber, workout.totalSets)}
              </p>
              <p className="text-center text-[11px] text-muted-foreground">
                {workout.hangSeconds}s heng · {workout.restSeconds / 60} min hvile
              </p>
              {phase === "hang" && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full border-red-500/40 text-sm font-semibold text-red-500 hover:bg-red-500/10 hover:text-red-500"
                  onClick={handleFail}
                >
                  Fail (klarte ikke hele)
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="h-9 w-full gap-2 text-xs text-muted-foreground"
                onClick={handleAbort}
              >
                <Square className="h-3.5 w-3.5" />
                Avslutt økt
              </Button>
            </div>
          )}

          {(phase === "summary" || phase === "saving") && workout && (
            <div className="space-y-4">
              <p className="text-sm font-medium">
                {completedSets.length} av {workout.totalSets} sett logget
              </p>
              <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border bg-secondary/10 p-3 text-xs">
                {completedSets.map((s) => (
                  <li key={s.set_number} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">
                      Sett {s.set_number} · {s.hold_size}
                    </span>
                    <span className={s.is_failed ? "text-red-500" : "text-foreground"}>
                      {s.actual_time_seconds}s{s.is_failed ? " ✗" : " ✓"}
                    </span>
                  </li>
                ))}
              </ul>
              <ConfigField label="Anstrengelse (RPE 1–10)">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={perceivedEffort}
                  onChange={(e) => setPerceivedEffort(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <p className="text-center text-sm font-semibold text-primary">
                  {perceivedEffort}/10
                </p>
              </ConfigField>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notater…"
                rows={3}
                className="w-full resize-none rounded-lg border border-border/60 bg-secondary/15 px-2.5 py-2 text-xs outline-none focus-visible:border-ring"
              />
              {saveError && (
                <p className="text-xs text-destructive">{saveError}</p>
              )}
            </div>
          )}

          {phase === "analysis" && (
            <div className="space-y-4">
              {webhookError && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  {webhookError}
                </p>
              )}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  AI-trener
                </p>
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                  {analysis ?? "Ingen analyse mottatt."}
                </p>
              </div>
              <Button
                type="button"
                className="h-9 w-full text-xs font-semibold"
                onClick={() => {
                  resetAll();
                  onClose();
                }}
              >
                Lukk
              </Button>
            </div>
          )}
      </div>
    </AppModal>
  );
}

/** En knapp i høyre panel — åpner fullskjerms-popup for økten. */
export function MaxHangsStartButton({ onSessionSaved }: MaxHangsStartButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={KLATRING_PANEL_BUTTON_CLASS}
        onClick={() => setOpen(true)}
      >
        <Timer className="h-4 w-4" />
        Start Maksheng
      </Button>
      <MaxHangsModal
        open={open}
        onClose={() => setOpen(false)}
        onSessionSaved={() => {
          onSessionSaved?.();
        }}
      />
    </>
  );
}

/** @deprecated Bruk MaxHangsStartButton */
export function MaxHangsPlayer(props: MaxHangsStartButtonProps) {
  return <MaxHangsStartButton {...props} />;
}
