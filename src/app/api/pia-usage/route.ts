import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const USD_TO_NOK = 10.5;

export async function GET() {
  try {
    const [summary, rows] = await Promise.all([
      query<{ calls: string; total_usd: string; total_tokens: string }>(
        `SELECT
           COUNT(*)                        AS calls,
           COALESCE(SUM(kostnad_usd), 0)   AS total_usd,
           COALESCE(SUM(total_tokens), 0)  AS total_tokens
         FROM pia_usage_log`
      ),
      query(
        `SELECT execution_id, total_tokens, kostnad_usd, tidspunkt
         FROM pia_usage_log
         ORDER BY tidspunkt DESC
         LIMIT 50`
      ),
    ]);

    const s       = summary.rows[0];
    const totalUsd = Number(s.total_usd);
    const costNok  = totalUsd * USD_TO_NOK;

    return NextResponse.json({
      calls:       Number(s.calls),
      totalTokens: Number(s.total_tokens),
      costNok,
      costNokFmt:  costNok.toLocaleString("nb-NO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " kr",
      rows: rows.rows,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ukjent feil";
    return NextResponse.json({
      calls: 0, totalTokens: 0, costNok: 0, costNokFmt: "0,00 kr", rows: [], error: message,
    });
  }
}
