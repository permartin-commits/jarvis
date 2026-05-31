"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Repeat, Square } from "lucide-react";
import { AppModal } from "@/components/AppModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DEFAULT_REPEATERS_HOLD,
  DEFAULT_REPEATERS_SETS,
  REPEATERS_HANG_SECONDS,
  REPEATERS_LONG_REST_SECONDS,
  REPEATERS_PREP_SECONDS,
  REPEATERS_PROTOCOL,
  REPEATERS_REPS_PER_SET,
  REPEATERS_SHORT_PAUSE_SECONDS,
  clampRepeatersConfig,
  repeatersPhaseLabel,
  type HangLogDraft,
  type RepeatersTimerPhase,
  type RepeatersWorkoutConfig,
} from "@/lib/training";
import { cancelWorkoutSpeech, useWorkoutSpeechCues } from "@/lib/workout-speech";
import {
  WORKOUT_INPUT_CLASS,
  WorkoutAnalysisView,
  WorkoutCircularTimer,
  WorkoutConfigField,
  WorkoutSummaryFooter,
  submitTrainingSession,
  type TimerVisualPhase,
} from "./workout-player-ui";
import { KLATRING_PANEL_BUTTON_CLASS } from "./klatring-panel-buttons";

type RepeatersPhase =
  | "idle"
  | RepeatersTimerPhase
  | "summary"
  | "saving"
  | "analysis";

interface RepeatersStartButtonProps {
  onSessionSaved?: () => void;
}

function timerPhaseFor(phase: RepeatersPhase): TimerVisualPhase {
  if (
    phase === "prep" ||
    phase === "hang" ||
    phase === "short_pause" ||
    phase === "long_rest"
  ) {
    return phase;
  }
  return "prep";
}

