"use client";

import { useEffect, useMemo, useState } from "react";
import { Dumbbell, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { normalizeCategory, type WorkoutHistoryRow } from "@/lib/strength";
import { WorkoutDetailModal } from "./WorkoutDetailModal";

const PREVIEW_COUNT = 5;
const ALL_CATEGORY = "alle";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatVolume(kg: number): string {
  if (kg <= 0) return "—";
  return `${kg.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kg`;
}

function loadWorkouts(): Promise<{
  workouts: WorkoutHistoryRow[];
  categories: string[];
}> {
  return fetch("/api/strength/workouts")
    .then((r) => r.json())
    .then((d) => ({
      workouts: (d.workouts as WorkoutHistoryRow[]) ?? [],
      categories: (d.categories as string[]) ?? [],
    }))
    .catch(() => ({ workouts: [], categories: [] }));
}

export function StrengthTrainingLog({
  refreshKey = 0,
  dark = false,
}: {
  refreshKey?: number;
  dark?: boolean;
}) {
  const [workouts, setWorkouts] = useState<WorkoutHistoryRow[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string>(ALL_CATEGORY);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function reload() {
    setLoading(true);
    loadWorkouts()
      .then(({ workouts: rows, categories }) => {
        setWorkouts(rows);
        setDbCategories(categories);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, [refreshKey]);

  const filterOptions = useMemo(
    () => [ALL_CATEGORY, ...dbCategories],
    [dbCategories]
  );

  const filtered = useMemo(() => {
    if (category === ALL_CATEGORY) return workouts;
    const needle = normalizeCategory(category);
    return workouts.filter((w) =>
      w.categories.some((c) => normalizeCategory(c) === needle)
    );
  }, [workouts, category]);

  const visibleRows = showAll ? filtered : filtered.slice(0, PREVIEW_COUNT);
  const hasMore = filtered.length > PREVIEW_COUNT;

  return (
    <>
      {selectedId && (
        <WorkoutDetailModal
          workoutId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={reload}
        />
      )}

      <section
        className={cn(
          "overflow-hidden rounded-xl border",
          dark ? "border-zinc-800 bg-zinc-900/40" : "border-border"
        )}
      >
      <header
        className={cn(
          "flex flex-wrap items-center gap-3 border-b px-4 py-3.5",
          dark
            ? "border-zinc-800 bg-zinc-900/60"
            : "border-border bg-gradient-to-br from-primary/[0.06] via-card to-card"
        )}
      >
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
            dark
              ? "bg-violet-500/10 ring-violet-500/25"
              : "bg-primary/15 ring-primary/25"
          )}
        >
          <Dumbbell className={cn("h-4 w-4", dark ? "text-violet-400" : "text-primary")} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className={cn("text-sm font-semibold tracking-tight", dark ? "text-zinc-100" : "text-foreground")}>
            Styrketrening
          </h2>
          <p className={cn("text-xs", dark ? "text-zinc-500" : "text-muted-foreground")}>
            {loading ? "Laster…" : `${filtered.length} loggede økter`}
          </p>
        </div>
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v ?? ALL_CATEGORY);
            setShowAll(false);
          }}
        >
          <SelectTrigger
            size="sm"
            className={cn(
              "ml-auto w-[8.5rem]",
              dark
                ? "border-zinc-700 bg-zinc-900/80 text-zinc-300"
                : "border-border/60 bg-secondary/30"
            )}
          >
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent align="end">
            {filterOptions.map((key) => (
              <SelectItem key={key} value={key}>
                {key === ALL_CATEGORY ? "Alle" : key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      <div>
          {loading ? (
            <div className={cn("flex items-center justify-center gap-2 py-10 text-xs", dark ? "text-zinc-500" : "text-muted-foreground")}>
              <Loader2 className={cn("h-4 w-4 animate-spin", dark ? "text-violet-400/70" : "text-primary/70")} />
              Henter økter…
            </div>
          ) : filtered.length === 0 ? (
            <p className={cn("py-10 text-center text-xs", dark ? "text-zinc-500" : "text-muted-foreground")}>
              {workouts.length === 0
                ? "Ingen loggede økter ennå. Trykk «Logg økt» for å starte."
                : "Ingen økter for valgt kategori."}
            </p>
          ) : (
            <>
              <div
                className={cn(
                  "flex items-center gap-3 border-b px-4 py-2 text-[10px] font-medium uppercase tracking-wider",
                  dark
                    ? "border-zinc-800 bg-zinc-900/60 text-zinc-600"
                    : "border-border/60 bg-secondary/20 text-muted-foreground"
                )}
              >
                <span className="w-24 shrink-0">Dato</span>
                <span className="min-w-0 flex-1">Økt-navn</span>
                <span className="hidden w-32 shrink-0 sm:inline">Hovedøvelse</span>
                <span className="w-24 shrink-0 text-right">Totalt volum</span>
              </div>

              <div className={cn("divide-y", dark ? "divide-zinc-800/70" : "divide-border/60")}>
                {visibleRows.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedId(w.id)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                      dark ? "hover:bg-zinc-800/40" : "hover:bg-secondary/20"
                    )}
                  >
                    <span className={cn("w-24 shrink-0 text-[10px] tabular-nums", dark ? "text-zinc-600" : "text-muted-foreground/80")}>
                      {formatDate(w.dato)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-xs font-medium", dark ? "text-zinc-200" : "text-foreground")}>
                        {w.oktNavn}
                        {w.isPlanned && (
                          <span className="ml-1.5 rounded border border-amber-500/30 bg-amber-500/10 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-amber-400">
                            Plan
                          </span>
                        )}
                      </p>
                      <p className={cn("truncate text-[10px] sm:hidden", dark ? "text-zinc-600" : "text-muted-foreground")}>
                        {w.hovedovelse ?? "—"}
                        {w.notes ? " · notat" : ""}
                      </p>
                    </div>
                    <span className={cn("hidden w-32 shrink-0 truncate text-xs sm:inline", dark ? "text-zinc-500" : "text-muted-foreground")}>
                      {w.hovedovelse ?? "—"}
                    </span>
                    <span
                      className={cn(
                        "w-24 shrink-0 text-right text-xs tabular-nums",
                        w.totaltVolumKg > 0
                          ? dark ? "text-zinc-300" : "text-foreground"
                          : dark ? "text-zinc-600" : "text-muted-foreground"
                      )}
                    >
                      {formatVolume(w.totaltVolumKg)}
                    </span>
                  </button>
                ))}
              </div>

              {hasMore && (
                <div className={cn("border-t px-4 py-3", dark ? "border-zinc-800/70" : "border-border/60")}>
                  <button
                    type="button"
                    onClick={() => setShowAll((v) => !v)}
                    className={cn(
                      "w-full rounded-md border py-2 text-xs font-medium transition-colors",
                      dark
                        ? "border-zinc-700 bg-zinc-900/60 text-zinc-500 hover:border-violet-500/30 hover:text-zinc-300"
                        : "border-border bg-secondary/20 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    )}
                  >
                    {showAll
                      ? "Vis færre"
                      : `Vis mer (${filtered.length - PREVIEW_COUNT} til)`}
                  </button>
                </div>
              )}
            </>
          )}
      </div>
    </section>
    </>
  );
}
