import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const USD_TO_NOK = 10.5;

export async function GET() {
  // Query both tables independently so one missing table doesn't break the other
  const [ai, pia] = await Promise.all([
    query<{ total_usd: string }>(
      "SELECT COALESCE(SUM(api_kostnad_usd), 0) AS total_usd FROM ai_logger"
    ).then((r) => Number(r.rows[0]?.total_usd ?? 0)).catch(() => 0),

    query<{ total_usd: string }>(
      `SELECT COALESCE(SUM(kostnad_usd), 0) AS total_usd FROM "Pia_usage_log"`
    ).then((r) => Number(r.rows[0]?.total_usd ?? 0)).catch(() => 0),
  ]);

  const totalUsd = ai + pia;
  const totalNok = totalUsd * USD_TO_NOK;

  const formatted =
    totalNok.toLocaleString("nb-NO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " kr";

  return NextResponse.json({ costNok: formatted, totalUsd });
}
