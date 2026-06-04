import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["new", "contacted", "qualified", "won", "lost"] as const;
type LeadStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const { status } = body as { status?: string };

  if (!status || !(VALID_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json(
      { error: `Ugyldig status. Gyldige verdier: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `UPDATE leads SET status = $1 WHERE id = $2
       RETURNING id, status, name, email`,
      [status as LeadStatus, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Lead ikke funnet" }, { status: 404 });
    }

    return NextResponse.json({ lead: result.rows[0] });
  } catch (err) {
    console.error("[business/leads PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Feil" },
      { status: 500 }
    );
  }
}
