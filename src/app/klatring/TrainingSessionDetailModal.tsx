"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Sparkles, Timer } from "lucide-react";
import { AppModal } from "@/components/AppModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatTrainingSessionDate,
  type HangLog,
  type TrainingSession,
} from "@/lib/training";

interface TrainingSessionDetailModalProps {
  sessionId: number;
  onClose: () => void;
  onUpdated?: () => void;
}

export function TrainingSessionDetailModal({
  sessionId,
  onClose,
  onUpdated,
}: TrainingSessionDetailModalProps) {
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [hangLogs, setHangLogs] = useState<HangLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/training-sessions/${sessionId}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Kunne ikke hente økt");
      setSession(d.session as TrainingSession);
      setHangLogs((d.hang_logs as HangLog[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Feil ved lasting");
      setSession(null);
      setHangLogs([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  async function handleSendToAnalysis() {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch(
        `/api/training-sessions/${sessionId}/analyze`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) {
        setAnalyzeError(
          data.webhook_error ?? data.error ?? "Kunne ikke sende til analyse."
        );
        return;
      }
      setSession(data.session as TrainingSession);
      onUpdated?.();
      onClose();
    } catch {
      setAnalyzeError("Nettverksfeil — prøv igjen.");
    } finally {
      setAnalyzing(false);
    }
  }

  const title = session?.protocol_type ?? "Treningsøkt";
  const hasMultiRep = hangLogs.some(
    (h, _, arr) =>
      arr.filter((x) => x.set_number === h.set_number).length > 1 ||
      h.rep_number > 1
  );

  return (
    <AppModal
      open
      onClose={onClose}
      closeOnBackdrop={!analyzing}
      showCloseButton={!analyzing}
      maxWidth="max-w-lg"
      aria-labelledby="training-session-detail-title"
      title={
        <span id="training-session-detail-title" className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          {title}
        </span>
      }
      description={
        session
          ? `${formatTrainingSessionDate(session)} · ${session.is_completed ? "Fullført" : "Avbrutt"}${session.perceived_effort != null ? ` · RPE ${session.perceived_effort}` : ""}`
          : undefined
      }
      footer={
        <div className="flex flex-col gap-2 px-4 py-4">
          <Button
            type="button"
            className="h-9 w-full gap-2 text-xs font-semibold"
            disabled={loading || analyzing || !!error}
            onClick={handleSendToAnalysis}
          >
            {analyzing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sender til analyse…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Send til analyse
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full text-xs"
            disabled={analyzing}
            onClick={onClose}
          >
            Lukk
          </Button>
        </div>
      }
    >
      <div className="space-y-4 px-4 py-4">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Laster…
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        {analyzeError && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            {analyzeError}
          </p>
        )}

        {session && !loading && (
          <>
            {session.notes && (
              <div className="rounded-lg border border-border bg-secondary/10 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Notater
                </p>
                <p className="whitespace-pre-wrap text-xs text-foreground">
                  {session.notes}
                </p>
              </div>
            )}

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-primary">
                AI-trener · øktanalyse
              </p>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                {session.ai_session_analysis?.trim() ||
                  "Ingen analyse lagret for denne økten."}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-secondary/10 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Forslag neste økt
              </p>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                {session.next_session_suggestion?.trim() ||
                  "Ingen forslag lagret ennå."}
              </p>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Heng ({hangLogs.length})
              </p>
              <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border bg-secondary/10 p-3 text-xs">
                {hangLogs.map((log) => (
                  <li
                    key={log.id}
                    className="flex justify-between gap-2"
                  >
                    <span className="text-muted-foreground">
                      S{log.set_number}
                      {hasMultiRep ? ` R${log.rep_number}` : ""} · {log.hold_size}
                      {log.weight_added > 0 ? ` +${log.weight_added} kg` : ""}
                    </span>
                    <span
                      className={cn(
                        log.is_failed ? "text-red-500" : "text-foreground"
                      )}
                    >
                      {log.actual_time_seconds}s
                      {log.is_failed ? " ✗" : " ✓"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </AppModal>
  );
}
