import { NextRequest, NextResponse } from "next/server";
import type { PoolClient } from "pg";
import { getDb, query } from "@/lib/db";
import {
  getFitnessUserId,
  type SetType,
  type WorkoutDetail,
  type WorkoutDetailExercise,
  type WorkoutSetPayload,
} from "@/lib/strength";

export const dynamic = "force-dynamic";

interface SetDbRow {
  id: string;
  exercise_id: string;
  exercise_name: string;
  category: string;
  set_number: number;
  weight_kg: string | null;
  reps: number | null;
  set_type: SetType;
  is_completed: boolean;
}

interface WorkoutDbRow {
  id: string;
  name: string;
  notes: string | null;
  started_at: string;
  completed_at: string | null;
}

function groupExercises(rows: SetDbRow[]): WorkoutDetailExercise[] {
  const map = new Map<string, WorkoutDetailExercise>();

  for (const row of rows) {
    let ex = map.get(row.exercise_id);
    if (!ex) {
      ex = {
        exerciseId: row.exercise_id,
        name: row.exercise_name,
        category: row.category,
        sets: [],
      };
      map.set(row.exercise_id, ex);
    }
    ex.sets.push({
      id: row.id,
      setNumber: row.set_number,
      weightKg: row.weight_kg != null ? Number(row.weight_kg) : null,
      reps: row.reps,
      setType: row.set_type,
      isCompleted: row.is_completed,
    });
  }

  return [...map.values()].map((ex) => ({
    ...ex,
    sets: ex.sets.sort((a, b) => a.setNumber - b.setNumber),
  }));
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const workoutId = params.id;
  if (!workoutId) {
    return NextResponse.json({ error: "Ugyldig id" }, { status: 400 });
  }

  try {
    const workoutResult = await query<WorkoutDbRow>(
      `SELECT id, name, notes, started_at, completed_at
       FROM workouts
       WHERE id = $1 AND user_id = $2`,
      [workoutId, getFitnessUserId()]
    );

    const workout = workoutResult.rows[0];
    if (!workout) {
      return NextResponse.json({ error: "Økt ikke funnet" }, { status: 404 });
    }

    const setsResult = await query<SetDbRow>(
      `SELECT
         ws.id,
         ws.exercise_id,
         e.name AS exercise_name,
         e.category,
         ws.set_number,
         ws.weight_kg,
         ws.reps,
         ws.set_type,
         ws.is_completed
       FROM workout_sets ws
       JOIN exercises e ON e.id = ws.exercise_id
       WHERE ws.workout_id = $1
       ORDER BY e.name ASC, ws.set_number ASC`,
      [workoutId]
    );

    const detail: WorkoutDetail = {
      id: workout.id,
      name: workout.name,
      notes: workout.notes,
      startedAt: workout.started_at,
      completedAt: workout.completed_at,
      exercises: groupExercises(setsResult.rows),
    };

    return NextResponse.json({ workout: detail });
  } catch (err) {
    console.error("[strength/workouts/[id] GET]", err);
    return NextResponse.json({ error: "Kunne ikke hente økt" }, { status: 500 });
  }
}

async function replaceSets(
  client: PoolClient,
  workoutId: string,
  sets: WorkoutSetPayload[]
) {
  await client.query(`DELETE FROM workout_sets WHERE workout_id = $1`, [
    workoutId,
  ]);

  if (sets.length === 0) return;

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const workoutId = params.id;
  if (!workoutId) {
    return NextResponse.json({ error: "Ugyldig id" }, { status: 400 });
  }

  let body: {
    name?: string;
    notes?: string | null;
    sets?: WorkoutSetPayload[];
    markCompleted?: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const userId = getFitnessUserId();
  const client = await getDb().connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query<{ id: string }>(
      `SELECT id FROM workouts WHERE id = $1 AND user_id = $2`,
      [workoutId, userId]
    );
    if (!existing.rows[0]) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Økt ikke funnet" }, { status: 404 });
    }

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (body.name !== undefined) {
      setClauses.push(`name = $${idx++}`);
      values.push(body.name.trim() || "Styrkeøkt");
    }
    if (body.notes !== undefined) {
      setClauses.push(`notes = $${idx++}`);
      values.push(body.notes?.trim() || null);
    }

    if (body.sets !== undefined) {
      const hasCompleted = body.sets.some((s) => s.isCompleted);
      if (hasCompleted) {
        setClauses.push(`completed_at = NOW()`);
      } else {
        setClauses.push(`completed_at = NULL`);
      }
    } else if (body.markCompleted === true) {
      setClauses.push(`completed_at = NOW()`);
    }

    if (setClauses.length > 0) {
      values.push(workoutId, userId);
      await client.query(
        `UPDATE workouts SET ${setClauses.join(", ")}
         WHERE id = $${idx++} AND user_id = $${idx}`,
        values
      );
    }

    if (body.sets !== undefined) {
      await replaceSets(client, workoutId, body.sets);
    }

    await client.query("COMMIT");

    const detailRes = await GET(req, { params });
    return detailRes;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[strength/workouts/[id] PATCH]", err);
    return NextResponse.json({ error: "Kunne ikke oppdatere økt" }, { status: 500 });
  } finally {
    client.release();
  }
}
