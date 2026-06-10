"use client";

import { useCallback, useEffect, useState } from "react";
import { History, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { HistoriskAvkastningRow } from "@/lib/historisk-avkastning";

function formatGevinst(nok: number): string {
  const sign = nok > 0 ? "+" : "";
  return `${sign}${nok.toLocaleString("nb-NO", {
    maximumFractionDigits: 0,
  })} kr`;
}

function formatSisteHandel(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("nb-NO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function loadRows(): Promise<HistoriskAvkastningRow[]> {
  return fetch("/api/historisk-avkastning", { cache: "no-store" })
    .then((r) => r.json())
    .then((d) => (d.rows as HistoriskAvkastningRow[]) ?? [])
    .catch(() => []);
}

export function InvestmentOverview() {
  const [rows, setRows] = useState<HistoriskAvkastningRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    loadRows()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <Card className="overflow-hidden border-zinc-800 bg-zinc-900/40">
      <CardHeader className="border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 ring-1 ring-violet-500/25">
            <History className="h-4 w-4 text-violet-400" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm font-semibold text-zinc-100">
              Historisk avkastning
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Realisert gevinst per ticker fra transaksjoner
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin text-violet-400/70" />
            Henter historikk…
          </div>
        ) : rows.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-zinc-500">
            Ingen historiske handler i{" "}
            <code className="font-mono text-xs">historisk_avkastning</code>{" "}
            ennå.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex min-w-[640px] items-center gap-3 border-b border-zinc-800 bg-zinc-900/60 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
              <span className="w-16 shrink-0">Ticker</span>
              <span className="min-w-0 flex-1">Selskapsnavn</span>
              <span className="w-32 shrink-0 text-right">
                Total realisert gevinst
              </span>
              <span className="w-20 shrink-0 text-right">Antall trades</span>
              <span className="w-36 shrink-0 text-right">Siste handel</span>
            </div>

            <div className="divide-y divide-zinc-800/70">
              {rows.map((row) => (
                <div
                  key={row.ticker}
                  className="flex min-w-[640px] items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-800/40"
                >
                  <span className="w-16 shrink-0 font-mono text-xs font-bold text-violet-400">
                    {row.ticker}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
                    {row.selskapsnavn ?? "—"}
                  </span>
                  <span
                    className={cn(
                      "w-32 shrink-0 text-right text-sm font-semibold tabular-nums",
                      row.totalGevinst > 0
                        ? "text-emerald-400"
                        : row.totalGevinst < 0
                        ? "text-red-400"
                        : "text-zinc-500"
                    )}
                  >
                    {formatGevinst(row.totalGevinst)}
                  </span>
                  <span className="w-20 shrink-0 text-right text-sm tabular-nums text-zinc-200">
                    {row.antallTrades.toLocaleString("nb-NO")}
                  </span>
                  <span className="w-36 shrink-0 text-right text-[11px] tabular-nums text-zinc-500">
                    {formatSisteHandel(row.sisteHandel)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
