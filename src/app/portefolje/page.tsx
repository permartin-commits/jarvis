import { Sidebar } from "@/components/sidebar";
import { getPortfolioHoldings, getPortfolioStats, type PortfolioRow } from "@/lib/portfolio";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Coins, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function PortefoljePage() {
  let holdings: PortfolioRow[] = [];
  let stats = { totalInvestert: 0, antallPosisjoner: 0 };
  let dbError: string | null = null;

  try {
    [holdings, stats] = await Promise.all([
      getPortfolioHoldings(),
      getPortfolioStats(),
    ]);
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Ukjent databasefeil";
  }

  const topInvestert = holdings[0]?.investert ?? 0;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm px-8 py-4">
          <h1 className="text-lg font-semibold text-foreground">Portefølje</h1>
          <p className="text-xs text-muted-foreground">
            Aksjer og investeringer — live fra PostgreSQL
          </p>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* DB-feil */}
          {dbError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Kunne ikke koble til databasen</p>
                <p className="mt-0.5 text-xs opacity-80">{dbError}</p>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <SummaryCard
              label="Total investert"
              value={`${stats.totalInvestert.toLocaleString("nb-NO", {
                maximumFractionDigits: 0,
              })} kr`}
              icon={<Coins className="h-4 w-4" />}
            />
            <SummaryCard
              label="Antall posisjoner"
              value={String(stats.antallPosisjoner)}
              icon={<Coins className="h-4 w-4" />}
            />
            <SummaryCard
              label="Største posisjon"
              value={
                holdings[0]
                  ? `${holdings[0].ticker} — ${topInvestert.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr`
                  : "—"
              }
              icon={<Coins className="h-4 w-4" />}
            />
          </div>

          {/* Holdings table */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Alle posisjoner
              </CardTitle>
              <CardDescription className="text-xs">
                Sortert etter investert beløp (størst øverst)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {holdings.length === 0 && !dbError ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Ingen posisjoner funnet i tabellen <code className="font-mono">portfolio</code>.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {["Ticker", "Antall", "Kjøpskurs", "Investert beløp", "Andel"].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map((h) => (
                        <HoldingRow
                          key={h.ticker}
                          holding={h}
                          totalInvestert={stats.totalInvestert}
                        />
                      ))}
                    </tbody>
                    {holdings.length > 0 && (
                      <tfoot>
                        <tr className="border-t border-border bg-secondary/20">
                          <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                            Totalt
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-foreground tabular-nums">
                            {stats.totalInvestert.toLocaleString("nb-NO", {
                              maximumFractionDigits: 0,
                            })}{" "}
                            kr
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">100 %</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Andelsfordeling */}
          {holdings.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Andelsfordeling
                </CardTitle>
                <CardDescription className="text-xs">
                  Basert på investert beløp per ticker
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AndelsFordelingChart
                  holdings={holdings}
                  totalInvestert={stats.totalInvestert}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

function HoldingRow({
  holding: h,
  totalInvestert,
}: {
  holding: PortfolioRow;
  totalInvestert: number;
}) {
  const andel = totalInvestert > 0 ? (h.investert / totalInvestert) * 100 : 0;

  return (
    <tr className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex h-7 w-14 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
          {h.ticker}
        </div>
      </td>
      <td className="px-4 py-3 tabular-nums text-muted-foreground">
        {h.antall.toLocaleString("nb-NO")}
      </td>
      <td className="px-4 py-3 tabular-nums text-muted-foreground">
        {h.kjopskurs.toLocaleString("nb-NO", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        kr
      </td>
      <td className="px-4 py-3 tabular-nums font-semibold text-foreground">
        {h.investert.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 rounded-full bg-border">
            <div
              className="h-1.5 rounded-full bg-primary transition-all"
              style={{ width: `${andel}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {andel.toFixed(1)} %
          </span>
        </div>
      </td>
    </tr>
  );
}

function AndelsFordelingChart({
  holdings,
  totalInvestert,
}: {
  holdings: PortfolioRow[];
  totalInvestert: number;
}) {
  const barColors = [
    "bg-primary",
    "bg-emerald-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-orange-500",
    "bg-teal-500",
  ];

  return (
    <div className="space-y-3">
      {holdings.map((h, i) => {
        const pct = totalInvestert > 0 ? (h.investert / totalInvestert) * 100 : 0;
        return (
          <div key={h.ticker} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-foreground">{h.ticker}</span>
              <span className="tabular-nums text-muted-foreground">
                {h.investert.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr &middot;{" "}
                {pct.toFixed(1)} %
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-border">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  barColors[i % barColors.length]
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
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
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
