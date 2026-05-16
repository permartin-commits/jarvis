import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const USD_TO_NOK = 10.5;

export async function GET() {
  const result = await query<{ calls: string; total_usd: string; total_tokens: string }>(
    `SELECT
       COUNT(*)                          AS calls,
       COALESCE(SUM(kostnad_usd), 0)     AS total_usd,
       COALESCE(SUM(total_tokens), 0)    AS total_tokens
     FROM pia_usage_log`
  ).catch(() => ({ rows: [{ calls: "0", total_usd: "0", total_tokens: "0" }] }));

  const row         = result.rows[0];
  const totalUsd    = Number(row.total_usd);
  const totalCalls  = Number(row.calls);
  const totalTokens = Number(row.total_tokens);
  const costNok     = totalUsd * USD_TO_NOK;

  return NextResponse.json({
    calls:      totalCalls,
    costNok:    costNok,
    costNokFmt: costNok.toLocaleString("nb-NO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " kr",
    tokens: totalTokens,
  });
}
