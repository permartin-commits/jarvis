import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { HistoriskAvkastningRow } from "@/lib/historisk-avkastning";

export const dynamic = "force-dynamic";

interface DbRow {
  ticker: string;
  selskapsnavn: string | null;
  total_gevinst: string | null;
  antall_trades: string | null;
  siste_handel: string | null;
}

export async function GET() {
  try {
    const result = await query<DbRow>(
      `SELECT
         ticker,
         selskapsnavn,
         total_gevinst,
         antall_trades,
         siste_handel
       FROM historisk_avkastning
       ORDER BY total_gevinst DESC NULLS LAST, ticker ASC`
    );

    const rows: HistoriskAvkastningRow[] = result.rows.map((r) => ({
      ticker: r.ticker,
      selskapsnavn: r.selskapsnavn,
      totalGevinst: Number(r.total_gevinst ?? 0),
      antallTrades: Number(r.antall_trades ?? 0),
      sisteHandel: r.siste_handel,
    }));

    return NextResponse.json({ rows });
  } catch (err) {
    console.error("[historisk-avkastning]", err);
    return NextResponse.json({ rows: [], error: "Kunne ikke hente data" });
  }
}
