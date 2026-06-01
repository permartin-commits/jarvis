"use client";

import { useState, useEffect } from "react";
import { ArrowUpDown, ChevronUp, ChevronDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const PREVIEW_COUNT = 5;

type SortCol = "dato" | "cm_grip" | "varighet_sekunder";
type SortDir = "asc" | "desc";
type GripCm = 1 | 2 | 3;
type FilterCm = "all" | GripCm;

interface BeastmakerSession {
  id: number;
  dato: string;
  starttid: string;
  varighet_sekunder: number;
  cm_grip: GripCm;
  med_vekt: boolean;
  ekstravekt_kg: string | null;
  kommentar: string | null;
}

function formatDuration(s: number): string {
  const abs = Math.abs(s);
  const m = Math.floor(abs / 60);
  const sec = abs % 60;
  const str = `${m}:${sec.toString().padStart(2, "0")}`;
  return s < 0 ? `-${str}` : str;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function loadSessions(): Promise<BeastmakerSession[]> {
  return fetch("/api/beastmaker")
    .then((r) => r.json())
    .then((d) => (d.sessions as BeastmakerSession[]) ?? [])
    .catch(() => []);
}

export function BeastmakerLogger({ refreshKey = 0 }: { refreshKey?: number }) {
  const [sessions, setSessions] = useState<BeastmakerSession[]>([]);
  const [sortCol, setSortCol] = useState<SortCol>("dato");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterCm, setFilterCm] = useState<FilterCm>("all");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadSessions().then(setSessions);
  }, [refreshKey]);

  function toggleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  function cycleFilterCm() {
    setFilterCm((f) => (f === "all" ? 1 : f === 1 ? 2 : f === 2 ? 3 : "all"));
  }

  const displayed = [...sessions]
    .filter((s) => filterCm === "all" || s.cm_grip === filterCm)
    .sort((a, b) => {
      let cmp = 0;
      if (sortCol === "dato") {
        cmp = new Date(a.starttid).getTime() - new Date(b.starttid).getTime();
      } else if (sortCol === "cm_grip") {
        cmp = a.cm_grip - b.cm_grip;
      } else {
        cmp = a.varighet_sekunder - b.varighet_sekunder;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  const visibleRows = showAll ? displayed : displayed.slice(0, PREVIEW_COUNT);
  const hasMore = displayed.length > PREVIEW_COUNT;

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 text-primary" />
    ) : (
      <ChevronDown className="h-3 w-3 text-primary" />
    );
  }

  if (sessions.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-border">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
          <span className="text-xs font-bold text-primary">B</span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">Beastmaker</h2>
          <p className="text-xs text-muted-foreground">
            {sessions.length} enkeltregistreringer
          </p>
        </div>
      </header>

      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Historikk
        </span>
        <span className="text-xs text-muted-foreground">
          {displayed.length}
          {filterCm !== "all" ? ` / ${sessions.length}` : ""} økter
        </span>
      </div>

      {sessions.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">
          Ingen økter registrert ennå.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3 border-b border-border/60 bg-secondary/20 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <button
              type="button"
              onClick={() => toggleSort("dato")}
              className="flex flex-1 items-center gap-1 text-left transition-colors hover:text-foreground"
            >
              Dato <SortIcon col="dato" />
            </button>
            <button
              type="button"
              onClick={cycleFilterCm}
              className={cn(
                "flex w-16 items-center gap-1 transition-colors hover:text-foreground",
                filterCm !== "all" && "text-primary"
              )}
              title="Klikk for å filtrere på grep"
            >
              <Filter className="h-3 w-3 shrink-0" />
              {filterCm === "all" ? "Grep" : `${filterCm} cm`}
            </button>
            <button
              type="button"
              onClick={() => toggleSort("varighet_sekunder")}
              className="flex w-14 items-center justify-end gap-1 transition-colors hover:text-foreground"
            >
              Tid <SortIcon col="varighet_sekunder" />
            </button>
            <span className="w-16 shrink-0 text-right">Vekt</span>
          </div>

          <div className="divide-y divide-border/60">
            {visibleRows.map((s) => (
              <div
                key={s.id}
                className="px-4 py-2.5 transition-colors hover:bg-secondary/20"
              >
                <div className="flex items-baseline gap-3">
                  <span className="flex-1 text-xs font-medium text-foreground">
                    {formatDate(s.starttid)}
                  </span>
                  <span
                    className={cn(
                      "w-16 text-xs font-semibold tabular-nums",
                      s.cm_grip === 1
                        ? "text-emerald-400"
                        : s.cm_grip === 2
                          ? "text-yellow-400"
                          : "text-orange-400"
                    )}
                  >
                    {s.cm_grip} cm
                  </span>
                  <span className="w-14 shrink-0 text-right text-xs tabular-nums text-foreground">
                    {formatDuration(s.varighet_sekunder)}
                  </span>
                  <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {s.med_vekt
                      ? s.ekstravekt_kg
                        ? `+${s.ekstravekt_kg} kg`
                        : "Ja"
                      : "—"}
                  </span>
                </div>
                {s.kommentar && (
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground/70">
                    {s.kommentar}
                  </p>
                )}
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="border-t border-border/60 px-4 py-2">
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="h-8 w-full text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {showAll
                  ? "Vis færre"
                  : `Vis mer (${displayed.length - PREVIEW_COUNT} til)`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
