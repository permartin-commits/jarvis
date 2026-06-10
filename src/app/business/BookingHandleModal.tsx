"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  Calendar,
  Clock,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  X,
  CalendarClock,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingRow } from "@/app/api/business/bookings/route";

const STATUS_LABEL: Record<string, string> = {
  pending:   "Venter",
  confirmed: "Bekreftet",
  cancelled: "Avlyst",
};

const STATUS_STYLES: Record<string, string> = {
  pending:   "border-amber-500/30 bg-amber-500/10 text-amber-300",
  confirmed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  cancelled: "border-zinc-600/40 bg-zinc-800 text-zinc-500",
};

const PAYMENT_LABEL: Record<string, string> = {
  paid:      "Betalt",
  pending:   "Ventende",
  free:      "Gratis",
  failed:    "Feilet",
  cancelled: "Avbrutt",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function toDateInput(iso: string | null) {
  return iso ? iso.slice(0, 10) : "";
}

function toTimeInput(time: string | null) {
  return time ? time.slice(0, 5) : "";
}

function fmtNok(n: number) {
  return Number(n).toLocaleString("nb-NO", { maximumFractionDigits: 0 }) + " kr";
}

type Props = {
  booking: BookingRow | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (id: string, patch: Partial<BookingRow>) => void;
};

export function BookingHandleModal({ booking, open, onClose, onUpdated }: Props) {
  const [mounted, setMounted] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState<"confirm" | "reject" | "confirm_reschedule" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!booking) return;
    setDate(toDateInput(booking.requested_date));
    setTime(toTimeInput(booking.requested_time));
    setError(null);
  }, [booking]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open || !booking) return null;

  const originalDate = toDateInput(booking.requested_date);
  const originalTime = toTimeInput(booking.requested_time);
  const dateChanged = date !== originalDate || time !== originalTime;
  const statusKey = booking.status in STATUS_STYLES ? booking.status : "pending";

  async function runAction(action: "confirm" | "reject" | "confirm_reschedule") {
    setSubmitting(action);
    setError(null);
    try {
      const res = await fetch(`/api/business/bookings/${booking!.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(action === "confirm_reschedule" ? { requested_date: date, requested_time: time } : {}),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        webhook_error?: string;
        requested_date?: string;
        requested_time?: string;
        status?: string;
      };
      if (!res.ok) {
        setError(data.webhook_error ?? data.error ?? "Noe gikk galt");
        return;
      }
      onUpdated(booking!.id, {
        status: data.status ?? (action === "reject" ? "cancelled" : "confirmed"),
        requested_date: data.requested_date ?? date,
        requested_time: data.requested_time ?? time,
      });
      onClose();
    } catch {
      setError("Kunne ikke sende handling");
    } finally {
      setSubmitting(null);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-handle-title"
      >
        <div className="h-0.5 w-full bg-gradient-to-r from-violet-600 via-violet-500 to-cyan-500" />

        <div className="border-b border-zinc-800 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Forespørsel
              </p>
              <h2 id="booking-handle-title" className="truncate text-lg font-semibold text-zinc-100">
                {booking.name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                {booking.company && (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3 w-3 shrink-0" />
                    {booking.company}
                  </span>
                )}
                <span className="inline-flex min-w-0 items-center gap-1">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{booking.email}</span>
                </span>
                {booking.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3 shrink-0" />
                    {booking.phone}
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                aria-label="Lukk"
              >
                <X className="h-4 w-4" />
              </button>
              <span className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                STATUS_STYLES[statusKey]
              )}>
                {STATUS_LABEL[booking.status] ?? booking.status}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                <Calendar className="h-3 w-3" />
                Mottatt
              </p>
              <p className="text-sm font-medium text-zinc-200">{formatDate(booking.created_at)}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                <CreditCard className="h-3 w-3" />
                Betaling
              </p>
              <p className="text-sm font-medium text-zinc-200">
                {PAYMENT_LABEL[booking.payment_status] ?? booking.payment_status}
                {booking.amount_nok > 0 && (
                  <span className="ml-1.5 text-zinc-500">· {fmtNok(booking.amount_nok)}</span>
                )}
              </p>
            </div>
          </div>

          {booking.event_heading && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-violet-400/80">
                Kurs / tema
              </p>
              <p className="text-sm font-medium text-violet-200">{booking.event_heading}</p>
            </div>
          )}

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              <CalendarClock className="h-3.5 w-3.5" />
              Ønsket tidspunkt
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[11px] text-zinc-500">Dato</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                />
              </label>
              <label className="space-y-1.5">
                <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                  <Clock className="h-3 w-3" />
                  Tid
                </span>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                />
              </label>
            </div>
            {dateChanged ? (
              <p className="mt-2.5 text-[11px] text-cyan-400/90">
                Dato endret — du kan bekrefte med nytt tidspunkt nederst.
              </p>
            ) : (
              <p className="mt-2.5 text-[11px] text-zinc-600">
                Endre dato eller tid for å aktivere «Bekreft med ny dato».
              </p>
            )}
          </div>

          {booking.message && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                <MessageSquare className="h-3 w-3" />
                Melding
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                {booking.message}
              </p>
            </div>
          )}

          {booking.notes && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                Notater
              </p>
              <p className="whitespace-pre-wrap text-sm text-zinc-400">{booking.notes}</p>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-800 bg-zinc-900/50 px-5 py-4">
          {error && (
            <p className="mb-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-center text-xs text-rose-300">
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={submitting !== null}
              onClick={() => void runAction("reject")}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50"
            >
              {submitting === "reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Avvis"}
            </button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={submitting !== null}
                onClick={() => void runAction("confirm")}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
              >
                {submitting === "confirm" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Bekreft"}
              </button>
              <button
                type="button"
                disabled={submitting !== null || !dateChanged}
                onClick={() => void runAction("confirm_reschedule")}
                className={cn(
                  "inline-flex h-9 items-center justify-center rounded-lg border px-4 text-xs font-medium transition-colors disabled:opacity-40",
                  dateChanged
                    ? "border-violet-500/40 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25"
                    : "border-zinc-800 bg-zinc-900 text-zinc-600"
                )}
              >
                {submitting === "confirm_reschedule" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Bekreft med ny dato"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
