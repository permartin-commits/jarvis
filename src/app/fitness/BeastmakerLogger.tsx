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

export function BeastmakerLogger({
  refreshKey = 0,
  dark = false,
}: {
  refreshKey?: number;
  dark?: boolean;
}) {
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
    const activeClass = dark ? "text-pia-coral" : "text-primary";
    return sortDir === "asc" ? (
      <ChevronUp className={cn("h-3 w-3", activeClass)} />
    ) : (
      <ChevronDown className={cn("h-3 w-3", activeClass)} />
    );
  }

  if (sessions.length === 0) return null;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border",
        dark ? "border-border bg-pia-surface/25" : "border-border"
      )}
    >
      <header
        className={cn(
          "flex items-center gap-3 border-b px-4 py-3",
          dark ? "border-border" : "border-border"
        )}
      >
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1",
            dark
              ? "bg-pia-coral/10 ring-pia-coral/25"
              : "bg-primary/10 ring-primary/20"
          )}
        >
          <span className={cn("text-xs font-bold", dark ? "text-pia-coral" : "text-primary")}>
            B
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className={cn("text-sm font-semibold", dark ? "text-pia-text" : "text-foreground")}>
            Beastmaker
          </h2>
          <p className={cn("text-xs", dark ? "text-pia-muted" : "text-muted-foreground")}>
            {sessions.length} enkeltregistreringer
          </p>
        </div>
      </header>

      <div
        className={cn(
          "flex items-center justify-between border-b px-4 py-2",
          dark ? "border-border" : "border-border/60"
        )}
      >
        <span className={cn("text-xs uppercase tracking-wide", dark ? "text-pia-muted" : "text-muted-foreground")}>
          Historikk
        </span>
        <span className={cn("text-xs", dark ? "text-pia-muted" : "text-muted-foreground")}>
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
          <div
            className={cn(
              "flex items-center gap-3 border-b px-4 py-2 text-[10px] font-medium uppercase tracking-wider",
              dark
                ? "border-border bg-pia-surface/40 text-pia-muted"
                : "border-border/60 bg-secondary/20 text-muted-foreground"
            )}
          >
            <button
              type="button"
              onClick={() => toggleSort("dato")}
              className={cn(
                "flex flex-1 items-center gap-1 text-left transition-colors",
                dark ? "hover:text-pia-text" : "hover:text-foreground"
              )}
            >
              Dato <SortIcon col="dato" />
            </button>
            <button
              type="button"
              onClick={cycleFilterCm}
              className={cn(
                "flex w-16 items-center gap-1 transition-colors",
                dark ? "hover:text-pia-text" : "hover:text-foreground",
                filterCm !== "all" && (dark ? "text-pia-coral" : "text-primary")
              )}
              title="Klikk for å filtrere på grep"
            >
              <Filter className="h-3 w-3 shrink-0" />
              {filterCm === "all" ? "Grep" : `${filterCm} cm`}
            </button>
            <button
              type="button"
              onClick={() => toggleSort("varighet_sekunder")}
              className={cn(
                "flex w-14 items-center justify-end gap-1 transition-colors",
                dark ? "hover:text-pia-text" : "hover:text-foreground"
              )}
            >
              Tid <SortIcon col="varighet_sekunder" />
            </button>
            <span className="w-16 shrink-0 text-right">Vekt</span>
          </div>

          <div className={cn("divide-y", dark ? "divide-border/70" : "divide-border/60")}>
            {visibleRows.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "px-4 py-2.5 transition-colors",
                  dark ? "hover:bg-pia-surface/30" : "hover:bg-secondary/20"
                )}
              >
                <div className="flex items-baseline gap-3">
                  <span className={cn("flex-1 text-xs font-medium", dark ? "text-pia-text" : "text-foreground")}>
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
                  <span className={cn("w-14 shrink-0 text-right text-xs tabular-nums", dark ? "text-pia-text" : "text-foreground")}>
                    {formatDuration(s.varighet_sekunder)}
                  </span>
                  <span className={cn("w-16 shrink-0 text-right text-xs tabular-nums", dark ? "text-pia-muted" : "text-muted-foreground")}>
                    {s.med_vekt
                      ? s.ekstravekt_kg
                        ? `+${s.ekstravekt_kg} kg`
                        : "Ja"
                      : "—"}
                  </span>
                </div>
                {s.kommentar && (
                  <p className={cn("mt-1 text-[11px] leading-snug", dark ? "text-pia-muted" : "text-muted-foreground/70")}>
                    {s.kommentar}
                  </p>
                )}
              </div>
            ))}
          </div>

          {hasMore && (
            <div className={cn("border-t px-4 py-2", dark ? "border-border/70" : "border-border/60")}>
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className={cn(
                  "h-8 w-full text-xs transition-colors",
                  dark ? "text-pia-muted hover:text-pia-text" : "text-muted-foreground hover:text-foreground"
                )}
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
