"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingRow } from "@/app/api/business/bookings/route";

const PAYMENT_OPTIONS = ["alle", "paid", "pending", "failed", "cancelled"] as const;

const PAYMENT_STYLES: Record<string, string> = {
  paid:      "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  pending:   "bg-amber-500/15   text-amber-300   border-amber-500/30",
  failed:    "bg-rose-500/15    text-rose-400    border-rose-500/30",
  cancelled: "bg-zinc-700/40   text-zinc-500    border-zinc-600/40",
};

const PAYMENT_LABEL: Record<string, string> = {
  paid:      "Betalt",
  pending:   "Ventende",
  failed:    "Feilet",
  cancelled: "Avbrutt",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtNok(n: number | null | undefined) {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return "0 kr";
  return v.toLocaleString("nb-NO", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " kr";
}

export function BookingsTable() {
  const [bookings, setBookings]       = useState<BookingRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [paymentFilter, setPayment]   = useState("alle");
  const [eventFilter, setEvent]       = useState("alle");

  const eventOptions = Array.from(
    new Map(
      bookings
        .filter((b) => b.event_id && b.event_heading)
        .map((b) => [b.event_id!, b.event_heading!])
    ).entries()
  ).map(([id, heading]) => ({ id, heading }));

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (paymentFilter !== "alle") params.set("payment_status", paymentFilter);
    if (eventFilter   !== "alle") params.set("event_id",       eventFilter);
    fetch(`/api/business/bookings?${params}`)
      .then((r) => r.json())
      .then((d) => setBookings((d.bookings as BookingRow[]) ?? []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [paymentFilter, eventFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPaid = bookings
    .filter((b) => b.payment_status === "paid")
    .reduce((s, b) => s + Number(b.amount_nok), 0);

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Bookings {!loading && `(${bookings.length})`}
        </h2>
        <select
          value={paymentFilter}
          onChange={(e) => setPayment(e.target.value)}
          className="ml-auto rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 outline-none hover:border-zinc-600"
        >
          {PAYMENT_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p === "alle" ? "Alle statuser" : PAYMENT_LABEL[p] ?? p}
            </option>
          ))}
        </select>
        <select
          value={eventFilter}
          onChange={(e) => setEvent(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 outline-none hover:border-zinc-600"
        >
          <option value="alle">Alle kurs</option>
          {eventOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.heading}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-zinc-700 bg-zinc-900 p-1.5 text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Revenue summary strip */}
      {!loading && bookings.length > 0 && (
        <div className="mb-3 flex items-center gap-6 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600">Omsetning (betalt)</p>
            <p className="text-sm font-bold tabular-nums text-emerald-300">{fmtNok(totalPaid)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600">Ventende</p>
            <p className="text-sm font-bold tabular-nums text-amber-300">
              {fmtNok(bookings.filter((b) => b.payment_status === "pending").reduce((s, b) => s + Number(b.amount_nok), 0))}
            </p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        <div className="grid grid-cols-[110px_1fr_1fr_1fr_100px_80px_100px] gap-3 border-b border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          <span>Dato booket</span>
          <span>Kurs</span>
          <span>Deltaker</span>
          <span>E-post</span>
          <span>Beløp</span>
          <span>Status</span>
          <span>Event-dato</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-xs text-zinc-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Henter bookings…
          </div>
        ) : bookings.length === 0 ? (
          <p className="py-12 text-center text-xs text-zinc-600">Ingen bookings funnet.</p>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {bookings.map((b) => (
              <div
                key={b.id}
                className={cn(
                  "grid grid-cols-[110px_1fr_1fr_1fr_100px_80px_100px] items-center gap-3 px-4 py-3 text-xs transition-colors hover:bg-zinc-900/60",
                  b.payment_status === "pending" && "bg-amber-500/[0.03]"
                )}
              >
                <span className="tabular-nums text-zinc-500">{formatDate(b.created_at)}</span>

                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-200">
                    {b.event_heading ?? <span className="text-zinc-600">—</span>}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-200">{b.name}</p>
                  {b.company && (
                    <p className="truncate text-[10px] text-zinc-600">{b.company}</p>
                  )}
                </div>

                <span className="truncate text-zinc-400">{b.email}</span>

                <span className="tabular-nums text-zinc-300">{fmtNok(Number(b.amount_nok))}</span>

                <span className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  PAYMENT_STYLES[b.payment_status] ?? "text-zinc-400 border-zinc-600"
                )}>
                  {PAYMENT_LABEL[b.payment_status] ?? b.payment_status}
                </span>

                <span className="tabular-nums text-zinc-500">
                  {b.event_date ? formatDate(b.event_date) : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
