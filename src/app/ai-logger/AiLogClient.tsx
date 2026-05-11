"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export interface AiLogRow {
  id: number | string;
  ticker: string | null;
  handling: string | null;
  detaljer: string | null;
}

const handlingColor: Record<string, string> = {
  BUY: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  SELL: "bg-red-500/15 text-red-400 border-red-500/30",
  HOLD: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  ANALYSE: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  ALERT: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  INFO: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

function handlingBadgeClass(handling: string | null): string {
  if (!handling) return "bg-slate-500/15 text-slate-400 border-slate-500/30";
  return (
    handlingColor[handling.toUpperCase()] ??
    "bg-slate-500/15 text-slate-400 border-slate-500/30"
  );
}


export function AiLogClient({ logs }: { logs: AiLogRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) => l.ticker?.toLowerCase().includes(q));
  }, [logs, search]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-semibold">
              Alle loggoppføringer
            </CardTitle>
            <CardDescription className="text-xs">
              Nyeste øverst · {filtered.length} av {logs.length} rader
            </CardDescription>
          </div>

          {/* Search */}
          <div className="relative w-48 shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Søk på ticker…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5",
                "text-xs text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-1 focus:ring-primary/50"
              )}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">
            Ingen oppføringer funnet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((log) => (
              <div
                key={log.id}
                className="px-6 py-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Handling badge */}
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 mt-0.5 text-[10px] uppercase border",
                      handlingBadgeClass(log.handling)
                    )}
                  >
                    {log.handling ?? "—"}
                  </Badge>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {log.ticker && (
                        <span className="text-sm font-semibold text-primary">
                          {log.ticker}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        #{log.id}
                      </span>
                    </div>
                    {log.detaljer && (
                      <p className="text-sm text-foreground/80 leading-snug">
                        {log.detaljer}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
