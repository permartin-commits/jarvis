"use client";

import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Loader2, MessageSquare, Coins } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface DailyPoint {
  day: string;
  queries: number;
  costNok: number;
}

interface AiStats {
  totalCalls: number;
  totalNokFmt: string;
  last30Queries: number;
  daily: DailyPoint[];
  error?: string;
}

const CHART_HEIGHT_PX = 128;
const CHART_DAYS = 14;

function formatDayLabel(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("nb-NO", { day: "2-digit", month: "short" });
}

/** Fyll siste N kalenderdager (inkl. dager uten data). */
function buildChartSeries(daily: DailyPoint[], days: number): DailyPoint[] {
  const byDay = new Map(daily.map((d) => [d.day.slice(0, 10), d]));
  const out: DailyPoint[] = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const hit = byDay.get(key);
    out.push({
      day: key,
      queries: hit?.queries ?? 0,
      costNok: hit?.costNok ?? 0,
    });
  }
  return out;
}

function DailyChart({ data }: { data: DailyPoint[] }) {
  const hasAny = data.some((d) => d.queries > 0);

  if (!hasAny) {
    return (
      <p className="py-8 text-center text-xs text-muted-foreground">
        Ingen registrerte spørringer i valgt periode.
      </p>
    );
  }

  const maxQ = Math.max(...data.map((d) => d.queries), 1);

  return (
    <div className="space-y-2">
      <div
        className="flex items-end gap-1 px-1"
        style={{ height: CHART_HEIGHT_PX }}
      >
        {data.map((d) => {
          const barPx = Math.max(
            d.queries > 0 ? 6 : 2,
            Math.round((d.queries / maxQ) * (CHART_HEIGHT_PX - 8))
          );
          return (
            <div
              key={d.day}
              className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end"
              title={`${formatDayLabel(d.day)}: ${d.queries} spørringer`}
            >
              <div
                className={
                  d.queries > 0
                    ? "w-full max-w-8 rounded-t-md bg-gradient-to-t from-primary to-primary/40 transition-colors group-hover:from-sky-400 group-hover:to-primary/50"
                    : "w-full max-w-8 rounded-t-sm bg-secondary/50"
                }
                style={{ height: barPx }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 px-1">
        {data.map((d) => (
          <span
            key={`${d.day}-lbl`}
            className="min-w-0 flex-1 truncate text-center text-[9px] text-muted-foreground"
          >
            {formatDayLabel(d.day)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AiOverviewPanel() {
  const [stats, setStats] = useState<AiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ai-stats", { cache: "no-store", credentials: "same-origin" })
      .then(async (r) => {
        const d = (await r.json()) as AiStats;
        if (!r.ok) {
          throw new Error(d.error ?? `HTTP ${r.status}`);
        }
        setStats(d);
        setLoadError(null);
      })
      .catch((e) => {
        setStats(null);
        setLoadError(e instanceof Error ? e.message : "Kunne ikke hente data");
      })
      .finally(() => setLoading(false));
  }, []);

  const chartData = useMemo(
    () => (stats?.daily ? buildChartSeries(stats.daily, CHART_DAYS) : []),
    [stats?.daily]
  );

  return (
    <Card className="w-full max-w-4xl border-border/80 bg-card/90 shadow-lg shadow-primary/5">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <BrainCircuit className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              AI-analyser totalt
            </CardTitle>
            <CardDescription className="text-xs">
              ai_logger + PIA-chat · stolpediagram viser siste {CHART_DAYS} dager
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary/70" />
            Henter AI-statistikk…
          </div>
        ) : loadError ? (
          <p className="py-6 text-center text-sm text-red-400">{loadError}</p>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-secondary/25 px-4 py-3">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <BrainCircuit className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">
                    Analyser totalt
                  </span>
                </div>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {stats.totalCalls.toLocaleString("nb-NO")}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-secondary/25 px-4 py-3">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">
                    Siste 30 dager
                  </span>
                </div>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {stats.last30Queries.toLocaleString("nb-NO")}
                </p>
                <p className="text-[10px] text-muted-foreground">spørringer</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <div className="mb-2 flex items-center gap-2 text-primary/80">
                  <Coins className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">
                    Estimert kostnad
                  </span>
                </div>
                <p className="text-2xl font-bold tabular-nums text-primary">
                  {stats.totalNokFmt}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-secondary/15 p-4">
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                Spørringer per dag
              </p>
              <DailyChart data={chartData} />
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
