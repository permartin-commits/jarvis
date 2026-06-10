"use client";

import { useState } from "react";
import { ExternalLink, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent, CalendarEventDetail } from "@/lib/google-api";
import { PiaDarkModal } from "@/components/PiaDarkModal";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Oslo",
  });
}

function formatDayHeader(event: CalendarEvent) {
  if (event.isToday) return "I dag";
  if (event.isTomorrow) return "I morgen";
  return new Date(event.startTime).toLocaleDateString("nb-NO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Oslo",
  });
}

function formatFullRange(start: string, end: string, isAllDay: boolean) {
  if (isAllDay) {
    return new Date(start).toLocaleDateString("nb-NO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Oslo",
    });
  }
  const startStr = new Date(start).toLocaleString("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Oslo",
  });
  return `${startStr} – ${formatTime(end)}`;
}

function groupByDay(events: CalendarEvent[]) {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const list = map.get(ev.date) ?? [];
    list.push(ev);
    map.set(ev.date, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, items]) => ({
      day,
      items: items.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
    }));
}

export function CalendarAgendaList({
  events,
  monthLabel,
}: {
  events: CalendarEvent[];
  monthLabel: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CalendarEventDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = groupByDay(events);

  async function openEvent(id: string) {
    setSelectedId(id);
    setDetail(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/google/calendar/${id}`);
      const data = (await res.json()) as { event?: CalendarEventDetail; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Kunne ikke hente hendelse");
        return;
      }
      setDetail(data.event ?? null);
    } catch {
      setError("Kunne ikke hente hendelse");
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
      <div className="max-h-[420px] overflow-y-auto px-3 py-3">
        <p className="mb-3 text-[11px] font-medium capitalize text-zinc-300/80">
          {monthLabel}
        </p>

        {groups.length === 0 ? (
          <p className="py-6 text-center text-xs text-zinc-600">
            Ingen hendelser denne måneden
          </p>
        ) : (
          <div className="space-y-4">
            {groups.map(({ day, items }) => (
              <div key={day}>
                <p
                  className={cn(
                    "mb-1.5 text-[10px] font-semibold uppercase tracking-widest",
                    items[0].isToday ? "text-violet-400" : "text-zinc-600"
                  )}
                >
                  {formatDayHeader(items[0])}
                </p>
                <div className="space-y-0.5 border-l border-zinc-800/80 pl-2.5 ml-0.5">
                  {items.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => void openEvent(ev.id)}
                      className="flex w-full items-start gap-2 rounded-md py-1.5 text-left transition-colors hover:bg-zinc-800/40"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/90" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-zinc-200">
                          {ev.title}
                        </p>
                        <p className="text-[10px] tabular-nums text-zinc-600">
                          {formatTime(ev.startTime)} – {formatTime(ev.endTime)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PiaDarkModal
        open={selectedId !== null}
        onClose={closeModal}
        maxWidth="max-w-lg"
        title={detail?.title ?? "Kalenderhendelse"}
        subtitle={detail ? formatFullRange(detail.startTime, detail.endTime, detail.isAllDay) : undefined}
      >
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Henter hendelse…
          </div>
        )}
        {error && (
          <p className="py-8 text-center text-sm text-rose-300">{error}</p>
        )}
        {detail && !loading && (
          <div className="space-y-4">
            {detail.location && (
              <div className="flex items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-300">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
                {detail.location}
              </div>
            )}
            {detail.description ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                  Beskrivelse
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                  {detail.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-zinc-600">Ingen beskrivelse</p>
            )}
            {detail.htmlLink && (
              <a
                href={detail.htmlLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Åpne i Google Calendar
              </a>
            )}
          </div>
        )}
      </PiaDarkModal>
    </>
  );
}
