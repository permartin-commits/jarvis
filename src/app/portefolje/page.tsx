import { Sidebar } from "@/components/sidebar";
import {
  getPortfolioHoldings,
  getPortfolioStats,
  getLatestAiLogPerTicker,
  getWatchlistItems,
} from "@/lib/portfolio";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PortefoljeClient } from "./PortefoljeClient";

export default async function PortefoljePage() {
  let holdings    = await getPortfolioHoldings().catch(() => []);
  let stats       = await getPortfolioStats().catch(() => ({
    totalInvestert: 0,
    antallPosisjoner: 0,
    totalAvkastningNok: null as number | null,
    totalAvkastningPct: null as number | null,
  }));
  let aiLogs      = await getLatestAiLogPerTicker().catch(() => []);
  let watchlist   = await getWatchlistItems().catch(() => []);
  let dbError: string | null = null;

  // If all returned empty and holdings threw, surface the error
  if (holdings.length === 0 && stats.totalInvestert === 0) {
    try {
      await getPortfolioHoldings();
    } catch (err) {
      dbError = err instanceof Error ? err.message : "Ukjent databasefeil";
    }
  }

  // Avkastning KPI formatting
  const avkStr = (() => {
    if (stats.totalAvkastningPct == null) return null;
    const pct = stats.totalAvkastningPct;
    const sign = pct > 0 ? "+" : "";
    return `${sign}${pct.toLocaleString("nb-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
  })();

  const avkNokStr = (() => {
    if (stats.totalAvkastningNok == null) return null;
    const n = stats.totalAvkastningNok;
    const sign = n > 0 ? "+" : "";
    return `${sign}${n.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr`;
  })();

  const avkPositive = (stats.totalAvkastningPct ?? 0) > 0;
  const avkNegative = (stats.totalAvkastningPct ?? 0) < 0;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background pt-14 md:pt-0">
        <div className="sticky top-14 md:top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm px-4 md:px-8 py-4">
          <h1 className="text-lg font-semibold text-foreground">Portefølje</h1>
          <p className="text-xs text-muted-foreground">
            Aksjer og investeringer — live fra PostgreSQL
          </p>
        </div>

        <div className="px-4 md:px-8 py-6 space-y-6">
          {dbError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Kunne ikke koble til databasen</p>
                <p className="mt-0.5 text-xs opacity-80">{dbError}</p>
              </div>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <SummaryCard
              label="Total investert"
              value={`${stats.totalInvestert.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr`}
              icon={<Coins className="h-4 w-4" />}
            />
            <SummaryCard
              label="Total avkastning"
              value={avkStr ?? "—"}
              valueClass={
                avkStr == null
                  ? undefined
                  : avkPositive
                  ? "text-emerald-400"
                  : avkNegative
                  ? "text-red-400"
                  : undefined
              }
              sub={avkNokStr ?? "Mangler siste_kurs"}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <SummaryCard
              label="Største posisjon"
              value={
                holdings[0]
                  ? `${holdings[0].ticker}`
                  : "—"
              }
              sub={
                holdings[0]
                  ? `${holdings[0].investert.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr`
                  : undefined
              }
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>

          {/* Holdings + Watchlist */}
          {!dbError && (
            <PortefoljeClient
              holdings={holdings}
              aiLogs={aiLogs}
              totalInvestert={stats.totalInvestert}
              watchlist={watchlist}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  valueClass,
  sub,
  icon,
}: {
  label: string;
  value: string;
  valueClass?: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
        <p className={cn("text-2xl font-bold", valueClass ?? "text-foreground")}>{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
