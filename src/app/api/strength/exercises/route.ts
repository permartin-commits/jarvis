import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { ExerciseRow } from "@/lib/strength";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await query<ExerciseRow>(
      `SELECT id, name, category, mechanics
       FROM exercises
       ORDER BY name ASC`
    );
    return NextResponse.json({ exercises: result.rows });
  } catch (err) {
    console.error("[strength/exercises]", err);
    return NextResponse.json({ exercises: [] });
  }
}
