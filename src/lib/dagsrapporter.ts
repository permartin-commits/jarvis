export interface Dagsrapport {
  id: string;
  dato: string;
  type: string;
  rapport: string | null;
  handling: string | null;
}

/** Visningsnavn for type-kolonnen (Supabase: `type`). */
export function formatRapportType(type: string | null | undefined): string {
  const t = (type ?? "").trim();
  if (!t || t.toUpperCase() === "EMPTY") return "Morgenrapport";
  return t;
}
