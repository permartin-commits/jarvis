"use client";

import { useEffect, useState } from "react";
import {
  formatTrainingSessionDate,
  type TrainingSession,
} from "@/lib/training";
import { Button } from "@/components/ui/button";
import { TrainingSessionDetailModal } from "./TrainingSessionDetailModal";
import { cn } from "@/lib/utils";

const SESSIONS_PREVIEW_COUNT = 5;

export function TrainingSessionsLog({
  refreshKey = 0,
  onSessionUpdated,
}: {
  refreshKey?: number;
  onSessionUpdated?: () => void;
}) {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const reload = () => {
    fetch("/api/training-sessions")
      .then((r) => r.json())
      .then((d) => setSessions((d.sessions as TrainingSession[]) ?? []))
      .catch(() => setSessions([]));
  };

  useEffect(() => {
    reload();
  }, [refreshKey]);

  if (sessions.length === 0) return null;

  const visibleSessions = showAll
    ? sessions
    : sessions.slice(0, SESSIONS_PREVIEW_COUNT);
  const hasMore = sessions.length > SESSIONS_PREVIEW_COUNT;

  const nextSuggestion = sessions.find(
    (s) => s.next_session_suggestion?.trim()
  )?.next_session_suggestion;

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-sidebar-border bg-sidebar text-sidebar-foreground">
        <header className="border-b border-sidebar-border px-4 py-3">
          <h2 className="text-sm font-semibold text-sidebar-foreground">
            Strukturerte økter
          </h2>
          <p className="text-xs text-sidebar-foreground/50">
            Max Hangs og andre protokoller
          </p>
        </header>

        {nextSuggestion && (
          <div className="border-b border-sidebar-border bg-sidebar-accent/30 px-4 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Forslag neste økt
            </p>
            <p className="text-xs leading-relaxed text-sidebar-foreground/90">
              {nextSuggestion}
            </p>
          </div>
        )}

        <div className="divide-y divide-sidebar-border/50">
          <div className="px-4 pb-1.5 pt-3">
            <span className="text-[10px] font-medium uppercase tracking-wide text-sidebar-foreground/40">
              Siste økter
            </span>
          </div>
          {visibleSessions.map((s) => {
            const notes = s.notes?.trim() ?? "";
            const configEnd = notes.indexOf("\n");
            const userNote =
              configEnd > -1 ? notes.slice(configEnd + 1).trim() : "";

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedId(s.id)}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-xs transition-colors",
                  "hover:bg-sidebar-accent/40 focus-visible:bg-sidebar-accent/40 focus-visible:outline-none"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span className="shrink-0 font-medium text-sidebar-foreground">
                      {s.protocol_type}
                    </span>
                    {userNote && (
                      <span className="truncate text-[10px] text-sidebar-foreground/50">
                        {userNote}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 tabular-nums text-sidebar-foreground/55">
                    {formatTrainingSessionDate(s)}
                  </span>
                </div>
                {(s.perceived_effort != null || s.ai_session_analysis) && (
                  <p className="mt-0.5 text-[10px] text-sidebar-foreground/50">
                    {s.perceived_effort != null
                      ? `RPE ${s.perceived_effort}`
                      : ""}
                    {s.ai_session_analysis ? " · AI" : ""}
                  </p>
                )}
              </button>
            );
          })}
          {hasMore && (
            <div className="px-4 py-2">
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-full text-xs text-sidebar-foreground/50 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll
                  ? "Vis færre"
                  : `Vis mer (${sessions.length - SESSIONS_PREVIEW_COUNT} til)`}
              </Button>
            </div>
          )}
        </div>
      </section>

      {selectedId != null && (
        <TrainingSessionDetailModal
          sessionId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={() => {
            reload();
            onSessionUpdated?.();
          }}
        />
      )}
    </>
  );
}
