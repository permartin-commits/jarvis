"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StartupRun {
  masterplanId: number;
  executionId: string;
  status: "Jobber" | "OK" | "Feil";
  logId?: number;
  startedAt: number;
}

interface PiaStartupLogRow {
  id: number;
  session_id: string | null;
  execution_id: string | null;
  tidspunkt: string;
  masterplan_id: number | null;
}

const STORAGE_KEY = "jarvis-prosjekter-startup-runs";
const POLL_MS = 3000;

function loadStored(): StartupRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StartupRun[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStored(runs: StartupRun[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs.slice(0, 40)));
  } catch {
    /* ignore */
  }
}

function statusClass(status: StartupRun["status"]): string {
  if (status === "OK") return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
  if (status === "Feil") return "text-red-400 border-red-500/30 bg-red-500/10";
  return "text-amber-400 border-amber-500/30 bg-amber-500/10";
}

export function ProsjekterStartupRuns() {
  const [runs, setRuns] = useState<StartupRun[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const syncRuns = useCallback((updater: (prev: StartupRun[]) => StartupRun[]) => {
    setRuns((prev) => {
      const next = updater(prev);
      saveStored(next);
      return next;
    });
  }, []);

  const pollLogs = useCallback(async () => {
    const res = await fetch("/api/pia-startup-log", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { rows: PiaStartupLogRow[] };
    const logs = data.rows ?? [];

    syncRuns((prev) => {
      const assignedLogIds = new Set(
        prev.filter((r) => r.logId != null).map((r) => r.logId!)
      );
      const available = logs
        .filter((log) => !assignedLogIds.has(log.id))
        .sort(
          (a, b) =>
            new Date(a.tidspunkt).getTime() - new Date(b.tidspunkt).getTime()
        );

      const next = prev.map((r) => ({ ...r }));
      const pending = next
        .filter((r) => r.status === "Jobber")
        .sort((a, b) => a.startedAt - b.startedAt);

      for (const run of pending) {
        const idx = available.findIndex((log) => {
          const t = new Date(log.tidspunkt).getTime();
          if (t < run.startedAt - 3000) return false;
          if (
            log.masterplan_id != null &&
            log.masterplan_id !== run.masterplanId
          ) {
            return false;
          }
          return true;
        });
        if (idx === -1) continue;
        const match = available.splice(idx, 1)[0];
        run.executionId = match.execution_id?.trim() || "—";
        run.status = "OK";
        run.logId = match.id;
      }

      return next;
    });
  }, [syncRuns]);

  useEffect(() => {
    setRuns(loadStored());
    setHydrated(true);
  }, []);

  const runsRef = useRef(runs);
  runsRef.current = runs;

  useEffect(() => {
    if (!hydrated) return;
    void pollLogs();
    const id = setInterval(() => {
      if (runsRef.current.some((r) => r.status === "Jobber")) {
        void pollLogs();
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [hydrated, pollLogs]);

  useEffect(() => {
    function onStarted(e: Event) {
      const detail = (e as CustomEvent<StartupRun>).detail;
      if (!detail?.masterplanId) return;
      syncRuns((prev) => [detail, ...prev.filter((r) => r.masterplanId !== detail.masterplanId)]);
    }
    function onFailed(e: Event) {
      const { masterplanId } = (e as CustomEvent<{ masterplanId: number }>).detail;
      syncRuns((prev) =>
        prev.map((r) =>
          r.masterplanId === masterplanId && r.status === "Jobber"
            ? { ...r, status: "Feil" as const, executionId: "feilet" }
            : r
        )
      );
    }

    window.addEventListener("prosjekter-startup", onStarted);
    window.addEventListener("prosjekter-startup-failed", onFailed);
    return () => {
      window.removeEventListener("prosjekter-startup", onStarted);
      window.removeEventListener("prosjekter-startup-failed", onFailed);
    };
  }, [syncRuns]);

  if (!hydrated) return null;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-card/80">
      <div className="border-b border-border bg-gradient-to-br from-amber-500/[0.06] via-card to-card px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 ring-1 ring-amber-500/25">
            <Rocket className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground">
              Night Shift
            </p>
            <p className="text-[10px] text-muted-foreground">
              {runs.length === 0 ? "Ingen kjøringer" : `${runs.length} kjøring${runs.length === 1 ? "" : "er"}`}
            </p>
          </div>
        </div>
      </div>

      {runs.length === 0 ? (
        <p className="px-3 py-6 text-center text-[11px] text-muted-foreground">
          Start et prosjekt for å se status her.
        </p>
      ) : (
        <ul className="divide-y divide-border/60 max-h-64 overflow-y-auto">
          {runs.map((run) => (
            <li key={`${run.masterplanId}-${run.startedAt}`} className="px-3 py-2.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-foreground">
                  ID {run.masterplanId}
                </span>
                <span
                  className={cn(
                    "rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                    statusClass(run.status)
                  )}
                >
                  {run.status}
                </span>
              </div>
              <div className="space-y-0.5 font-mono text-[10px] text-muted-foreground">
                <p>
                  <span className="text-muted-foreground/70">Execution ID </span>
                  <span className="tabular-nums text-foreground/90">
                    {run.executionId}
                  </span>
                </p>
              </div>
              {run.status === "Jobber" && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400/90">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Venter på Supabase…
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Kalles fra ProsjekterClient når «Start prosjekt» trykkes. */
export function dispatchStartupRun(masterplanId: number) {
  const detail: StartupRun = {
    masterplanId,
    executionId: "pågår",
    status: "Jobber",
    startedAt: Date.now(),
  };
  window.dispatchEvent(new CustomEvent("prosjekter-startup", { detail }));
}

export function dispatchStartupFailed(masterplanId: number) {
  window.dispatchEvent(
    new CustomEvent("prosjekter-startup-failed", { detail: { masterplanId } })
  );
}
