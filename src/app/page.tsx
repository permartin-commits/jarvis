import { Sidebar } from "@/components/sidebar";
import { getPortfolioHoldings, getPortfolioStats } from "@/lib/portfolio";
import { query } from "@/lib/db";
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

// ── Status / handling colour maps ─────────────────────────────────────────────

const mappedStatusColor: Record<string, string> = {
  "i gang":   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  ferdig:     "bg-blue-500/15 text-blue-400 border-blue-500/30",
  planlagt:   "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "på vent":  "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  visjon:     "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  endgame:    "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
};

const mappedStatusLabel: Record<string, string> = {
  "i gang":  "Aktiv",
  ferdig:    "Fullført",
  planlagt:  "Idé",
  "på vent": "Pause",
  visjon:    "Visjon",
  endgame:   "Endgame",
};

const handlingColor: Record<string, string> = {
  buy:      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  kjøp:     "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  sell:     "bg-red-500/15 text-red-400 border-red-500/30",
  salg:     "bg-red-500/15 text-red-400 border-red-500/30",
  hold:     "bg-blue-500/15 text-blue-400 border-blue-500/30",
  analyse:  "bg-purple-500/15 text-purple-400 border-purple-500/30",
  alert:    "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
};

function handlingBadgeClass(handling: string | null): string {
  if (!handling) return "bg-slate-500/15 text-slate-400 border-slate-500/30";
  return handlingColor[handling.toLowerCase()] ?? "bg-slate-500/15 text-slate-400 border-slate-500/30";
}

function statusBadgeClass(status: string | null): string {
  if (!status) return "bg-slate-500/15 text-slate-400 border-slate-500/30";
  return mappedStatusColor[status.toLowerCase()] ?? "bg-slate-500/15 text-slate-400 border-slate-500/30";
}

function statusBadgeLabel(status: string | null): string {
  if (!status) return "—";
  return mappedStatusLabel[status.toLowerCase()] ?? status;
}

// ── Data fetchers ─────────────────────────────────────────────────────────────

interface ProjectCounts { active: number; total: number }
interface RecentProject { oppgave: string | null; kategori: string | null; status: string | null; fase: string | null }
interface AiLogItem { id: number; ticker: string | null; handling: string | null; detaljer: string | null }

async function getProjectCounts(): Promise<ProjectCounts> {
  const [totalRes, activeRes] = await Promise.all([
    query<{ count: string }>("SELECT COUNT(*) AS count FROM masterplan"),
    query<{ count: string }>("SELECT COUNT(*) AS count FROM masterplan WHERE status = 'I gang'"),
  ]);
  return {
    total: Number(totalRes.rows[0]?.count ?? 0),
    active: Number(activeRes.rows[0]?.count ?? 0),
  };
}

async function getRecentProjects(): Promise<RecentProject[]> {
  const res = await query<RecentProject>(
    `SELECT oppgave, kategori, status, fase
     FROM masterplan
     WHERE status = 'I gang' OR status = 'Aktiv'
     LIMIT 3`
  );
  return res.rows;
}

async function getAiLogCount(): Promise<number> {
  const res = await query<{ count: string }>("SELECT COUNT(*) AS count FROM ai_logger");
  return Number(res.rows[0]?.count ?? 0);
}

async function getRecentAiLogs(): Promise<AiLogItem[]> {
  const res = await query<AiLogItem>(
    `SELECT id, ticker, handling, detaljer
     FROM ai_logger
     ORDER BY id DESC
     LIMIT 3`
  );
  return res.rows;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function Home() {
  // Portfolio — fail gracefully
  let portfolioStats = { totalInvestert: 0, antallPosisjoner: 0 };
  let topHoldings: { ticker: string; investert: number; andel: number }[] = [];
  let dbError: string | null = null;

  // Live data — run all in parallel
  const [projectCounts, recentProjects, aiLogCount, recentAiLogs] =
    await Promise.all([
      getProjectCounts().catch(() => ({ active: 0, total: 0 })),
      getRecentProjects().catch(() => [] as RecentProject[]),
      getAiLogCount().catch(() => 0),
      getRecentAiLogs().catch(() => [] as AiLogItem[]),
    ]);

  try {
    const [stats, holdings] = await Promise.all([
      getPortfolioStats(),
      getPortfolioHoldings(),
    ]);
    portfolioStats = stats;
    topHoldings = holdings.slice(0, 4).map((h) => ({
      ticker: h.ticker,
      investert: h.investert,
      andel: stats.totalInvestert > 0 ? (h.investert / stats.totalInvestert) * 100 : 0,
    }));
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Ukjent databasefeil";
  }

  const timeOfDay = () => {
    const h = new Date().getHours();
    if (h < 6)  return "God natt";
    if (h < 12) return "God morgen";
    if (h < 18) return "God dag";
    return "God kveld";
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm px-4 md:px-8 py-4">
          <h1 className="text-lg font-semibold text-foreground">Oversikt</h1>
          <p className="text-xs text-muted-foreground">
            {timeOfDay()} — her er en snapshot av alt viktig.
          </p>
        </div>

        <div className="px-4 md:px-8 py-4 md:py-6 space-y-8">
          {/* DB error banner */}
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
                  : `${portfolioStats.totalInvestert.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr`
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
              value={String(projectCounts.active)}
              sub={
                <span className="text-xs text-muted-foreground">
                  av {projectCounts.total} totalt
                </span>
              }
            />
            <StatCard
              icon={<BrainCircuit className="h-4 w-4" />}
              label="AI-analyser totalt"
              value={aiLogCount.toLocaleString("nb-NO")}
              sub={
                <span className="text-xs text-muted-foreground">
                  alle kall fra Speideren
                </span>
              }
            />
            <StatCard
              icon={<Activity className="h-4 w-4" />}
              label="Masterplan-oppgaver"
              value={String(projectCounts.total)}
              sub={
                <span className="text-xs text-muted-foreground">
                  {projectCounts.active} i gang
                </span>
              }
            />
          </div>

          {/* Main content grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top holdings — live */}
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
                        <p className="text-sm font-medium text-foreground">{h.ticker}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          {h.investert.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr
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

            {/* Recent projects — live */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-primary" />
                  Siste prosjekter
                </CardTitle>
                <CardDescription className="text-xs">
                  Aktive oppgaver fra masterplan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {recentProjects.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Ingen aktive prosjekter funnet.
                  </p>
                ) : (
                  recentProjects.map((p, i) => (
                    <div
                      key={i}
                      className="rounded-md px-3 py-2.5 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {p.oppgave ?? "—"}
                          </p>
                          {p.kategori && (
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                              {p.kategori}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("shrink-0 text-[10px] border", statusBadgeClass(p.status))}
                        >
                          {statusBadgeLabel(p.status)}
                        </Badge>
                      </div>
                      {p.fase && (
                        <p className="mt-1 text-[10px] text-muted-foreground">{p.fase}</p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent AI logs — live */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-primary" />
                Siste AI-kall
              </CardTitle>
              <CardDescription className="text-xs">
                Nyligste analyser fra Speideren
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentAiLogs.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Ingen AI-kall funnet.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {recentAiLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 mt-0.5 text-[10px] uppercase border",
                          handlingBadgeClass(log.handling)
                        )}
                      >
                        {log.handling ?? "—"}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary">
                          {log.ticker ?? "—"}
                        </p>
                        {log.detaljer && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {log.detaljer}
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                        #{log.id}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

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
