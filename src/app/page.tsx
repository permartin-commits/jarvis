import { Sidebar } from "@/components/sidebar";
import { mockProjects, mockAiLogs } from "@/lib/mock-data";
import { getPortfolioHoldings, getPortfolioStats } from "@/lib/portfolio";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  FolderKanban,
  BrainCircuit,
  Coins,
  Activity,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusColor: Record<string, string> = {
  aktiv: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pause: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  fullført: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  idé: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

const logLevelColor: Record<string, string> = {
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  info: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  warning: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  error: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default async function Home() {
  // Portfolio: live DB — fail gracefully
  let portfolioStats = { totalInvestert: 0, antallPosisjoner: 0 };
  let topHoldings: { ticker: string; investert: number; andel: number }[] = [];
  let dbError: string | null = null;

  try {
    const [stats, holdings] = await Promise.all([
      getPortfolioStats(),
      getPortfolioHoldings(),
    ]);
    portfolioStats = stats;
    topHoldings = holdings.slice(0, 4).map((h) => ({
      ticker: h.ticker,
      investert: h.investert,
      andel:
        stats.totalInvestert > 0
          ? (h.investert / stats.totalInvestert) * 100
          : 0,
    }));
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Ukjent databasefeil";
  }

  // Mock-data for the rest (prosjekter + AI-logger er ikke i DB ennå)
  const recentProjects = mockProjects.slice(0, 3);
  const recentLogs = mockAiLogs.slice(0, 4);
  const activeProjectCount = mockProjects.filter((p) => p.status === "aktiv").length;

  const timeOfDay = () => {
    const h = new Date().getHours();
    if (h < 6) return "God natt";
    if (h < 12) return "God morgen";
    if (h < 18) return "God dag";
    return "God kveld";
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm px-8 py-4">
          <h1 className="text-lg font-semibold text-foreground">Oversikt</h1>
          <p className="text-xs text-muted-foreground">
            {timeOfDay()} — her er en snapshot av alt viktig.
          </p>
        </div>

        <div className="px-8 py-6 space-y-8">
          {/* DB-feilmelding */}
          {dbError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Portefølje: databasefeil</p>
                <p className="mt-0.5 text-xs opacity-80">{dbError}</p>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={<Coins className="h-4 w-4" />}
              label="Total investert"
              value={
                dbError
                  ? "—"
                  : `${portfolioStats.totalInvestert.toLocaleString("nb-NO", {
                      maximumFractionDigits: 0,
                    })} kr`
              }
              sub={
                dbError ? (
                  <span className="text-xs text-red-400">DB utilgjengelig</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {portfolioStats.antallPosisjoner} posisjoner
                  </span>
                )
              }
            />
            <StatCard
              icon={<FolderKanban className="h-4 w-4" />}
              label="Aktive prosjekter"
              value={String(activeProjectCount)}
              sub={
                <span className="text-xs text-muted-foreground">
                  av {mockProjects.length} totalt
                </span>
              }
            />
            <StatCard
              icon={<BrainCircuit className="h-4 w-4" />}
              label="AI-kall denne uken"
              value="28"
              sub={
                <span className="text-xs text-muted-foreground">
                  siste 7 dager
                </span>
              }
            />
            <StatCard
              icon={<Activity className="h-4 w-4" />}
              label="Tokens denne uken"
              value="42 800"
              sub={
                <span className="text-xs text-muted-foreground">inn + ut</span>
              }
            />
          </div>

          {/* Main content grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top holdings — live DB */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Topp posisjoner
                </CardTitle>
                <CardDescription className="text-xs">
                  Sortert etter investert beløp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {dbError ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Kunne ikke hente data fra databasen.
                  </p>
                ) : topHoldings.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Ingen posisjoner funnet.
                  </p>
                ) : (
                  topHoldings.map((h) => (
                    <div
                      key={h.ticker}
                      className="flex items-center justify-between rounded-md px-3 py-2.5 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-10 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                          {h.ticker.slice(0, 4)}
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {h.ticker}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          {h.investert.toLocaleString("nb-NO", {
                            maximumFractionDigits: 0,
                          })}{" "}
                          kr
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {h.andel.toFixed(1)} % av portefølje
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recent projects — mock */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-primary" />
                  Siste prosjekter
                </CardTitle>
                <CardDescription className="text-xs">
                  Nylig oppdaterte (mock)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentProjects.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-md px-3 py-2.5 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {p.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                          {p.description}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 text-[10px] border",
                          statusColor[p.status]
                        )}
                      >
                        {p.status}
                      </Badge>
                    </div>
                    <div className="mt-2 h-1 w-full rounded-full bg-border">
                      <div
                        className="h-1 rounded-full bg-primary transition-all"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {p.progress}% fullført · {p.updatedAt}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent AI logs — mock */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-primary" />
                Siste AI-kall
              </CardTitle>
              <CardDescription className="text-xs">
                Nyligste forespørsler til språkmodeller (mock)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 mt-0.5 text-[10px] border",
                        logLevelColor[log.level]
                      )}
                    >
                      {log.level}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-1">
                        {log.prompt}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {log.model} · {log.tokensIn + log.tokensOut} tokens ·{" "}
                        {log.durationMs}ms
                      </p>
                    </div>
                    <p className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                      {new Date(log.timestamp).toLocaleDateString("nb-NO", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: React.ReactNode;
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
        <div className="mt-1">{sub}</div>
      </CardContent>
    </Card>
  );
}
