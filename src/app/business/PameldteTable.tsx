"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PameldteRow } from "@/app/api/business/pameldte/route";

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

const GRID = "grid grid-cols-[1fr_1fr_1fr_100px_96px] gap-3";

function fmtNok(n: number | null | undefined) {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return "0 kr";
  return v.toLocaleString("nb-NO", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " kr";
}

type Props = {
  eventId: string;
  eventHeading?: string;
};

export function PameldteTable({ eventId, eventHeading }: Props) {
  const [rows, setRows] = useState<PameldteRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/business/pameldte?event_id=${encodeURIComponent(eventId)}`)
      .then((r) => r.json())
      .then((d) => setRows((d.pameldte as PameldteRow[]) ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center gap-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Påmeldte {!loading && `(${rows.length})`}
          {eventHeading && (
            <span className="ml-2 normal-case text-zinc-500">· {eventHeading}</span>
          )}
        </h3>
        <button
          type="button"
          onClick={load}
          className="ml-auto rounded-lg border border-zinc-700 bg-zinc-900 p-1.5 text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        <div className={cn(GRID, "border-b border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600")}>
          <span>Navn</span>
          <span>E-post</span>
          <span>Bedrift</span>
          <span>Beløp</span>
          <span>Betaling</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-zinc-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Henter påmeldte…
          </div>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-xs text-zinc-600">Ingen påmeldte for dette kurset.</p>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {rows.map((p) => (
              <div
                key={p.id}
                className={cn(GRID, "items-center px-4 py-3 text-xs transition-colors hover:bg-zinc-900/60")}
              >
                <p className="truncate font-medium text-zinc-200">{p.navn}</p>
                <span className="truncate text-zinc-400">{p.epost}</span>
                <span className="truncate text-zinc-500">{p.bedrift ?? "—"}</span>
                <span className="tabular-nums text-zinc-300">{fmtNok(p.belop)}</span>
                <span className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  PAYMENT_STYLES[p.status_betaling] ?? "text-zinc-400 border-zinc-600"
                )}>
                  {PAYMENT_LABEL[p.status_betaling] ?? p.status_betaling}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
