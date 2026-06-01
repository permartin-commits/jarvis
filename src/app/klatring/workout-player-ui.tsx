"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTimerSeconds } from "@/lib/training";

export const WORKOUT_INPUT_CLASS =
  "h-9 w-full rounded-lg border border-border/60 bg-secondary/20 px-2.5 text-sm font-semibold tabular-nums text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type TimerVisualPhase = "prep" | "hang" | "short_pause" | "long_rest" | "rest";

const TIMER_STYLES: Record<
  TimerVisualPhase,
  { ring: string; bg: string }
> = {
  prep: {
    ring: "text-slate-400",
    bg: "from-slate-500/20 to-slate-500/5",
  },
  hang: {
    ring: "text-emerald-500",
    bg: "from-emerald-500/20 to-emerald-500/5",
  },
  short_pause: {
    ring: "text-amber-500",
    bg: "from-amber-500/20 to-amber-500/5",
  },
  long_rest: {
    ring: "text-red-500",
    bg: "from-red-500/20 to-red-500/5",
  },
  rest: {
    ring: "text-red-500",
    bg: "from-red-500/20 to-red-500/5",
  },
};

export function WorkoutConfigField({
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

export function WorkoutCircularTimer({
  remaining,
  total,
  phase,
}: {
  remaining: number;
  total: number;
  phase: TimerVisualPhase;
}) {
  const progress = total > 0 ? remaining / total : 0;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference * (1 - progress);
  const style = TIMER_STYLES[phase];

  return (
    <div
      className={cn(
        "relative mx-auto flex h-48 w-48 max-w-[min(72vw,12rem)] items-center justify-center rounded-full bg-gradient-to-b sm:h-52 sm:w-52",
        style.bg
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
            style.ring
          )}
        />
      </svg>
      <span
        className={cn(
          "relative z-10 font-mono text-4xl font-bold tabular-nums sm:text-5xl",
          style.ring
        )}
      >
        {formatTimerSeconds(remaining)}
      </span>
    </div>
  );
}

export function WorkoutSummaryFooter({
  saving,
  savingMode,
  onDiscard,
  onSaveOnly,
  onSaveAndAnalyze,
}: {
  saving: boolean;
  savingMode: "none" | "save" | "analyze";
  onDiscard: () => void;
  onSaveOnly: () => void;
  onSaveAndAnalyze: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-9 flex-1 text-xs"
          disabled={saving}
          onClick={onDiscard}
        >
          Forkast
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-9 flex-1 gap-2 text-xs font-semibold"
          disabled={saving}
          onClick={onSaveOnly}
        >
          {saving && savingMode === "save" ? (
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
        disabled={saving}
        onClick={onSaveAndAnalyze}
      >
        {saving && savingMode === "analyze" ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Lagrer og analyserer…
          </>
        ) : (
          "Lagre og send til analyse"
        )}
      </Button>
    </div>
  );
}

export async function submitTrainingSession(
  payload: {
    protocol_type: string;
    perceived_effort: number;
    notes: string;
    is_completed: boolean;
    hang_logs: import("@/lib/training").HangLogDraft[];
  },
  options: { run_webhook: boolean }
): Promise<{
  ok: boolean;
  error?: string;
  webhook_ok?: boolean | null;
  webhook_error?: string | null;
  analysis?: string | null;
  next_session_suggestion?: string | null;
}> {
  const res = await fetch("/api/training-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      protocol_type: payload.protocol_type,
      perceived_effort: payload.perceived_effort,
      notes: payload.notes.trim() || null,
      is_completed: payload.is_completed,
      hang_logs: payload.hang_logs,
      run_webhook: options.run_webhook,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { ok: false, error: data.error ?? "Lagring feilet." };
  }
  return {
    ok: true,
    webhook_ok: data.webhook_ok,
    webhook_error: data.webhook_error,
    analysis: data.analysis,
    next_session_suggestion: data.next_session_suggestion,
  };
}

export function WorkoutAnalysisView({
  webhookError,
  analysis,
  onClose,
}: {
  webhookError: string | null;
  analysis: string | null;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4 px-4 py-4">
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
        onClick={onClose}
      >
        Lukk
      </Button>
    </div>
  );
}
