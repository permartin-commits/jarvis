import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const COST_PER_MILLION_TOKENS = 1.25; // NOK

export async function GET() {
  try {
    const res = await query<{ total_tokens: string }>(
      "SELECT COALESCE(SUM(tokens_brukt), 0) AS total_tokens FROM ai_logger"
    );
    const tokens = Number(res.rows[0]?.total_tokens ?? 0);
    const costNok = (tokens / 1_000_000) * COST_PER_MILLION_TOKENS;
    const formatted = costNok.toLocaleString("nb-NO", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }) + " kr";
    return NextResponse.json({ tokens, costNok: formatted });
  } catch {
    return NextResponse.json({ tokens: 0, costNok: "0,0000 kr" });
  }
}
