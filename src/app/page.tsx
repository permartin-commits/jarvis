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
  Zap,
} from "lucide-react";

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
  const res = await query<{ total_usd: string }>(
    "SELECT COALESCE(SUM(api_kostnad_usd), 0) AS total_usd FROM ai_logger"
  );
  return Number(res.rows[0]?.total_usd ?? 0) * USD_TO_NOK;
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

          {/* ── Jarvis Core ────────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-5 pt-10 md:pt-14">
            <JarvisOrb />

            {/* JARVIS label */}
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl font-bold tracking-[0.45em] uppercase bg-gradient-to-r from-primary via-primary/60 to-primary bg-clip-text text-transparent">
                PIA
              </h2>
              <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground/60">
                Master OS
              </p>
            </div>

            {/* Greeting */}
            <p className="text-base font-medium text-foreground/75 text-center">
              {timeOfDay} Per Martin, hva vil du gjøre i dag?
            </p>

            {/* Input */}
            <div className="w-full max-w-xl">
              <div className="relative">
                <input
                  type="text"
                  disabled
                  placeholder="Snakk med PIA…"
                  className="w-full rounded-full border border-primary/25 bg-primary/5 px-6 py-3.5 text-sm text-muted-foreground placeholder:text-muted-foreground/40 cursor-not-allowed outline-none ring-0 shadow-inner"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <BrainCircuit className="h-4 w-4 text-primary/30" />
                </div>
              </div>
              <p className="mt-2 text-center text-[10px] text-muted-foreground/50">
                Chat-funksjon under utvikling
              </p>
            </div>
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
              sub={<span className="text-xs text-muted-foreground">{aiCostStr}</span>}
            />
          </div>

        </div>
      </main>
    </div>
  );
}

// ── JarvisOrb ─────────────────────────────────────────────────────────────────

function JarvisOrb() {
  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: 200, height: 200 }}
    >
      {/* Ambient outer glow — primary */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, var(--primary) 0%, transparent 65%)",
          opacity: 0.12,
          filter: "blur(30px)",
        }}
      />
      {/* Ambient secondary glow — deep navy */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 60% 65%, #1e3a8a 0%, transparent 60%)",
          opacity: 0.22,
          filter: "blur(28px)",
        }}
      />

      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        fill="none"
        className="absolute inset-0"
      >
        <defs>
          <radialGradient id="orbFill" cx="38%" cy="32%" r="65%">
            <stop offset="0%"   style={{ stopColor: "var(--primary)", stopOpacity: 0.55 }} />
            <stop offset="100%" style={{ stopColor: "var(--primary)", stopOpacity: 0.04 }} />
          </radialGradient>
          <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="coreBloom" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ring 1 — outermost dotted + 4 tick marks, slow CW (deep navy) */}
        <g>
          <animateTransform attributeName="transform" type="rotate"
            from="0 100 100" to="360 100 100" dur="32s" repeatCount="indefinite" />
          <circle cx="100" cy="100" r="90"
            stroke="#172554" strokeWidth="0.75" strokeDasharray="2 10" opacity="0.55" />
          <line x1="100" y1="4"   x2="100" y2="17"  stroke="#172554" strokeWidth="1.5" opacity="0.7" />
          <line x1="100" y1="183" x2="100" y2="196" stroke="#172554" strokeWidth="1.5" opacity="0.7" />
          <line x1="4"   y1="100" x2="17"  y2="100" stroke="#172554" strokeWidth="1.5" opacity="0.7" />
          <line x1="183" y1="100" x2="196" y2="100" stroke="#172554" strokeWidth="1.5" opacity="0.7" />
        </g>

        {/* Ring 2 — 4 arc segments, CCW (blue-900) */}
        <g>
          <animateTransform attributeName="transform" type="rotate"
            from="0 100 100" to="-360 100 100" dur="18s" repeatCount="indefinite" />
          {/* circ ≈ 465; dasharray 84+32=116, ×4=464 fills the circle evenly */}
          <circle cx="100" cy="100" r="74"
            stroke="#1e3a8a" strokeWidth="1.5" strokeDasharray="84 32" opacity="0.65" filter="url(#softGlow)" />
        </g>

        {/* Ring 3 — small dashes, CW medium (blue-700) */}
        <g>
          <animateTransform attributeName="transform" type="rotate"
            from="0 100 100" to="360 100 100" dur="11s" repeatCount="indefinite" />
          <circle cx="100" cy="100" r="59"
            stroke="#1d4ed8" strokeWidth="0.75" strokeDasharray="6 5" opacity="0.4" />
        </g>

        {/* Ring 4 — solid inner ring, static (blue-600) */}
        <circle cx="100" cy="100" r="47"
          stroke="#2563eb" strokeWidth="1" opacity="0.55" filter="url(#softGlow)" />

        {/* Crosshair */}
        <line x1="64"  y1="100" x2="136" y2="100" style={{ stroke: "var(--primary)" }} strokeWidth="0.5" opacity="0.18" />
        <line x1="100" y1="64"  x2="100" y2="136" style={{ stroke: "var(--primary)" }} strokeWidth="0.5" opacity="0.18" />

        {/* Core fill */}
        <circle cx="100" cy="100" r="47" fill="url(#orbFill)" filter="url(#coreBloom)" />
      </svg>

      {/* Lightning bolt icon — dark/black, clearly visible against the glowing core */}
      <div className="relative z-10 flex items-center justify-center">
        <Zap
          style={{ width: 28, height: 28, color: "#0f172a" }}
          strokeWidth={2.5}
          fill="#0f172a"
        />
      </div>
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
