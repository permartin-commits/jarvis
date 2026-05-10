import { query } from "./db";

export type PortfolioRow = {
  ticker: string;
  antall: number;
  kjopskurs: number;
  investert: number; // antall * kjopskurs, beregnet av SQL
};

export type PortfolioStats = {
  totalInvestert: number;
  antallPosisjoner: number;
};

export async function getPortfolioHoldings(): Promise<PortfolioRow[]> {
  const result = await query<{
    ticker: string;
    antall: string;
    kjopskurs: string;
    investert: string;
  }>(
    `SELECT
       ticker,
       antall,
       kjopskurs,
       (antall * kjopskurs) AS investert
     FROM portfolio
     ORDER BY (antall * kjopskurs) DESC`
  );

  return result.rows.map((r) => ({
    ticker: r.ticker,
    antall: Number(r.antall),
    kjopskurs: Number(r.kjopskurs),
    investert: Number(r.investert),
  }));
}

export async function getPortfolioStats(): Promise<PortfolioStats> {
  const result = await query<{
    total_investert: string;
    antall_posisjoner: string;
  }>(
    `SELECT
       COALESCE(SUM(antall * kjopskurs), 0) AS total_investert,
       COUNT(*)                             AS antall_posisjoner
     FROM portfolio`
  );

  const row = result.rows[0];
  return {
    totalInvestert: Number(row?.total_investert ?? 0),
    antallPosisjoner: Number(row?.antall_posisjoner ?? 0),
  };
}
