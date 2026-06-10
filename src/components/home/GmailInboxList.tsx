"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GmailMessage, GmailMessageDetail } from "@/lib/google-api";
import { PiaDarkModal } from "@/components/PiaDarkModal";

function formatEmailTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) {
    return date.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
  }
  if (date >= startOfYesterday) return "I går";
  return date.toLocaleDateString("nb-NO", { day: "2-digit", month: "short" });
}

function formatFullTime(iso: string) {
  return new Date(iso).toLocaleString("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Oslo",
  });
}

export function GmailInboxList({ messages }: { messages: GmailMessage[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<GmailMessageDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openEmail(id: string) {
    setSelectedId(id);
    setDetail(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/google/gmail/${id}`);
      const data = (await res.json()) as { message?: GmailMessageDetail; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Kunne ikke hente e-post");
        return;
      }
      setDetail(data.message ?? null);
    } catch {
      setError("Kunne ikke hente e-post");
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setSelectedId(null);
    setDetail(null);
    setError(null);
  }

  return (
    <>
      <div className="max-h-[420px] overflow-y-auto">
        {messages.map((email) => (
          <button
            key={email.id}
            type="button"
            onClick={() => void openEmail(email.id)}
            className={cn(
              "grid w-full grid-cols-[minmax(0,1fr)_52px] gap-2 border-b border-zinc-800/60 px-3 py-2.5 text-left last:border-0 transition-colors hover:bg-zinc-800/40",
              !email.isUnread && "opacity-80"
            )}
          >
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1.5">
                {email.isUnread && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" aria-hidden />
                )}
                <p
                  className={cn(
                    "truncate text-xs",
                    email.isUnread ? "font-bold text-zinc-100" : "text-zinc-500"
                  )}
                >
                  {email.sender}
                </p>
              </div>
              <p
                className={cn(
                  "mt-0.5 truncate text-[11px]",
                  email.isUnread ? "font-medium text-zinc-200/90" : "text-zinc-600"
                )}
              >
                {email.subject}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 text-right text-[10px] tabular-nums",
                email.isUnread ? "font-semibold text-zinc-400" : "text-zinc-600"
              )}
            >
              {formatEmailTime(email.time)}
            </span>
          </button>
        ))}
      </div>

      <PiaDarkModal
        open={selectedId !== null}
        onClose={closeModal}
        maxWidth="max-w-2xl"
        title={detail?.subject ?? "E-post"}
        subtitle={detail ? `${detail.sender}${detail.fromEmail ? ` · ${detail.fromEmail}` : ""}` : undefined}
        badge={
          detail?.isUnread ? (
            <span className="inline-flex rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-300">
              Ulest
            </span>
          ) : undefined
        }
      >
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Henter e-post…
          </div>
        )}
        {error && (
          <p className="py-8 text-center text-sm text-rose-300">{error}</p>
        )}
        {detail && !loading && (
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-500 space-y-1">
              {detail.to && <p><span className="text-zinc-600">Til:</span> {detail.to}</p>}
              <p><span className="text-zinc-600">Dato:</span> {formatFullTime(detail.time)}</p>
            </div>
            {detail.bodyHtml ? (
              <div
                className="prose prose-invert prose-sm max-w-none text-zinc-300 [&_a]:text-violet-300"
                dangerouslySetInnerHTML={{ __html: detail.bodyHtml }}
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300 font-sans">
                {detail.bodyText ?? "(Ingen innhold)"}
              </pre>
            )}
          </div>
        )}
      </PiaDarkModal>
    </>
  );
}
