import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";
import { getPortfolioStats } from "@/lib/portfolio";
import { query } from "@/lib/db";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Coins,
  TrendingUp,
  FolderKanban,
  BrainCircuit,
  AlertCircle,
} from "lucide-react";
import { PiaCoreSection } from "@/components/PiaCoreSection";
import { LiveCostSub } from "@/components/LiveCostSub";

// ── Data fetchers ─────────────────────────────────────────────────────────────

async function getActiveProjectCount(): Promise<number> {
  const res = await query<{ count: string }>(
    "SELECT COUNT(*) AS count FROM masterplan WHERE status = 'I gang'"
  );
  return Number(res.rows[0]?.count ?? 0);
}

async function getTotalProjectCount(): Promise<number> {
  const res = await query<{ count: string }>(
    "SELECT COUNT(*) AS count FROM masterplan"
  );
  return Number(res.rows[0]?.count ?? 0);
}

async function getAiLogCount(): Promise<number> {
  const res = await query<{ count: string }>(
    "SELECT COUNT(*) AS count FROM ai_logger"
  );
  return Number(res.rows[0]?.count ?? 0);
}

async function getAiCostNok(): Promise<number> {
  const USD_TO_NOK = 10.5;
  const [ai, pia] = await Promise.all([
    query<{ total_usd: string }>(
      "SELECT COALESCE(SUM(api_kostnad_usd), 0) AS total_usd FROM ai_logger"
    ).then((r) => Number(r.rows[0]?.total_usd ?? 0)).catch(() => 0),
    query<{ total_usd: string }>(
      `SELECT COALESCE(SUM(kostnad_usd), 0) AS total_usd FROM "Pia_usage_log"`
    ).then((r) => Number(r.rows[0]?.total_usd ?? 0)).catch(() => 0),
  ]);
  return (ai + pia) * USD_TO_NOK;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function Home() {
  let totalInvestert = 0;
  let totalAvkastningPct: number | null = null;
  let totalAvkastningNok: number | null = null;
  let dbError: string | null = null;

  const [activeProjects, totalProjects, aiLogCount, aiCostNok] = await Promise.all([
    getActiveProjectCount().catch(() => 0),
    getTotalProjectCount().catch(() => 0),
    getAiLogCount().catch(() => 0),
    getAiCostNok().catch(() => 0),
  ]);

  try {
    const stats = await getPortfolioStats();
    totalInvestert     = stats.totalInvestert;
    totalAvkastningPct = stats.totalAvkastningPct;
    totalAvkastningNok = stats.totalAvkastningNok;
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Ukjent databasefeil";
  }

  const avkStr = totalAvkastningPct == null
    ? "—"
    : `${totalAvkastningPct > 0 ? "+" : ""}${totalAvkastningPct.toLocaleString("nb-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;

  const avkNokStr = totalAvkastningNok == null
    ? null
    : `${totalAvkastningNok > 0 ? "+" : ""}${totalAvkastningNok.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr`;

  const aiCostStr = aiCostNok.toLocaleString("nb-NO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " kr";

  const timeOfDay = (() => {
    const h = new Date().getHours();
    if (h < 6)  return "God natt";
    if (h < 12) return "God morgen";
    if (h < 18) return "God dag";
    return "God kveld";
  })();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto bg-background pt-14 md:pt-0">
        <div className="px-4 md:px-8 py-8 md:py-10 space-y-8">

          {/* ── PIA Core (orb + speech + chat) ─────────────────────── */}
          <div className="flex flex-col items-center gap-5 pt-10 md:pt-14">
            <PiaCoreSection greeting={timeOfDay} />
          </div>

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

          {/* ── 4 KPI Cards ────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={<Coins className="h-4 w-4" />}
              label="Total Investert"
              value={
                dbError
                  ? "—"
                  : `${totalInvestert.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr`
              }
              sub={
                dbError
                  ? <span className="text-xs text-red-400">DB utilgjengelig</span>
                  : <span className="text-xs text-muted-foreground">Fra portefølje</span>
              }
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Avkastning"
              value={avkStr}
              valueClass={
                totalAvkastningPct == null
                  ? undefined
                  : totalAvkastningPct > 0
                  ? "text-emerald-400"
                  : totalAvkastningPct < 0
                  ? "text-red-400"
                  : undefined
              }
              sub={
                avkNokStr == null
                  ? <span className="text-xs text-muted-foreground">Mangler siste_kurs</span>
                  : <span className={cn("text-xs tabular-nums", totalAvkastningNok! > 0 ? "text-emerald-400" : totalAvkastningNok! < 0 ? "text-red-400" : "text-muted-foreground")}>{avkNokStr}</span>
              }
            />
            <StatCard
              icon={<FolderKanban className="h-4 w-4" />}
              label="Aktive Prosjekter"
              value={`${activeProjects} / ${totalProjects}`}
              sub={<span className="text-xs text-muted-foreground">Status «I gang»</span>}
            />
            <StatCard
              icon={<BrainCircuit className="h-4 w-4" />}
              label="AI-analyser Totalt"
              value={aiLogCount.toLocaleString("nb-NO")}
              sub={<LiveCostSub initial={aiCostStr} />}
            />
          </div>

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
  valueClass,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
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
        <p className={cn("text-2xl font-bold", valueClass ?? "text-foreground")}>{value}</p>
        <div className="mt-1">{sub}</div>
      </CardContent>
    </Card>
  );
}
