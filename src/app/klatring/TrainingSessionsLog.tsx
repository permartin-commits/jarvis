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

function protocolLabel(protocolType: string): string {
  const t = protocolType.toLowerCase();
  if (t.includes("repeater")) return "Program";
  if (t.includes("max hang") || t.includes("maxhang")) return "Maksheng";
  return protocolType;
}

/** Extract hold size like "20mm" from a config notes line. */
function extractHoldSize(configLine: string): string {
  const m = configLine.match(/\d+\s*mm/i);
  return m ? m[0].replace(/\s+/, "") : "";
}

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
        {/* Header */}
        <header className="border-b border-sidebar-border px-4 py-3">
          <h2 className="text-base font-semibold text-white">
            Strukturerte økter
          </h2>
        </header>

        {/* Next session suggestion */}
        {nextSuggestion && (
          <div className="border-b border-sidebar-border bg-card px-4 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Forslag neste økt
            </p>
            <p className="text-xs leading-relaxed text-card-foreground">
              {nextSuggestion}
            </p>
          </div>
        )}

        {/* Session list */}
        <div className="divide-y divide-sidebar-border/50">
          <div className="px-4 pb-1.5 pt-3">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white">
              Siste økter
            </span>
          </div>

          {visibleSessions.map((s) => {
            const notes = s.notes?.trim() ?? "";
            const newlineIdx = notes.indexOf("\n");
            const configLine =
              newlineIdx > -1 ? notes.slice(0, newlineIdx).trim() : "";
            const holdSize = extractHoldSize(configLine);
            const userNote =
              newlineIdx > -1 ? notes.slice(newlineIdx + 1).trim() : notes;

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
                <div className="flex items-baseline gap-2.5 min-w-0">
                  {/* Date — far left, white bold */}
                  <span className="shrink-0 font-bold text-white tabular-nums">
                    {formatTrainingSessionDate(s)}
                  </span>

                  {/* Protocol name */}
                  <span className="shrink-0 font-medium text-white/90">
                    {protocolLabel(s.protocol_type)}
                  </span>

                  {/* Hold size only (e.g. "20mm") */}
                  {holdSize && (
                    <span className="shrink-0 text-white/60">
                      {holdSize}
                    </span>
                  )}

                  {/* User note */}
                  {userNote && (
                    <span className="truncate text-white/45">
                      {userNote}
                    </span>
                  )}
                </div>

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
