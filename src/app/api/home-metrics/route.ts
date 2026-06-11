import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getPortfolioStats } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

const USD_TO_NOK = 10.5;

async function scalar(sql: string): Promise<number> {
  try {
    const result = await query<{ v: string }>(sql);
    return Number(result.rows[0]?.v ?? 0);
  } catch {
    return 0;
  }
}

function fmtNok(n: number, decimals = 0) {
  return (
    n.toLocaleString("nb-NO", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + " kr"
  );
}

function fmtAvkastning(nok: number | null, pct: number | null) {
  if (nok == null && pct == null) return "—";
  const parts: string[] = [];
  if (nok != null) {
    const sign = nok > 0 ? "+" : "";
    parts.push(`${sign}${nok.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr`);
  }
  if (pct != null) {
    const sign = pct > 0 ? "+" : "";
    parts.push(`${sign}${pct.toLocaleString("nb-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`);
  }
  return parts.join(" · ");
}

export async function GET() {
  try {
    const [usageRow, revenuePaid, portfolio, qdrantRow] = await Promise.all([
      query<{ calls: string; total_usd: string; total_tokens: string }>(
        `SELECT
           COUNT(*)                        AS calls,
           COALESCE(SUM(kostnad_usd), 0)   AS total_usd,
           COALESCE(SUM(total_tokens), 0)  AS total_tokens
         FROM pia_usage_log`
      ).then((r) => r.rows[0]),
      scalar(
        `SELECT COALESCE(SUM(amount_nok), 0)::text AS v FROM bookings WHERE payment_status = 'paid'`
      ),
      getPortfolioStats(),
      query<{ points_count: string | number | null }>(
        `SELECT points_count FROM qdrant_status WHERE id = 1 LIMIT 1`
      ).then((r) => r.rows[0]),
    ]);

    const totalUsd = Number(usageRow?.total_usd ?? 0);
    const costNok = totalUsd * USD_TO_NOK;
    const totalTokens = Number(usageRow?.total_tokens ?? 0);
    const calls = Number(usageRow?.calls ?? 0);

    const tokensFmt =
      totalTokens >= 1_000_000
        ? `${(totalTokens / 1_000_000).toFixed(1)}M`
        : totalTokens >= 1_000
          ? `${(totalTokens / 1_000).toFixed(1)}k`
          : String(totalTokens);

    const memoryCount =
      qdrantRow?.points_count != null ? Number(qdrantRow.points_count) : null;

    return NextResponse.json({
      calls,
      totalTokens,
      tokensFmt,
      costNokFmt: fmtNok(costNok, 2),
      revenueFmt: fmtNok(revenuePaid),
      avkastningFmt: fmtAvkastning(
        portfolio.totalAvkastningNok,
        portfolio.totalAvkastningPct
      ),
      avkastningNok: portfolio.totalAvkastningNok,
      avkastningPct: portfolio.totalAvkastningPct,
      memoryCount,
      memoryFmt:
        memoryCount != null && Number.isFinite(memoryCount)
          ? memoryCount.toLocaleString("nb-NO")
          : "—",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ukjent feil";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
