export interface HistoriskAvkastningRow {
  ticker: string;
  selskapsnavn: string | null;
  totalGevinst: number;
  antallTrades: number;
  sisteHandel: string | null;
}