function RepeatersModal({
  open,
  onClose,
  onSessionSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSessionSaved?: () => void;
}) {
  const [phase, setPhase] = useState<RepeatersPhase>("idle");
  const [setNumber, setSetNumber] = useState(1);
  const [repNumber, setRepNumber] = useState(1);
  const [remaining, setRemaining] = useState(0);
  const [workout, setWorkout] = useState<RepeatersWorkoutConfig | null>(null);

  const [totalSetsInput, setTotalSetsInput] = useState(String(DEFAULT_REPEATERS_SETS));
  const [repsPerSetInput, setRepsPerSetInput] = useState(String(REPEATERS_REPS_PER_SET));
  const [hangSecondsInput, setHangSecondsInput] = useState(String(REPEATERS_HANG_SECONDS));
  const [shortPauseInput, setShortPauseInput] = useState(
    String(REPEATERS_SHORT_PAUSE_SECONDS)
  );
  const [longRestMinutesInput, setLongRestMinutesInput] = useState(
    String(REPEATERS_LONG_REST_SECONDS / 60)
  );
  const [holdSize, setHoldSize] = useState(DEFAULT_REPEATERS_HOLD);
  const [weightKg, setWeightKg] = useState("0");

  const [completedReps, setCompletedReps] = useState<HangLogDraft[]>([]);
  const [perceivedEffort, setPerceivedEffort] = useState(7);
  const [notes, setNotes] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const transitioningRef = useRef(false);

  const repsPerSet = workout?.repsPerSet ?? REPEATERS_REPS_PER_SET;
  const hangSeconds = workout?.hangSeconds ?? REPEATERS_HANG_SECONDS;
  const shortPauseSeconds =
    workout?.shortPauseSeconds ?? REPEATERS_SHORT_PAUSE_SECONDS;
  const longRestSeconds = workout?.longRestSeconds ?? REPEATERS_LONG_REST_SECONDS;

  const isTimerPhase = (
    p: RepeatersPhase
  ): p is RepeatersTimerPhase =>
    p === "prep" || p === "hang" || p === "short_pause" || p === "long_rest";

  const isActive = isTimerPhase(phase);

  useWorkoutSpeechCues(phase, remaining, open && isActive, "long_rest");

  const phaseDuration = isTimerPhase(phase)
    ? phase === "prep"
      ? REPEATERS_PREP_SECONDS
      : phase === "hang"
        ? hangSeconds
        : phase === "short_pause"
          ? shortPauseSeconds
          : longRestSeconds
    : 0;

  const resetAll = useCallback(() => {
    setPhase("idle");
    setSetNumber(1);
    setRepNumber(1);
    setRemaining(0);
    setWorkout(null);
    setCompletedReps([]);
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

  const appendRep = useCallback(
    (
      setNum: number,
      repNum: number,
      actualSeconds: number,
      failed: boolean
    ) => {
      if (!workout) return;
      setCompletedReps((prev) => [
        ...prev,
        {
          set_number: setNum,
          rep_number: repNum,
          hold_size: workout.holdSize,
          weight_added: workout.weight,
          target_time_seconds: workout.hangSeconds,
          actual_time_seconds: failed
            ? Math.min(
                workout.hangSeconds,
                Math.max(0, Math.round(actualSeconds))
              )
            : workout.hangSeconds,
          is_failed: failed,
        },
      ]);
    },
    [workout]
  );

  const goToSummary = useCallback(() => {
    setPhase("summary");
    setRemaining(0);
    transitioningRef.current = false;
  }, []);

  const goToLongRest = useCallback(() => {
    transitioningRef.current = true;
    setRemaining(longRestSeconds);
    setPhase("long_rest");
    setTimeout(() => {
      transitioningRef.current = false;
    }, 50);
  }, [longRestSeconds]);

  const failRemainingRepsInSet = useCallback(
    (fromRep: number) => {
      if (!workout) return;
      for (let r = fromRep; r <= workout.repsPerSet; r++) {
        appendRep(setNumber, r, 0, true);
      }
    },
    [appendRep, setNumber, workout]
  );

  useEffect(() => {
    if (!open) return;
    if (phase === "prep") setRemaining(REPEATERS_PREP_SECONDS);
    else if (phase === "hang") setRemaining(hangSeconds);
    else if (phase === "short_pause") setRemaining(shortPauseSeconds);
    else if (phase === "long_rest") setRemaining(longRestSeconds);
  }, [open, phase, setNumber, repNumber, hangSeconds, shortPauseSeconds, longRestSeconds]);

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
      appendRep(setNumber, repNumber, hangSeconds, false);
      if (repNumber >= repsPerSet) {
        goToLongRest();
      } else {
        setRemaining(shortPauseSeconds);
        setPhase("short_pause");
        transitioningRef.current = false;
      }
      return;
    }

    if (phase === "short_pause") {
      setRepNumber((n) => n + 1);
      setRemaining(hangSeconds);
      setPhase("hang");
      transitioningRef.current = false;
      return;
    }

    if (phase === "long_rest") {
      if (setNumber >= workout.totalSets) {
        goToSummary();
      } else {
        setSetNumber((n) => n + 1);
        setRepNumber(1);
        setRemaining(REPEATERS_PREP_SECONDS);
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
    repNumber,
    appendRep,
    goToSummary,
    goToLongRest,
    workout,
    hangSeconds,
    shortPauseSeconds,
    repsPerSet,
  ]);

  function handleStartWorkout() {
    const clamped = clampRepeatersConfig({
      totalSets: Number(totalSetsInput),
      repsPerSet: Number(repsPerSetInput),
      hangSeconds: Number(hangSecondsInput),
      shortPauseSeconds: Number(shortPauseInput),
      longRestMinutes: Number(longRestMinutesInput),
    });

    setWorkout({
      ...clamped,
      holdSize: holdSize.trim() || DEFAULT_REPEATERS_HOLD,
      weight: Math.max(0, Number(weightKg) || 0),
    });
    setCompletedReps([]);
    setSetNumber(1);
    setRepNumber(1);
    setAnalysis(null);
    setWebhookError(null);
    setSaveError(null);
    transitioningRef.current = false;
    setRemaining(REPEATERS_PREP_SECONDS);
    setPhase("prep");
  }

  function handleFailSet() {
    if (!workout || (phase !== "hang" && phase !== "short_pause")) return;

    if (phase === "hang") {
      const actual = hangSeconds - remaining;
      appendRep(setNumber, repNumber, actual, true);
      failRemainingRepsInSet(repNumber + 1);
    } else {
      failRemainingRepsInSet(repNumber + 1);
    }
    goToLongRest();
  }

  function handleAbort() {
    if (isActive) goToSummary();
    else handleClose();
  }

  async function handleSave() {
    if (!workout || completedReps.length === 0) {
      setSaveError("Ingen reps å lagre.");
      return;
    }
    setPhase("saving");
    setSaveError(null);
    setWebhookError(null);
    setAnalysis(null);

    const setsLogged = new Set(completedReps.map((r) => r.set_number)).size;
    const failedReps = completedReps.filter((r) => r.is_failed).length;
    const configNote = `${REPEATERS_PROTOCOL}: ${workout.totalSets} sett × ${workout.repsPerSet} reps (${workout.hangSeconds}s heng / ${workout.shortPauseSeconds}s pause / ${workout.longRestSeconds / 60} min hvile) · ${workout.holdSize}${workout.weight > 0 ? ` +${workout.weight} kg` : ""} · ${setsLogged} sett logget · ${failedReps} feilede reps`;
    const fullNotes = [configNote, notes.trim()].filter(Boolean).join("\n");

    const result = await submitTrainingSession({
      protocol_type: REPEATERS_PROTOCOL,
      perceived_effort: perceivedEffort,
      notes: fullNotes,
      is_completed: setsLogged >= workout.totalSets,
      hang_logs: completedReps,
    });

    if (!result.ok) {
      setSaveError(result.error ?? "Lagring feilet.");
      setPhase("summary");
      return;
    }
    if (!result.webhook_ok) {
      setWebhookError(
        result.webhook_error ?? "Økt lagret, men AI-analyse (n8n) feilet."
      );
    }
    if (result.analysis) setAnalysis(result.analysis);
    setPhase("analysis");
    onSessionSaved?.();
  }

  const inWorkLoop = phase === "hang" || phase === "short_pause";
  const setsLogged = new Set(completedReps.map((r) => r.set_number)).size;
  const failedReps = completedReps.filter((r) => r.is_failed).length;

  const modalDescription =
    workout && isActive
      ? `Sett ${setNumber}/${workout.totalSets} · Rep ${repNumber}/${workout.repsPerSet}`
      : phase === "idle"
        ? "5 sek «gjør deg klar» før første heng og før hvert nytt sett."
        : undefined;

  const summaryFooter =
    (phase === "summary" || phase === "saving") && workout ? (
      <WorkoutSummaryFooter
        saving={phase === "saving"}
        onDiscard={resetAll}
        onSave={handleSave}
      />
    ) : undefined;

  const phaseTextClass =
    phase === "hang"
      ? "text-emerald-500"
      : phase === "short_pause"
        ? "text-amber-500"
        : phase === "long_rest"
          ? "text-red-500"
          : phase === "prep"
            ? "text-slate-400"
            : "";

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      closeOnBackdrop={!isActive && phase !== "saving"}
      showCloseButton={!isActive && phase !== "saving"}
      maxWidth="max-w-lg"
      aria-labelledby="repeaters-title"
      title={
        <span id="repeaters-title" className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-primary" />
          Repeaters (Styrkeutholdenhet)
        </span>
      }
      description={modalDescription}
      footer={summaryFooter}
    >
      <div className="space-y-4 px-4 py-4">
        {phase === "idle" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <WorkoutConfigField label="Sett">
                <input
                  type="number"
                  min={3}
                  max={6}
                  value={totalSetsInput}
                  onChange={(e) => setTotalSetsInput(e.target.value)}
                  className={WORKOUT_INPUT_CLASS}
                />
              </WorkoutConfigField>
              <WorkoutConfigField label="Reps">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={repsPerSetInput}
                  onChange={(e) => setRepsPerSetInput(e.target.value)}
                  className={WORKOUT_INPUT_CLASS}
                />
              </WorkoutConfigField>
              <WorkoutConfigField label="Heng (sek)">
                <input
                  type="number"
                  min={3}
                  max={60}
                  value={hangSecondsInput}
                  onChange={(e) => setHangSecondsInput(e.target.value)}
                  className={WORKOUT_INPUT_CLASS}
                />
              </WorkoutConfigField>
              <WorkoutConfigField label="Pause (sek)">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={shortPauseInput}
                  onChange={(e) => setShortPauseInput(e.target.value)}
                  className={WORKOUT_INPUT_CLASS}
                />
              </WorkoutConfigField>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <WorkoutConfigField label="Lang hvile (min)">
                <input
                  type="number"
                  min={1}
                  max={10}
                  step={0.5}
                  value={longRestMinutesInput}
                  onChange={(e) => setLongRestMinutesInput(e.target.value)}
                  className={WORKOUT_INPUT_CLASS}
                />
              </WorkoutConfigField>
              <WorkoutConfigField label="Ekstra vekt (kg)">
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className={WORKOUT_INPUT_CLASS}
                />
              </WorkoutConfigField>
            </div>

            <WorkoutConfigField label="Grep">
              <input
                type="text"
                value={holdSize}
                onChange={(e) => setHoldSize(e.target.value)}
                placeholder={DEFAULT_REPEATERS_HOLD}
                className={WORKOUT_INPUT_CLASS}
              />
            </WorkoutConfigField>

            <Button
              type="button"
              className="h-10 w-full gap-2 text-sm font-semibold"
              onClick={handleStartWorkout}
            >
              <Repeat className="h-4 w-4" />
              Start Repeaters
            </Button>
          </div>
        )}

        {isActive && workout && (
          <div className="flex flex-col items-center gap-4 py-2">
            <WorkoutCircularTimer
              remaining={remaining}
              total={phaseDuration}
              phase={timerPhaseFor(phase)}
            />
            <p
              className={cn(
                "text-center text-2xl font-black uppercase tracking-wider sm:text-3xl",
                phaseTextClass
              )}
            >
              {repeatersPhaseLabel(
                phase,
                workout.holdSize,
                setNumber,
                repNumber,
                workout.totalSets,
                workout.repsPerSet
              )}
            </p>
            {inWorkLoop && (
              <p className="text-center text-[11px] text-muted-foreground">
                Rep {repNumber}/{workout.repsPerSet} · {workout.hangSeconds}s heng /{" "}
                {workout.shortPauseSeconds}s pause
              </p>
            )}
            {inWorkLoop && (
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full border-red-500/40 text-sm font-semibold text-red-500 hover:bg-red-500/10 hover:text-red-500"
                onClick={handleFailSet}
              >
                Fail sett
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
              {setsLogged} av {workout.totalSets} sett · {completedReps.length}{" "}
              reps logget
              {failedReps > 0 && (
                <span className="text-red-500"> · {failedReps} feilet</span>
              )}
            </p>
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border bg-secondary/10 p-3 text-xs">
              {completedReps.map((r) => (
                <li
                  key={`${r.set_number}-${r.rep_number}`}
                  className="flex justify-between gap-2"
                >
                  <span className="text-muted-foreground">
                    S{r.set_number} R{r.rep_number}
                  </span>
                  <span className={r.is_failed ? "text-red-500" : "text-foreground"}>
                    {r.actual_time_seconds}s{r.is_failed ? " ✗" : " ✓"}
                  </span>
                </li>
              ))}
            </ul>
            <WorkoutConfigField label="Anstrengelse (RPE 1–10)">
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
            </WorkoutConfigField>
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
          <WorkoutAnalysisView
            webhookError={webhookError}
            analysis={analysis}
            onClose={() => {
              resetAll();
              onClose();
            }}
          />
        )}
      </div>
    </AppModal>
  );
}

export function RepeatersStartButton({ onSessionSaved }: RepeatersStartButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        className={KLATRING_PANEL_BUTTON_CLASS}
        onClick={() => setOpen(true)}
      >
        <Repeat className="h-4 w-4" />
        Start Repeaters
      </Button>
      <RepeatersModal
        open={open}
        onClose={() => setOpen(false)}
        onSessionSaved={onSessionSaved}
      />
    </>
  );
}
