import { DashboardFrame } from "@/components/DashboardFrame";
import { PiaCoreSection } from "@/components/PiaCoreSection";
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
import { DagsrapporterPanel } from "./DagsrapporterPanel";
import { InvestmentOverview } from "@/components/InvestmentOverview";

export default async function PortefoljePage() {
  const holdings    = await getPortfolioHoldings().catch(() => []);
  const stats       = await getPortfolioStats().catch(() => ({
    totalInvestert: 0,
    antallPosisjoner: 0,
    totalAvkastningNok: null as number | null,
    totalAvkastningPct: null as number | null,
  }));
  const aiLogs      = await getLatestAiLogPerTicker().catch(() => []);
  const watchlist   = await getWatchlistItems().catch(() => []);
  const dbError: string | null = null;

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
    <DashboardFrame>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-zinc-950 pt-14 md:pt-0">
        <div className="flex h-full overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
            <div className="flex flex-col items-center gap-3 border-b border-zinc-800 bg-zinc-950 px-4 py-6 lg:hidden">
              <PiaCoreSection compact embedded />
              <DagsrapporterPanel />
            </div>

            <div className="space-y-6 px-4 py-6 md:px-8">
              <div className="mb-2 border-b border-zinc-800 pb-4">
                <h1 className="text-lg font-bold tracking-tight text-zinc-100">
                  Portefølje
                </h1>
                <p className="text-xs text-zinc-500">
                  Posisjoner, avkastning og AI-radar
                </p>
              </div>

              {dbError && (
                <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Kunne ikke koble til databasen</p>
                    <p className="mt-0.5 text-xs opacity-80">{dbError}</p>
                  </div>
                </div>
              )}

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
                  value={holdings[0] ? `${holdings[0].ticker}` : "—"}
                  sub={
                    holdings[0]
                      ? `${holdings[0].investert.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr`
                      : undefined
                  }
                  icon={<TrendingUp className="h-4 w-4" />}
                />
              </div>

              <InvestmentOverview />

              {!dbError && (
                <PortefoljeClient
                  holdings={holdings}
                  aiLogs={aiLogs}
                  totalInvestert={stats.totalInvestert}
                  watchlist={watchlist}
                />
              )}

              <div className="h-6" />
            </div>
          </div>

          <div className="hidden w-72 shrink-0 flex-col items-center gap-4 overflow-y-auto border-l border-zinc-800 bg-zinc-950 px-4 py-8 lg:flex xl:w-80">
            <PiaCoreSection compact embedded />
            <DagsrapporterPanel />
          </div>
        </div>
      </main>
    </DashboardFrame>
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
    <Card className="border-zinc-800 bg-zinc-900/40">
      <CardContent className="px-5 pb-4 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-500">{label}</p>
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10 text-violet-400">
            {icon}
          </div>
        </div>
        <p className={cn("text-2xl font-bold", valueClass ?? "text-zinc-100")}>{value}</p>
        {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
      </CardContent>
    </Card>
  );
}
