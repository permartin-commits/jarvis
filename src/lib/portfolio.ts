import { query } from "./db";

export type PortfolioRow = {
  ticker: string;
  antall: number;
  kjopskurs: number;
  investert: number;
  selskapsnavn: string | null;
  avkastning: number | null;   // Generated column in DB (%)
  target: number | null;
  stop_loss: number | null;
  siste_kurs: number | null;
};

export type PortfolioStats = {
  totalInvestert: number;
  antallPosisjoner: number;
  totalAvkastningNok: number | null;
  totalAvkastningPct: number | null;
};

export type LatestAiLog = {
  ticker: string;
  handling: string | null;
  detaljer: string | null;
};

export type WatchlistItem = {
  ticker: string;
  selskapsnavn: string | null;
  siste_kurs: number | null;
  aiHandling: string | null;
  aiDetaljer: string | null;
};

// ── Holdings (only owned positions: antall > 0) ────────────────────────────

export async function getPortfolioHoldings(): Promise<PortfolioRow[]> {
  try {
    const result = await query<{
      ticker: string;
      antall: string;
      kjopskurs: string;
      investert: string;
      selskapsnavn: string | null;
      avkastning: string | null;
      target: string | null;
      stop_loss: string | null;
      siste_kurs: string | null;
    }>(
      `SELECT
         ticker,
         antall,
         kjopskurs,
         (antall * kjopskurs) AS investert,
         selskapsnavn,
         avkastning,
         target,
         stop_loss,
         siste_kurs
       FROM portfolio
       WHERE antall > 0
       ORDER BY (antall * kjopskurs) DESC`
    );

    return result.rows.map((r) => ({
      ticker:       r.ticker,
      antall:       Number(r.antall),
      kjopskurs:    Number(r.kjopskurs),
      investert:    Number(r.investert),
      selskapsnavn: r.selskapsnavn ?? null,
      avkastning:   r.avkastning   != null ? Number(r.avkastning)  : null,
      target:       r.target       != null ? Number(r.target)      : null,
      stop_loss:    r.stop_loss    != null ? Number(r.stop_loss)   : null,
      siste_kurs:   r.siste_kurs   != null ? Number(r.siste_kurs)  : null,
    }));
  } catch {
    // Extended columns not yet added — fall back to basics
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
       WHERE antall > 0
       ORDER BY (antall * kjopskurs) DESC`
    );

    return result.rows.map((r) => ({
      ticker:       r.ticker,
      antall:       Number(r.antall),
      kjopskurs:    Number(r.kjopskurs),
      investert:    Number(r.investert),
      selskapsnavn: null,
      avkastning:   null,
      target:       null,
      stop_loss:    null,
      siste_kurs:   null,
    }));
  }
}

// ── Stats (only owned positions) ──────────────────────────────────────────────

export async function getPortfolioStats(): Promise<PortfolioStats> {
  // Try with siste_kurs for full avkastning calculation
  try {
    const result = await query<{
      total_investert: string;
      antall_posisjoner: string;
      cost_basis: string;
      current_value: string;
    }>(
      `SELECT
         COALESCE(SUM(antall * kjopskurs), 0)  AS total_investert,
         COUNT(*)                              AS antall_posisjoner,
         SUM(antall * kjopskurs)               AS cost_basis,
         SUM(antall * siste_kurs)              AS current_value
       FROM portfolio
       WHERE antall > 0`
    );

    const row        = result.rows[0];
    const costBasis  = Number(row?.cost_basis   ?? 0);
    const currValue  = Number(row?.current_value ?? 0);

    const avkNok = currValue > 0 && costBasis > 0 ? currValue - costBasis : null;
    const avkPct = costBasis > 0 && currValue > 0
      ? ((currValue - costBasis) / costBasis) * 100
      : null;

    return {
      totalInvestert:    Number(row?.total_investert   ?? 0),
      antallPosisjoner:  Number(row?.antall_posisjoner ?? 0),
      totalAvkastningNok: avkNok,
      totalAvkastningPct: avkPct,
    };
  } catch {
    // Fallback: no siste_kurs column yet
    const result = await query<{
      total_investert: string;
      antall_posisjoner: string;
    }>(
      `SELECT
         COALESCE(SUM(antall * kjopskurs), 0) AS total_investert,
         COUNT(*)                             AS antall_posisjoner
       FROM portfolio
       WHERE antall > 0`
    );

    const row = result.rows[0];
    return {
      totalInvestert:     Number(row?.total_investert   ?? 0),
      antallPosisjoner:   Number(row?.antall_posisjoner ?? 0),
      totalAvkastningNok: null,
      totalAvkastningPct: null,
    };
  }
}

// ── Watchlist: antall = 0 / NULL with BUY/KJØP signal ─────────────────────

export async function getWatchlistItems(): Promise<WatchlistItem[]> {
  try {
    const result = await query<{
      ticker: string;
      selskapsnavn: string | null;
      siste_kurs: string | null;
      ai_handling: string | null;
      ai_detaljer: string | null;
    }>(
      `SELECT DISTINCT ON (p.ticker)
         p.ticker,
         p.selskapsnavn,
         p.siste_kurs,
         a.handling AS ai_handling,
         a.detaljer AS ai_detaljer
       FROM portfolio p
       LEFT JOIN ai_logger a ON UPPER(a.ticker) = UPPER(p.ticker)
       WHERE (p.antall IS NULL OR p.antall = 0)
         AND (
               UPPER(COALESCE(a.handling, '')) LIKE '%BUY%'
            OR UPPER(COALESCE(a.handling, '')) LIKE '%KJ_P%'
         )
       ORDER BY p.ticker, a.id DESC NULLS LAST`
    );

    return result.rows.map((r) => ({
      ticker:      r.ticker,
      selskapsnavn: r.selskapsnavn ?? null,
      siste_kurs:  r.siste_kurs != null ? Number(r.siste_kurs) : null,
      aiHandling:  r.ai_handling ?? null,
      aiDetaljer:  r.ai_detaljer ?? null,
    }));
  } catch {
    return [];
  }
}

// ── Latest AI log per ticker (for portfolio overlay) ──────────────────────

export async function getLatestAiLogPerTicker(): Promise<LatestAiLog[]> {
  try {
    const result = await query<LatestAiLog>(
      `SELECT DISTINCT ON (ticker) ticker, handling, detaljer
       FROM ai_logger
       WHERE ticker IS NOT NULL
       ORDER BY ticker, id DESC`
    );
    return result.rows;
  } catch {
    return [];
  }
}
