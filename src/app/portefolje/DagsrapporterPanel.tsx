"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRapportType, type Dagsrapport } from "@/lib/dagsrapporter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PREVIEW_COUNT = 8;

function formatDato(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("nb-NO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function typeBadgeClass(type: string): string {
  const t = formatRapportType(type).toLowerCase();
  if (t.includes("morgen") || t.includes("morning")) {
    return "bg-sky-500/15 text-sky-400 border-sky-500/30";
  }
  if (t.includes("kveld") || t.includes("evening")) {
    return "bg-violet-500/15 text-violet-400 border-violet-500/30";
  }
  if (t.includes("uke") || t.includes("weekly")) {
    return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  }
  return "bg-zinc-800/60 text-zinc-500 border-zinc-700";
}

function loadRapporter(): Promise<Dagsrapport[]> {
  return fetch("/api/dagsrapporter", { cache: "no-store" })
    .then((r) => r.json())
    .then((d) => (d.rapporter as Dagsrapport[]) ?? [])
    .catch(() => []);
}

function DetailField({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string | null;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          "text-sm text-zinc-200",
          multiline &&
            "max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md border border-zinc-800 bg-zinc-900/60 p-3 leading-relaxed"
        )}
      >
        {value?.trim() ? value : "—"}
      </p>
    </div>
  );
}

export function DagsrapporterPanel() {
  const [rapporter, setRapporter] = useState<Dagsrapport[]>([]);
  const [selected, setSelected] = useState<Dagsrapport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    loadRapporter()
      .then(setRapporter)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const visible = showAll ? rapporter : rapporter.slice(0, PREVIEW_COUNT);
  const hasMore = rapporter.length > PREVIEW_COUNT;

  return (
    <>
      <div className="w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div className="border-b border-zinc-800 bg-zinc-900/60 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 ring-1 ring-violet-500/25">
              <FileText className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-100">
                Morgenrapport
              </p>
              <p className="text-[10px] text-zinc-500">
                {loading ? "Laster…" : `${rapporter.length} i dagsrapporter`}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin text-violet-400/70" />
            Henter…
          </div>
        ) : rapporter.length === 0 ? (
          <p className="px-3 py-8 text-center text-[11px] text-zinc-500">
            Ingen rader i dagsrapporter ennå.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-[9px] font-medium uppercase tracking-wider text-zinc-600">
              <span className="w-[4.5rem] shrink-0">Dato</span>
              <span className="min-w-0 flex-1">Type</span>
            </div>

            <div className="divide-y divide-zinc-800/70">
              {visible.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelected(r)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-zinc-800/40"
                >
                  <span className="w-[4.5rem] shrink-0 text-[10px] tabular-nums text-zinc-500">
                    {formatDato(r.dato)}
                  </span>
                  <span
                    className={cn(
                      "inline-flex max-w-full truncate rounded border px-1.5 py-0.5 text-[10px] font-medium",
                      typeBadgeClass(r.type)
                    )}
                  >
                    {formatRapportType(r.type)}
                  </span>
                </button>
              ))}
            </div>

            {hasMore && (
              <div className="border-t border-zinc-800/70 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setShowAll((v) => !v)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900/60 py-1.5 text-[10px] font-medium text-zinc-500 transition-colors hover:border-violet-500/30 hover:text-zinc-300"
                >
                  {showAll
                    ? "Vis færre"
                    : `Vis mer (${rapporter.length - PREVIEW_COUNT})`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[min(90vh,640px)] gap-0 overflow-hidden border-zinc-800 bg-zinc-950 p-0 sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader className="border-b border-zinc-800 bg-zinc-900/60 px-5 py-4">
                <DialogTitle className="text-base font-semibold text-zinc-100">
                  {formatRapportType(selected.type)}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  {formatDato(selected.dato)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 overflow-y-auto px-5 py-4">
                <DetailField label="Dato" value={formatDato(selected.dato)} />
                <DetailField label="Type" value={formatRapportType(selected.type)} />
                <DetailField label="Rapport" value={selected.rapport} multiline />
                <DetailField label="Handling" value={selected.handling} multiline />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
