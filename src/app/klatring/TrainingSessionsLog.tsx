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
      <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
        <header className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-100">
            Strukturerte økter
          </h2>
        </header>

        {nextSuggestion && (
          <div className="border-b border-zinc-800 bg-violet-500/[0.06] px-4 py-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-violet-400/90">
              Forslag neste økt
            </p>
            <p className="text-xs leading-relaxed text-zinc-400">
              {nextSuggestion}
            </p>
          </div>
        )}

        <div>
          <div className="px-4 pb-1 pt-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Siste økter
            </span>
          </div>

          <div className="divide-y divide-zinc-800/70">
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
                    "hover:bg-zinc-800/40 focus-visible:bg-zinc-800/40 focus-visible:outline-none"
                  )}
                >
                  <div className="flex min-w-0 items-baseline gap-2.5">
                    <span className="shrink-0 font-semibold tabular-nums text-zinc-300">
                      {formatTrainingSessionDate(s)}
                    </span>
                    <span className="shrink-0 font-medium text-zinc-400">
                      {protocolLabel(s.protocol_type)}
                    </span>
                    {holdSize && (
                      <span className="shrink-0 text-zinc-600">{holdSize}</span>
                    )}
                    {userNote && (
                      <span className="truncate text-zinc-600">{userNote}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {hasMore && (
            <div className="border-t border-zinc-800/70 px-4 py-2">
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-full text-xs text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-300"
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
