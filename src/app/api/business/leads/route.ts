import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface LeadRow {
  id: string;
  created_at: string;
  name: string;
  company: string | null;
  email: string;
  interest: string | null;
  status: string;
  description: string | null;
}

const STATUS_VARIANTS: Record<string, string[]> = {
  new:       ["new", "ny"],
  contacted: ["contacted", "kontaktet"],
  qualified: ["qualified", "kvalifisert"],
  won:       ["won", "vunnet"],
  lost:      ["lost", "tapt"],
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status   = searchParams.get("status");
  const interest = searchParams.get("interest");

  const conditions: string[] = [];
  const params: unknown[]    = [];

  if (status && status !== "alle") {
    const variants = STATUS_VARIANTS[status] ?? [status];
    params.push(variants.map((v) => v.toLowerCase()));
    conditions.push(`LOWER(status) = ANY($${params.length})`);
  }
  if (interest && interest !== "alle") {
    params.push(interest);
    conditions.push(`topic = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const result = await query<LeadRow>(
      `SELECT id, created_at, name, company, email, topic AS interest, status, description
       FROM leads
       ${where}
       ORDER BY created_at DESC`,
      params.length ? params : undefined
    );
    return NextResponse.json({ leads: result.rows });
  } catch (err) {
    console.error("[business/leads GET]", err);
    return NextResponse.json({ leads: [], error: err instanceof Error ? err.message : "Feil" });
  }
}
