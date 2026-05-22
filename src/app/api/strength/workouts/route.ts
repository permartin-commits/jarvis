import { NextRequest, NextResponse } from "next/server";
import { getDb, query } from "@/lib/db";
import {
  getFitnessUserId,
  type WorkoutHistoryRow,
  type WorkoutSetPayload,
} from "@/lib/strength";

export const dynamic = "force-dynamic";

interface HistoryDbRow {
  id: string;
  name: string;
  started_at: string;
  hovedovelse: string | null;
  kategori: string | null;
  totalt_volum: string | null;
  categories: string[] | null;
}

export async function GET() {
  try {
    const result = await query<HistoryDbRow>(
      `WITH set_stats AS (
         SELECT
           ws.workout_id,
           ws.exercise_id,
           e.name AS exercise_name,
           e.category,
           COUNT(*)::int AS set_count,
           COALESCE(SUM(
             CASE
               WHEN ws.is_completed
                 AND ws.weight_kg IS NOT NULL
                 AND ws.reps IS NOT NULL
               THEN ws.weight_kg * ws.reps
               ELSE 0
             END
           ), 0) AS exercise_volume
         FROM workout_sets ws
         JOIN exercises e ON e.id = ws.exercise_id
         GROUP BY ws.workout_id, ws.exercise_id, e.name, e.category
       ),
       workout_volume AS (
         SELECT workout_id, SUM(exercise_volume) AS totalt_volum
         FROM set_stats
         GROUP BY workout_id
       ),
       main_exercise AS (
         SELECT DISTINCT ON (workout_id)
           workout_id,
           exercise_name,
           category
         FROM set_stats
         ORDER BY workout_id, exercise_volume DESC, set_count DESC
       ),
       workout_categories AS (
         SELECT workout_id, array_agg(DISTINCT category) AS categories
         FROM set_stats
         GROUP BY workout_id
       )
       SELECT
         w.id,
         w.name,
         w.started_at,
         me.exercise_name AS hovedovelse,
         me.category AS kategori,
         COALESCE(wv.totalt_volum, 0) AS totalt_volum,
         wc.categories
       FROM workouts w
       LEFT JOIN main_exercise me ON me.workout_id = w.id
       LEFT JOIN workout_volume wv ON wv.workout_id = w.id
       LEFT JOIN workout_categories wc ON wc.workout_id = w.id
       ORDER BY w.started_at DESC
       LIMIT 500`
    );

    const workouts: WorkoutHistoryRow[] = result.rows.map((row) => ({
      id: row.id,
      dato: row.started_at,
      oktNavn: row.name,
      hovedovelse: row.hovedovelse,
      kategori: row.kategori,
      totaltVolumKg: Number(row.totalt_volum ?? 0),
      categories: row.categories ?? [],
    }));

    const catResult = await query<{ category: string }>(
      `SELECT DISTINCT category FROM exercises ORDER BY category ASC`
    );

    return NextResponse.json({
      workouts,
      categories: catResult.rows.map((r) => r.category),
    });
  } catch (err) {
    console.error("[strength/workouts GET]", err);
    return NextResponse.json({ workouts: [], categories: [] });
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    name?: string;
    sets?: WorkoutSetPayload[];
  };

  const name = body.name?.trim() || "Styrkeøkt";
  const sets = (body.sets ?? []).filter((s) => s.isCompleted);

  if (sets.length === 0) {
    return NextResponse.json(
      { error: "Ingen fullførte sett å lagre." },
      { status: 400 }
    );
  }

  const client = await getDb().connect();

  try {
    await client.query("BEGIN");

    const workoutResult = await client.query<{ id: string }>(
      `INSERT INTO workouts (user_id, name, source, started_at, completed_at)
       VALUES ($1, $2, 'jarvis', NOW(), NOW())
       RETURNING id`,
      [getFitnessUserId(), name]
    );

    const workoutId = workoutResult.rows[0]?.id;
    if (!workoutId) {
      throw new Error("Kunne ikke opprette økt.");
    }

    const values: unknown[] = [];
    const placeholders: string[] = [];
    let i = 1;

    for (const set of sets) {
      placeholders.push(
        `($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`
      );
      values.push(
        workoutId,
        set.exerciseId,
        set.setNumber,
        set.weightKg,
        set.reps,
        set.setType,
        true
      );
    }

    await client.query(
      `INSERT INTO workout_sets
         (workout_id, exercise_id, set_number, weight_kg, reps, set_type, is_completed)
       VALUES ${placeholders.join(", ")}`,
      values
    );

    await client.query("COMMIT");

    return NextResponse.json({ workoutId }, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[strength/workouts POST]", err);
    return NextResponse.json(
      { error: "Kunne ikke lagre økten." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
