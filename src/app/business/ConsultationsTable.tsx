"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsultationRow } from "@/app/api/business/consultations/route";
import { ConsultationHandleModal } from "./ConsultationHandleModal";

const STATUS_STYLES: Record<string, string> = {
  pending:   "bg-amber-500/15   text-amber-300   border-amber-500/30",
  confirmed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  cancelled: "bg-zinc-700/40   text-zinc-500    border-zinc-600/40",
};

const STATUS_LABEL: Record<string, string> = {
  pending:   "Venter",
  confirmed: "Bekreftet",
  cancelled: "Avlyst",
};

const GRID =
  "grid grid-cols-[96px_1fr_1fr_96px_72px_minmax(160px,1.5fr)_88px_104px] gap-3";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

export function ConsultationsTable({ preview }: { preview?: boolean }) {
  const [rows, setRows] = useState<ConsultationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ConsultationRow | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/business/consultations")
      .then((r) => r.json())
      .then((d) => setRows((d.consultations as ConsultationRow[]) ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleUpdated(id: string, status: string) {
    setRows((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }

  const display = preview ? rows.slice(0, 5) : rows;

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Konsultasjoner {!loading && `(${rows.length})`}
        </h2>
        {!preview && (
          <button
            type="button"
            onClick={load}
            className="ml-auto rounded-lg border border-zinc-700 bg-zinc-900 p-1.5 text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        <div className={cn(GRID, "border-b border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600")}>
          <span>Mottatt</span>
          <span>Navn</span>
          <span>E-post</span>
          <span>Ønsket dato</span>
          <span>Tid</span>
          <span>Melding</span>
          <span>Status</span>
          <span />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-xs text-zinc-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Henter konsultasjoner…
          </div>
        ) : display.length === 0 ? (
          <p className="py-12 text-center text-xs text-zinc-600">Ingen konsultasjoner funnet.</p>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {display.map((c) => (
              <div
                key={c.id}
                className={cn(GRID, "items-center px-4 py-3 text-xs transition-colors hover:bg-zinc-900/60")}
              >
                <span className="tabular-nums text-zinc-500">{formatDate(c.created_at)}</span>

                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-200">{c.name}</p>
                  {c.company && (
                    <p className="truncate text-[10px] text-zinc-600">{c.company}</p>
                  )}
                  {c.event_heading && (
                    <p className="truncate text-[10px] text-violet-400/80">{c.event_heading}</p>
                  )}
                </div>

                <span className="truncate text-zinc-400">{c.email}</span>
                <span className="tabular-nums text-zinc-300">{formatDate(c.requested_date)}</span>
                <span className="tabular-nums text-zinc-300">{formatTime(c.requested_time)}</span>

                <p className="min-w-0 truncate text-zinc-500">
                  {c.message ?? <span className="text-zinc-600">—</span>}
                </p>

                <span className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  STATUS_STYLES[c.status] ?? "text-zinc-400 border-zinc-600"
                )}>
                  {STATUS_LABEL[c.status] ?? c.status}
                </span>

                <button
                  type="button"
                  onClick={() => setSelected(c)}
                  className="inline-flex items-center justify-center rounded-md border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-[10px] font-medium text-violet-300 transition-colors hover:bg-violet-500/20"
                >
                  Behandling
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConsultationHandleModal
        consultation={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
        onUpdated={handleUpdated}
      />

      {preview && rows.length > 5 && (
        <p className="mt-2 text-right text-[10px] text-zinc-600">
          + {rows.length - 5} flere · gå til Bookings-fanen for full oversikt
        </p>
      )}
    </section>
  );
}
