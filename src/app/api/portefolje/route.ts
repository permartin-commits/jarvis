import { NextResponse } from "next/server";
import {
  getPortfolioHoldings,
  getPortfolioStats,
  getLatestAiLogPerTicker,
  getWatchlistItems,
} from "@/lib/portfolio";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [holdings, stats, aiLogs, watchlist] = await Promise.all([
      getPortfolioHoldings(),
      getPortfolioStats(),
      getLatestAiLogPerTicker(),
      getWatchlistItems(),
    ]);

    return NextResponse.json({ holdings, stats, aiLogs, watchlist });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ukjent feil";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
