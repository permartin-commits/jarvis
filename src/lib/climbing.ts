/** Franske sportklatringsgrader (dropdown). */
export const FRENCH_GRADES = [
  "4",
  "4+",
  "5a",
  "5a+",
  "5b",
  "5b+",
  "5c",
  "5c+",
  "6a",
  "6a+",
  "6b",
  "6b+",
  "6c",
  "6c+",
  "7a",
  "7a+",
  "7b",
  "7b+",
  "7c",
  "7c+",
  "8a",
  "8a+",
  "8b",
  "8b+",
  "8c",
  "8c+",
  "9a",
  "9a+",
  "9b",
  "9b+",
  "9c",
] as const;

export type FrenchGrade = (typeof FRENCH_GRADES)[number];

export interface ClimbingRoute {
  id: number;
  crag: string;
  rutenavn: string;
  grad: string;
  stjerner: number;
  dato_send: string | null;
  flash: boolean;
  kommentar: string | null;
  created_at: string;
}

export function routeStatus(route: Pick<ClimbingRoute, "dato_send">): "send" | "prosjekt" {
  return route.dato_send ? "send" : "prosjekt";
}

export interface ClimbingRoutePayload {
  crag: string;
  rutenavn: string;
  grad: string;
  stjerner: number;
  dato_send: string | null;
  flash: boolean;
  kommentar: string | null;
}

export function parseRoutePayload(
  body: unknown
): { ok: true; data: ClimbingRoutePayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Ugyldig data." };
  }
  const b = body as Record<string, unknown>;
  const crag = typeof b.crag === "string" ? b.crag.trim() : "";
  const rutenavn = typeof b.rutenavn === "string" ? b.rutenavn.trim() : "";
  const grad = typeof b.grad === "string" ? b.grad.trim() : "";

  if (!crag || !rutenavn || !grad) {
    return { ok: false, error: "Crag, rutenavn og grad er påkrevd." };
  }
  if (!(FRENCH_GRADES as readonly string[]).includes(grad)) {
    return { ok: false, error: "Ugyldig grad." };
  }

  const stjerner = Number(b.stjerner);
  if (!Number.isInteger(stjerner) || stjerner < 0 || stjerner > 3) {
    return { ok: false, error: "Stjerner må være 0–3." };
  }

  const datoSend =
    b.dato_send && String(b.dato_send).trim()
      ? String(b.dato_send).trim()
      : null;

  return {
    ok: true,
    data: {
      crag,
      rutenavn,
      grad,
      stjerner,
      dato_send: datoSend,
      flash: Boolean(b.flash),
      kommentar:
        typeof b.kommentar === "string" && b.kommentar.trim()
          ? b.kommentar.trim()
          : null,
    },
  };
}

/** YYYY-MM-DD for date input */
export function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function gradeIndex(grad: string): number {
  const idx = (FRENCH_GRADES as readonly string[]).indexOf(grad);
  return idx >= 0 ? idx : -1;
}

export interface GradeSendCount {
  grad: string;
  count: number;
}

/** Antall sendte ruter per grad, sortert stigende etter vanskelighet. */
export function buildSendCountByGrade(
  routes: ClimbingRoute[]
): GradeSendCount[] {
  const counts = new Map<string, number>();
  for (const r of routes) {
    if (routeStatus(r) !== "send") continue;
    counts.set(r.grad, (counts.get(r.grad) ?? 0) + 1);
  }
  return FRENCH_GRADES.filter((g) => (counts.get(g) ?? 0) > 0).map((g) => ({
    grad: g,
    count: counts.get(g)!,
  }));
}
