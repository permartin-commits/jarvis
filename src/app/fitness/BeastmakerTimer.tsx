"use client";

import { useState, useEffect, useRef } from "react";
import { Timer, StopCircle, Save, X, Weight, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type Phase = "idle" | "countdown" | "running" | "form" | "saving";
type GripCm = 1 | 2 | 3;

function formatDuration(s: number): string {
  const abs = Math.abs(s);
  const m = Math.floor(abs / 60);
  const sec = abs % 60;
  const str = `${m}:${sec.toString().padStart(2, "0")}`;
  return s < 0 ? `-${str}` : str;
}

export function BeastmakerTimer({ onSessionSaved }: { onSessionSaved?: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [cm, setCm] = useState<GripCm | null>(null);
  const [medVekt, setMedVekt] = useState(false);
  const [ekstravekt, setEkstravekt] = useState("");
  const [kommentar, setKommentar] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
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
  }, [phase]);

  function handleStart() {
    setElapsed(-2);
    setStartTime(null);
    setPhase("countdown");
  }

  function handleStop() {
    setPhase("form");
  }

  function handleCancel() {
    setCm(null);
    setMedVekt(false);
    setEkstravekt("");
    setKommentar("");
    setElapsed(0);
    setStartTime(null);
    setSaveError(null);
    setPhase("idle");
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
      handleCancel();
      onSessionSaved?.();
    } catch {
      setSaveError("Kunne ikke lagre. Prøv igjen.");
      setPhase("form");
    }
  }

  const isCountdown = phase === "countdown" || (phase === "running" && elapsed < 0);
  const isActive = phase === "countdown" || phase === "running";

  return (
    <div className="w-full rounded-xl border border-border bg-card/80 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Beastmaker
        </p>
        {isActive && (
          <span className="text-[10px] font-mono text-primary animate-pulse tabular-nums">
            {isCountdown ? elapsed : formatDuration(elapsed)}
          </span>
        )}
      </div>

      {phase === "idle" && (
        <div className="flex flex-col items-center gap-2 py-1">
          <p className="text-2xl font-mono font-bold tabular-nums text-foreground/25">0:00</p>
          <button
            type="button"
            onClick={handleStart}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            <Timer className="h-3.5 w-3.5" />
            Start økt
          </button>
        </div>
      )}

      {isActive && (
        <div className="flex flex-col items-center gap-2 py-1">
          <p
            className={cn(
              "text-3xl font-mono font-bold tabular-nums",
              isCountdown ? "text-orange-400 animate-pulse" : "text-primary animate-pulse"
            )}
          >
            {isCountdown ? elapsed : formatDuration(elapsed)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {isCountdown ? "Gjør deg klar…" : "Henger nå…"}
          </p>
          <button
            type="button"
            onClick={handleStop}
            disabled={isCountdown}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-full border py-2 text-xs font-semibold transition-all",
              isCountdown
                ? "cursor-not-allowed border-border/30 text-muted-foreground/30"
                : "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-[0.98]"
            )}
          >
            <StopCircle className="h-3.5 w-3.5" />
            Stopp
          </button>
        </div>
      )}

      {(phase === "form" || phase === "saving") && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <Timer className="h-3 w-3 text-primary/70 shrink-0" />
            <span className="text-[10px] text-muted-foreground">Varighet</span>
            <span className="ml-auto text-xs font-bold tabular-nums text-primary">
              {formatDuration(Math.max(0, elapsed))}
            </span>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Grep
            </p>
            <div className="flex gap-1.5">
              {([1, 2, 3] as GripCm[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setCm(s)}
                  className={cn(
                    "flex-1 rounded-md border py-1.5 text-xs font-semibold transition-all",
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
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Weight className="h-3 w-3" />
              Vekt
            </p>
            <div className="flex gap-1.5">
              {[false, true].map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setMedVekt(val)}
                  className={cn(
                    "flex-1 rounded-md border py-1.5 text-[11px] font-semibold transition-all",
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
              <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/20 px-2.5 py-1.5">
                <input
                  type="number"
                  value={ekstravekt}
                  onChange={(e) => setEkstravekt(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.5"
                  className="w-14 bg-transparent text-xs font-semibold text-foreground outline-none tabular-nums"
                />
                <span className="text-[10px] text-muted-foreground">kg</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Kommentar
            </p>
            <textarea
              value={kommentar}
              onChange={(e) => setKommentar(e.target.value)}
              placeholder="Valgfritt…"
              rows={2}
              className="w-full resize-none rounded-md border border-border bg-secondary/20 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/40"
            />
          </div>

          {saveError && <p className="text-[10px] text-red-400">{saveError}</p>}

          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleCancel}
              disabled={phase === "saving"}
              className="flex items-center justify-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!cm || phase === "saving"}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-semibold transition-all",
                !cm
                  ? "cursor-not-allowed bg-primary/20 text-primary/40"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Save className="h-3 w-3" />
              {phase === "saving" ? "Lagrer…" : "Lagre"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}