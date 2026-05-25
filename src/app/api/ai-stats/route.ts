import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const USD_TO_NOK = 10.5;

interface DayRow {
  day: string;
  queries: string;
  usd: string;
}

export async function GET() {
  try {
    const [totals, daily] = await Promise.all([
      query<{ ai_calls: string; ai_usd: string; pia_calls: string; pia_usd: string }>(
        `SELECT
           (SELECT COUNT(*)::text FROM ai_logger) AS ai_calls,
           (SELECT COALESCE(SUM(api_kostnad_usd), 0)::text FROM ai_logger) AS ai_usd,
           (SELECT COUNT(*)::text FROM pia_usage_log) AS pia_calls,
           (SELECT COALESCE(SUM(kostnad_usd), 0)::text FROM pia_usage_log) AS pia_usd`
      ),
      query<DayRow>(
        `WITH combined AS (
           SELECT tidspunkt::date AS day, COALESCE(api_kostnad_usd, 0) AS usd
           FROM ai_logger
           WHERE tidspunkt >= NOW() - INTERVAL '90 days'
           UNION ALL
           SELECT tidspunkt::date, COALESCE(kostnad_usd, 0)
           FROM pia_usage_log
           WHERE tidspunkt >= NOW() - INTERVAL '90 days'
         )
         SELECT day::text, COUNT(*)::text AS queries, SUM(usd)::text AS usd
         FROM combined
         GROUP BY day
         ORDER BY day ASC`
      ),
    ]);

    const t = totals.rows[0];
    const totalCalls =
      Number(t?.ai_calls ?? 0) + Number(t?.pia_calls ?? 0);
    const totalUsd =
      Number(t?.ai_usd ?? 0) + Number(t?.pia_usd ?? 0);
    const totalNok = totalUsd * USD_TO_NOK;

    const dailySeries = daily.rows.map((r) => ({
      day: r.day.slice(0, 10),
      queries: Number(r.queries),
      costNok: Number(r.usd) * USD_TO_NOK,
    }));

    const last30Queries = dailySeries
      .filter((d) => {
        const t = new Date(d.day).getTime();
        const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return t >= cutoff;
      })
      .reduce((s, d) => s + d.queries, 0);

    return NextResponse.json({
      totalCalls,
      totalNok,
      totalNokFmt:
        totalNok.toLocaleString("nb-NO", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + " kr",
      last30Queries,
      daily: dailySeries,
    });
  } catch (err) {
    console.error("[ai-stats]", err);
    return NextResponse.json(
      {
        totalCalls: 0,
        totalNok: 0,
        totalNokFmt: "0,00 kr",
        last30Queries: 0,
        daily: [],
        error: err instanceof Error ? err.message : "Feil",
      },
      { status: 500 }
    );
  }
}
