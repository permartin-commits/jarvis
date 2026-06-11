"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BrainCircuit, Coins, Hash, Loader2, ArrowUpRight } from "lucide-react";

interface DailyPoint {
  day: string;
  queries: number;
  costNok: number;
}

interface AiStats {
  monthCalls: number;
  monthNokFmt: string;
  totalTokensFmt: string;
  daily: DailyPoint[];
}

const CHART_DAYS = 14;
const CHART_H = 100;

function formatDayLabel(iso: string) {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("nb-NO", { day: "2-digit", month: "short" });
}

function buildSeries(daily: DailyPoint[]) {
  const byDay = new Map(daily.map((d) => [d.day.slice(0, 10), d]));
  const out: DailyPoint[] = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  for (let i = CHART_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const hit = byDay.get(key);
    out.push({ day: key, queries: hit?.queries ?? 0, costNok: hit?.costNok ?? 0 });
  }
  return out;
}

export function AiStatsMini() {
  const [stats, setStats] = useState<AiStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai-stats", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) =>
        setStats({
          monthCalls: d.monthCalls ?? 0,
          monthNokFmt: d.monthNokFmt ?? "—",
          totalTokensFmt: d.totalTokensFmt ?? "—",
          daily: d.daily ?? [],
        })
      )
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const series = useMemo(
    () => buildSeries(stats?.daily ?? []),
    [stats?.daily]
  );
  const maxQ = Math.max(...series.map((d) => d.queries), 1);
  const hasData = series.some((d) => d.queries > 0);

  return (
    <section className="pia-panel flex h-full flex-col overflow-hidden">
      <div className="pia-panel-header flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-pia-pink" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-pia-muted">
            AI aktivitet
          </h2>
        </div>
        <Link
          href="/agent"
          className="flex items-center gap-0.5 text-[10px] font-medium text-pia-coral hover:text-pia-pink"
        >
          Detaljer
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        {loading ? (
          <div className="flex flex-1 items-center justify-center gap-2 py-6 text-xs text-pia-muted">
            <Loader2 className="h-4 w-4 animate-spin text-pia-coral" />
            Henter…
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              <MiniStat icon={<Hash className="h-3.5 w-3.5" />} label="Mnd. kall" value={String(stats.monthCalls)} />
              <MiniStat icon={<BrainCircuit className="h-3.5 w-3.5" />} label="Tokens" value={stats.totalTokensFmt} />
              <MiniStat icon={<Coins className="h-3.5 w-3.5" />} label="Mnd. kost" value={stats.monthNokFmt} />
            </div>

            <div>
              <p className="mb-2 text-[9px] font-medium uppercase tracking-wider text-pia-muted">
                Siste {CHART_DAYS} dager
              </p>
              {hasData ? (
                <div className="flex h-[100px] items-end gap-0.5">
                  {series.map((d) => {
                    const h = Math.max(d.queries > 0 ? 4 : 2, Math.round((d.queries / maxQ) * (CHART_H - 8)));
                    return (
                      <div
                        key={d.day}
                        className="group flex min-w-0 flex-1 flex-col items-center justify-end"
                        title={`${formatDayLabel(d.day)}: ${d.queries} spørringer`}
                      >
                        <div
                          className={
                            d.queries > 0
                              ? "w-full rounded-t-sm bg-gradient-to-t from-pia-coral to-pia-pink/60 transition-opacity group-hover:opacity-90"
                              : "w-full rounded-t-sm bg-pia-surface/50"
                          }
                          style={{ height: h }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-4 text-center text-[11px] text-pia-muted">Ingen aktivitet ennå</p>
              )}
            </div>
          </>
        ) : (
          <p className="py-4 text-center text-xs text-pia-muted">Kunne ikke hente AI-statistikk</p>
        )}
      </div>
    </section>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-pia-bg/50 px-2 py-2.5 text-center">
      <div className="mb-1 flex items-center justify-center text-pia-muted">{icon}</div>
      <p className="text-[8px] font-medium uppercase tracking-wider text-pia-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold tabular-nums text-pia-text">{value}</p>
    </div>
  );
}
