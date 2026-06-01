"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  useEffect(() => {
    fetch("/api/training-sessions")
      .then((r) => r.json())
      .then((d) => setSessions((d.sessions as TrainingSession[]) ?? []))
      .catch(() => setSessions([]));
  }, [refreshKey]);

  if (sessions.length === 0) return null;

  const visibleSessions = showAll
    ? sessions
    : sessions.slice(0, SESSIONS_PREVIEW_COUNT);
  const hasMore = sessions.length > SESSIONS_PREVIEW_COUNT;

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-border">
        <header className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Strukturerte økter
          </h2>
          <p className="text-xs text-muted-foreground">
            Max Hangs og andre protokoller
          </p>
        </header>
        <Card className="rounded-none border-0 bg-card">
          <CardHeader className="px-4 pb-2 pt-3">
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Siste økter
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/60 p-0">
            {visibleSessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedId(s.id)}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-xs transition-colors",
                  "hover:bg-secondary/30 focus-visible:bg-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">
                    {s.protocol_type}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatTrainingSessionDate(s)}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {s.is_completed ? "Fullført" : "Avbrutt"}
                  {s.perceived_effort != null ? ` · RPE ${s.perceived_effort}` : ""}
                  {s.ai_session_analysis ? " · AI" : ""}
                </p>
              </button>
            ))}
            {hasMore && (
              <div className="border-t border-border/60 px-4 py-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-full text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAll((v) => !v)}
                >
                  {showAll
                    ? "Vis færre"
                    : `Vis mer (${sessions.length - SESSIONS_PREVIEW_COUNT} til)`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {selectedId != null && (
        <TrainingSessionDetailModal
          sessionId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={() => {
            fetch("/api/training-sessions")
              .then((r) => r.json())
              .then((d) => setSessions((d.sessions as TrainingSession[]) ?? []))
              .catch(() => {});
            onSessionUpdated?.();
          }}
        />
      )}
    </>
  );
}
