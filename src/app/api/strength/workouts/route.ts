import { NextRequest, NextResponse } from "next/server";
import type { PoolClient } from "pg";
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
  completed_at: string | null;
  notes: string | null;
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
         w.completed_at,
         w.notes,
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
      notes: row.notes,
      isPlanned: row.completed_at == null,
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

async function saveWorkoutTemplate(
  client: PoolClient,
  userId: string,
  name: string,
  notes: string | null,
  exercises: { exerciseId: string; setCount: number }[]
) {
  const templateResult = await client.query<{ id: string }>(
    `INSERT INTO workout_templates (user_id, name, notes, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id, name)
     DO UPDATE SET
       notes = EXCLUDED.notes,
       updated_at = NOW()
     RETURNING id`,
    [userId, name, notes]
  );

  const templateId = templateResult.rows[0]?.id;
  if (!templateId) return;

  await client.query(
    `DELETE FROM workout_template_exercises WHERE template_id = $1`,
    [templateId]
  );

  if (exercises.length === 0) return;

  const values: unknown[] = [];
  const placeholders: string[] = [];
  let i = 1;

  for (let sortOrder = 0; sortOrder < exercises.length; sortOrder++) {
    const ex = exercises[sortOrder];
    placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++})`);
    values.push(templateId, ex.exerciseId, sortOrder, Math.max(1, ex.setCount));
  }

  await client.query(
    `INSERT INTO workout_template_exercises
       (template_id, exercise_id, sort_order, default_set_count)
     VALUES ${placeholders.join(", ")}`,
    values
  );
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    name?: string;
    notes?: string | null;
    sets?: WorkoutSetPayload[];
    saveAsTemplate?: boolean;
    finish?: boolean;
    templateExercises?: { exerciseId: string; setCount: number }[];
  };

  const name = body.name?.trim() || "Styrkeøkt";
  const notes = body.notes?.trim() || null;
  const allSets = body.sets ?? [];
  const finish = body.finish !== false;
  const completedSets = allSets.filter((s) => s.isCompleted);
  const setsToStore = finish ? completedSets : allSets;

  if (finish && completedSets.length === 0) {
    return NextResponse.json(
      { error: "Marker minst ett sett som fullført." },
      { status: 400 }
    );
  }

  const userId = getFitnessUserId();
  const client = await getDb().connect();

  try {
    await client.query("BEGIN");

    const completedAt = finish && completedSets.length > 0 ? "NOW()" : "NULL";
    const workoutResult = await client.query<{ id: string }>(
      `INSERT INTO workouts (user_id, name, notes, source, started_at, completed_at)
       VALUES ($1, $2, $3, 'jarvis', NOW(), ${completedAt})
       RETURNING id`,
      [userId, name, notes]
    );

    const workoutId = workoutResult.rows[0]?.id;
    if (!workoutId) {
      throw new Error("Kunne ikke opprette økt.");
    }

    if (setsToStore.length > 0) {
      const values: unknown[] = [];
      const placeholders: string[] = [];
      let i = 1;

      for (const set of setsToStore) {
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
          set.isCompleted
        );
      }

      await client.query(
        `INSERT INTO workout_sets
           (workout_id, exercise_id, set_number, weight_kg, reps, set_type, is_completed)
         VALUES ${placeholders.join(", ")}`,
        values
      );
    }

    if (body.saveAsTemplate) {
      let templateExercises = body.templateExercises ?? [];
      if (templateExercises.length === 0) {
        const byExercise = new Map<string, number>();
        for (const set of allSets.length > 0 ? allSets : setsToStore) {
          byExercise.set(
            set.exerciseId,
            Math.max(byExercise.get(set.exerciseId) ?? 0, set.setNumber)
          );
        }
        templateExercises = [...byExercise.entries()].map(
          ([exerciseId, setCount]) => ({ exerciseId, setCount: setCount || 1 })
        );
      }
      await saveWorkoutTemplate(client, userId, name, notes, templateExercises);
    }

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
