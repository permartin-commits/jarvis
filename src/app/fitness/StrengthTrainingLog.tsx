"use client";

import { useEffect, useMemo, useState } from "react";
import { Dumbbell, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { normalizeCategory, type WorkoutHistoryRow } from "@/lib/strength";

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

export function StrengthTrainingLog({ refreshKey = 0 }: { refreshKey?: number }) {
  const [workouts, setWorkouts] = useState<WorkoutHistoryRow[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string>(ALL_CATEGORY);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadWorkouts()
      .then(({ workouts: rows, categories }) => {
        setWorkouts(rows);
        setDbCategories(categories);
      })
      .finally(() => setLoading(false));
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
    <section className="overflow-hidden rounded-xl border border-border">
      <header className="flex flex-wrap items-center gap-3 border-b border-border bg-gradient-to-br from-sky-500/[0.06] via-card to-card px-4 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 ring-1 ring-sky-500/25">
          <Dumbbell className="h-4 w-4 text-sky-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Styrketrening
          </h2>
          <p className="text-xs text-muted-foreground">
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
            className="ml-auto w-[8.5rem] border-border/60 bg-secondary/30"
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

      <Card className="rounded-none border-0 border-t border-border bg-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-sky-400/70" />
              Henter økter…
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-xs text-muted-foreground">
              {workouts.length === 0
                ? "Ingen loggede økter ennå. Trykk «Logg økt» for å starte."
                : "Ingen økter for valgt kategori."}
            </p>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-border/60 bg-secondary/20 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <span className="w-24 shrink-0">Dato</span>
                <span className="min-w-0 flex-1">Økt-navn</span>
                <span className="hidden w-32 shrink-0 sm:inline">Hovedøvelse</span>
                <span className="w-24 shrink-0 text-right">Totalt volum</span>
              </div>

              <div className="divide-y divide-border/60">
                {visibleRows.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/20"
                  >
                    <span className="w-24 shrink-0 text-[10px] tabular-nums text-muted-foreground/80">
                      {formatDate(w.dato)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {w.oktNavn}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground sm:hidden">
                        {w.hovedovelse ?? "—"}
                      </p>
                    </div>
                    <span className="hidden w-32 shrink-0 truncate text-xs text-muted-foreground sm:inline">
                      {w.hovedovelse ?? "—"}
                    </span>
                    <span
                      className={cn(
                        "w-24 shrink-0 text-right text-xs tabular-nums",
                        w.totaltVolumKg > 0
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatVolume(w.totaltVolumKg)}
                    </span>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="border-t border-border/60 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setShowAll((v) => !v)}
                    className="w-full rounded-md border border-border bg-secondary/20 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-sky-500/30 hover:text-foreground"
                  >
                    {showAll
                      ? "Vis færre"
                      : `Vis mer (${filtered.length - PREVIEW_COUNT} til)`}
                  </button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
