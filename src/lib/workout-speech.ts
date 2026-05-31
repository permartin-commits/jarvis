"use client";

import { useEffect, useRef } from "react";

/** Korte talemeldinger under Beastmaker-økter (Web Speech API). */

export type WorkoutSpeechCue = "GO" | "Rest";

/** Si «GO» så mange sekunder før heng-timeren starter (latency). */
export const WORKOUT_GO_LEAD_SECONDS = 1;

export function speakWorkoutCue(cue: WorkoutSpeechCue): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cue);
  utterance.lang = "en-US";
  utterance.rate = 1.15;
  utterance.pitch = 1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

export function cancelWorkoutSpeech(): void {
  if (typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
}

/**
 * «GO» ~1 s før heng (under prep / kort pause), «Rest» når hvile starter.
 * Krever at økten startes med klikk.
 */
export function useWorkoutSpeechCues(
  phase: string,
  remaining: number,
  enabled: boolean,
  restPhase: "rest" | "long_rest" = "rest"
): void {
  const prevPhaseRef = useRef<string | null>(null);
  const goSpokenRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      prevPhaseRef.current = null;
      goSpokenRef.current = false;
      cancelWorkoutSpeech();
      return;
    }

    const prev = prevPhaseRef.current;
    if (phase !== prev) {
      if (phase === "prep" || phase === "short_pause") {
        goSpokenRef.current = false;
      }
      if (phase === restPhase && prev !== restPhase) {
        speakWorkoutCue("Rest");
      }
      prevPhaseRef.current = phase;
    }

    const beforeHang = phase === "prep" || phase === "short_pause";
    if (
      beforeHang &&
      remaining === WORKOUT_GO_LEAD_SECONDS &&
      !goSpokenRef.current
    ) {
      speakWorkoutCue("GO");
      goSpokenRef.current = true;
    }
  }, [phase, remaining, enabled, restPhase]);
}
