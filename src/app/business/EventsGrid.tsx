"use client";

import { useEffect, useState } from "react";
import { MapPin, Users, TrendingUp, Clock, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EventRow } from "@/app/api/business/events/route";
import { PameldteTable } from "./PameldteTable";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function fmtNok(n: number | null | undefined) {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return "0 kr";
  return v.toLocaleString("nb-NO", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " kr";
}

function CapacityBar({ taken, capacity }: { taken: number; capacity: number | null }) {
  if (!capacity) return null;
  const pct = Math.min(100, Math.round((taken / capacity) * 100));
  const color =
    pct >= 90 ? "bg-rose-500" :
    pct >= 70 ? "bg-amber-500" :
    "bg-emerald-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-zinc-500">
        <span>{taken} påmeldte</span>
        <span>{capacity - taken} ledige</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function EventCard({
  event,
  selected,
  onSelect,
}: {
  event: EventRow;
  selected: boolean;
  onSelect: () => void;
}) {
  const isPublished = event.is_published;
  const isPast = new Date(event.event_date) < new Date();
  const seatsTaken = event.seats_taken ?? event.paid_count;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex w-full flex-col overflow-hidden rounded-2xl border bg-zinc-900 text-left transition-all",
        selected
          ? "border-violet-500/60 ring-1 ring-violet-500/40 shadow-[0_0_24px_-8px_rgba(139,92,246,0.45)]"
          : "border-zinc-700 hover:border-zinc-600 hover:bg-zinc-900/80",
        !isPublished && "opacity-70"
      )}
    >
      <div className={cn(
        "h-0.5 w-full",
        isPast ? "bg-zinc-700" :
        isPublished ? "bg-gradient-to-r from-violet-600 to-cyan-500" :
        "bg-zinc-700"
      )} />

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <span className={cn(
                "inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest",
                isPublished
                  ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
                  : "border-zinc-700 bg-zinc-800 text-zinc-600"
              )}>
                {isPublished ? "Publisert" : "Utkast"}
              </span>
              {selected && (
                <span className="inline-flex items-center rounded border border-violet-500/40 bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-violet-300">
                  Valgt
                </span>
              )}
              {isPast && (
                <span className="inline-flex items-center rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                  Avsluttet
                </span>
              )}
              {event.category && (
                <span className="inline-flex items-center rounded border border-zinc-700 px-1.5 py-0.5 text-[9px] text-zinc-500">
                  {event.category}
                </span>
              )}
            </div>
            <h3 className="truncate text-sm font-semibold text-zinc-100">{event.heading}</h3>
          </div>
          <a
            href="https://verlanse.no/registrer"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            title="Åpne registreringssiden"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="space-y-1.5 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
            <span>{formatDate(event.event_date)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          {event.price != null && (
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
              <span>{fmtNok(event.price)} per plass</span>
            </div>
          )}
        </div>

        {event.capacity != null && (
          <CapacityBar taken={seatsTaken} capacity={event.capacity} />
        )}

        <div className="mt-auto grid grid-cols-3 gap-2 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-widest text-zinc-600">Betalt</p>
            <p className="text-sm font-bold tabular-nums text-emerald-300">{event.paid_count}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-widest text-zinc-600">Ventende</p>
            <p className={cn(
              "text-sm font-bold tabular-nums",
              event.pending_count > 0 ? "text-amber-300" : "text-zinc-600"
            )}>
              {event.pending_count}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-widest text-zinc-600">Inntekt</p>
            <p className="text-sm font-bold tabular-nums text-cyan-300">
              {fmtNok(Number(event.revenue))}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

export function EventsGrid({ preview }: { preview?: boolean }) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/business/events")
      .then((r) => r.json())
      .then((d) => setEvents((d.events as EventRow[]) ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const rows = preview ? events.slice(0, 3) : events;
  const selected = events.find((e) => e.id === selectedId) ?? null;

  function handleSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Kurs / Events {!loading && `(${events.length})`}
        </h2>
        <div className="ml-auto flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-zinc-600" />
          <span className="text-[10px] text-zinc-600">
            {events.reduce((s, e) => s + (e.paid_count ?? 0), 0)} totalt påmeldte
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-xs text-zinc-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Henter kurs…
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <p className="text-xs text-zinc-600">Ingen kurs funnet.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                selected={selectedId === event.id}
                onSelect={() => handleSelect(event.id)}
              />
            ))}
          </div>

          {!preview && selected && (
            <PameldteTable
              eventId={selected.id}
              eventHeading={selected.heading}
            />
          )}
        </>
      )}

      {preview && events.length > 3 && (
        <p className="mt-2 text-right text-[10px] text-zinc-600">
          + {events.length - 3} flere · gå til Kurs-fanen for full oversikt
        </p>
      )}

      {!preview && !loading && events.length > 0 && !selected && (
        <p className="mt-4 text-center text-[10px] text-zinc-600">
          Klikk på et kurs for å se påmeldte
        </p>
      )}
    </section>
  );
}
