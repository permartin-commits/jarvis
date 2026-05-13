import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const USD_TO_NOK = 10.5;

export async function GET() {
  try {
    const res = await query<{ total_usd: string }>(
      "SELECT COALESCE(SUM(api_kostnad_usd), 0) AS total_usd FROM ai_logger"
    );
    const usd = Number(res.rows[0]?.total_usd ?? 0);
    const nok = usd * USD_TO_NOK;
    const formatted =
      nok.toLocaleString("nb-NO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " kr";
    return NextResponse.json({ costNok: formatted });
  } catch {
    return NextResponse.json({ costNok: "0,00 kr" });
  }
}
