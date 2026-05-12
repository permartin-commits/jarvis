"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronDown, BrainCircuit, Radar } from "lucide-react";
import type { PortfolioRow, LatestAiLog, WatchlistItem } from "@/lib/portfolio";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EnrichedHolding extends PortfolioRow {
  aiHandling: string | null;
  aiDetaljer: string | null;
  andel: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const handlingColor: Record<string, string> = {
  BUY:     "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  KJØP:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  SELL:    "bg-red-500/15 text-red-400 border-red-500/30",
  SALG:    "bg-red-500/15 text-red-400 border-red-500/30",
  HOLD:    "bg-blue-500/15 text-blue-400 border-blue-500/30",
  ANALYSE: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  ALERT:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
};

function handlingBadgeClass(handling: string | null): string {
  if (!handling) return "bg-slate-500/15 text-slate-400 border-slate-500/30";
  return (
    handlingColor[handling.toUpperCase()] ??
    "bg-slate-500/15 text-slate-400 border-slate-500/30"
  );
}

function fmt(n: number | null, digits = 0): string {
  if (n == null) return "—";
  return n.toLocaleString("nb-NO", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

// ── Holding row ───────────────────────────────────────────────────────────────

function HoldingCard({ h }: { h: EnrichedHolding }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        type="button"
        onClick={() => setExpanded((o) => !o)}
        className="w-full text-left px-4 py-3.5 hover:bg-secondary/30 transition-colors grid gap-x-3 gap-y-1"
        style={{
          gridTemplateColumns:
            "minmax(80px,1fr) minmax(80px,1fr) repeat(4,minmax(60px,1fr)) minmax(100px,1fr) 24px",
          alignItems: "center",
        }}
      >
        {/* Ticker / Selskapsnavn */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-12 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary shrink-0">
            {h.ticker.slice(0, 5)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight truncate">
              {h.ticker}
            </p>
            {h.selskapsnavn && (
              <p className="text-[10px] text-muted-foreground truncate">{h.selskapsnavn}</p>
            )}
          </div>
        </div>

        {/* Investert */}
        <div>
          <p className="text-xs text-muted-foreground">Investert</p>
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {fmt(h.investert)} kr
          </p>
        </div>

        {/* Avkastning — green/red, max 2 dec */}
        <div>
          <p className="text-xs text-muted-foreground">Avkastning</p>
          <p
            className={cn(
              "text-sm font-semibold tabular-nums",
              h.avkastning == null
                ? "text-muted-foreground"
                : h.avkastning > 0
                ? "text-emerald-400"
                : h.avkastning < 0
                ? "text-red-400"
                : "text-muted-foreground"
            )}
          >
            {h.avkastning == null
              ? "—"
              : `${h.avkastning > 0 ? "+" : ""}${fmt(h.avkastning, 2)} %`}
          </p>
        </div>

        {/* Target */}
        <div>
          <p className="text-xs text-muted-foreground">Target</p>
          <p className="text-sm tabular-nums text-foreground">
            {h.target == null ? "—" : `${fmt(h.target, 2)} kr`}
          </p>
        </div>

        {/* Stop Loss */}
        <div>
          <p className="text-xs text-muted-foreground">Stop Loss</p>
          <p className="text-sm tabular-nums text-foreground">
            {h.stop_loss == null ? "—" : `${fmt(h.stop_loss, 2)} kr`}
          </p>
        </div>

        {/* Siste anbefaling */}
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Anbefaling</p>
          {h.aiHandling ? (
            <Badge
              variant="outline"
              className={cn("w-fit text-[10px] border uppercase", handlingBadgeClass(h.aiHandling))}
            >
              {h.aiHandling}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>

        {/* Andel + expand arrow */}
        <div className="flex items-center justify-between gap-1">
          <div>
            <p className="text-xs text-muted-foreground">Andel</p>
            <p className="text-xs tabular-nums text-muted-foreground">
              {h.andel.toFixed(1)} %
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Expanded: AI-analyse */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 bg-secondary/10">
          {h.aiDetaljer ? (
            <div className="rounded-lg border border-border bg-background/50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/70">
                  Siste AI-analyse
                </p>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {h.aiDetaljer}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic py-2">
              Ingen AI-analyse registrert for {h.ticker}.
            </p>
          )}

          <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Antall aksjer</p>
              <p className="font-semibold text-foreground tabular-nums">{fmt(h.antall)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Kjøpskurs</p>
              <p className="font-semibold text-foreground tabular-nums">{fmt(h.kjopskurs, 2)} kr</p>
            </div>
            <div>
              <p className="text-muted-foreground">Siste kurs</p>
              <p className="font-semibold text-foreground tabular-nums">
                {h.siste_kurs != null ? `${fmt(h.siste_kurs, 2)} kr` : "—"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Watchlist item row ────────────────────────────────────────────────────────

function WatchlistRow({ item }: { item: WatchlistItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        type="button"
        onClick={() => setExpanded((o) => !o)}
        className="w-full text-left px-4 py-3 hover:bg-secondary/20 transition-colors flex items-center gap-3"
      >
        {/* Ticker badge */}
        <div className="flex h-6 w-14 items-center justify-center rounded bg-emerald-500/10 text-[10px] font-bold text-emerald-400 shrink-0 ring-1 ring-emerald-500/20">
          {item.ticker.slice(0, 5)}
        </div>

        {/* Name + handling */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-tight truncate">
            {item.selskapsnavn ?? item.ticker}
          </p>
          {item.aiDetaljer && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {item.aiDetaljer.slice(0, 90)}{item.aiDetaljer.length > 90 ? "…" : ""}
            </p>
          )}
        </div>

        {/* Siste kurs */}
        {item.siste_kurs != null && (
          <span className="text-xs tabular-nums text-muted-foreground shrink-0">
            {fmt(item.siste_kurs, 2)} kr
          </span>
        )}

        {/* Recommendation badge */}
        {item.aiHandling && (
          <Badge
            variant="outline"
            className={cn("shrink-0 text-[10px] border uppercase", handlingBadgeClass(item.aiHandling))}
          >
            {item.aiHandling}
          </Badge>
        )}

        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>

      {/* Expanded: full AI analyse */}
      {expanded && item.aiDetaljer && (
        <div className="px-4 pb-3 pt-1 bg-secondary/10">
          <div className="rounded-lg border border-border bg-background/40 p-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-3 w-3 text-emerald-400/70 shrink-0" />
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400/70">
                AI-analyse
              </p>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {item.aiDetaljer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Watchlist section ─────────────────────────────────────────────────────────

function WatchlistSection({ items }: { items: WatchlistItem[] }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10">
          <Radar className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">AI Radar (Watchlist)</h2>
          <p className="text-xs text-muted-foreground">
            Aksjer overvåket av AI med kjøpssignal
          </p>
        </div>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        {items.length === 0 ? (
          /* Empty state */
          <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
            <div className="relative">
              <div className="h-14 w-14 rounded-full bg-emerald-500/5 flex items-center justify-center ring-1 ring-emerald-500/20">
                <Radar className="h-6 w-6 text-emerald-400/40" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400/30 animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground/70">Radaren er tom.</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                AI-en skanner markedet etter nye muligheter.
              </p>
            </div>
          </CardContent>
        ) : (
          <>
            <CardHeader className="pb-2 border-b border-border">
              <CardDescription className="text-xs">
                Klikk på en rad for full analyse · {items.length} kandidat{items.length !== 1 ? "er" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {items.map((item) => (
                <WatchlistRow key={item.ticker} item={item} />
              ))}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function PortefoljeClient({
  holdings,
  aiLogs,
  totalInvestert,
  watchlist,
}: {
  holdings: PortfolioRow[];
  aiLogs: LatestAiLog[];
  totalInvestert: number;
  watchlist: WatchlistItem[];
}) {
  const aiMap = new Map(aiLogs.map((l) => [l.ticker.toUpperCase(), l]));

  const enriched: EnrichedHolding[] = holdings.map((h) => {
    const ai = aiMap.get(h.ticker.toUpperCase());
    return {
      ...h,
      aiHandling: ai?.handling ?? null,
      aiDetaljer: ai?.detaljer ?? null,
      andel: totalInvestert > 0 ? (h.investert / totalInvestert) * 100 : 0,
    };
  });

  return (
    <div className="space-y-8">
      {/* ── Holdings table ──────────────────────────────────────────── */}
      {enriched.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-muted-foreground">
          Ingen posisjoner funnet i tabellen <code className="font-mono">portfolio</code>.
        </p>
      ) : (
        <Card className="bg-card border-border overflow-hidden">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold">Alle posisjoner</CardTitle>
            <CardDescription className="text-xs">
              Klikk på en rad for å se siste AI-analyse · {enriched.length} posisjoner
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Column headers */}
            <div
              className="hidden lg:grid px-4 py-2 border-b border-border/50 bg-secondary/20 gap-x-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
              style={{
                gridTemplateColumns:
                  "minmax(80px,1fr) minmax(80px,1fr) repeat(4,minmax(60px,1fr)) minmax(100px,1fr) 24px",
              }}
            >
              <span>Ticker / Selskap</span>
              <span>Investert</span>
              <span>Avkastning</span>
              <span>Target</span>
              <span>Stop Loss</span>
              <span>Anbefaling</span>
              <span>Andel</span>
              <span />
            </div>

            {enriched.map((h) => (
              <HoldingCard key={h.ticker} h={h} />
            ))}

            {/* Total row */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/20">
              <span className="text-xs font-semibold text-muted-foreground">Totalt investert</span>
              <span className="text-sm font-bold text-foreground tabular-nums">
                {totalInvestert.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── AI Radar / Watchlist ────────────────────────────────────── */}
      <WatchlistSection items={watchlist} />
    </div>
  );
}
