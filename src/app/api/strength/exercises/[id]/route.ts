import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

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
  const b = body as Record<string, unknown>;
  const name =
    typeof b.name === "string" ? b.name.trim() : "";
  const category =
    typeof b.category === "string" ? b.category.trim() : "";
  const mechanics =
    typeof b.mechanics === "string" && b.mechanics.trim()
      ? b.mechanics.trim()
      : null;

  if (!name || !category) {
    return NextResponse.json(
      { error: "name og category er påkrevd" },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `UPDATE exercises SET name=$1, category=$2, mechanics=$3
       WHERE id=$4
       RETURNING id, name, category, mechanics`,
      [name, category, mechanics, id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
    }
    return NextResponse.json({ exercise: result.rows[0] });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Kunne ikke oppdatere øvelse";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
