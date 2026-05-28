import { NextRequest, NextResponse } from "next/server";
import type { PoolClient } from "pg";
import { getDb, query } from "@/lib/db";
import { getFitnessUserId, type WorkoutTemplateRow } from "@/lib/strength";

export const dynamic = "force-dynamic";

interface TemplateDbRow {
  id: string;
  name: string;
  notes: string | null;
  exercise_id: string | null;
  exercise_name: string | null;
  category: string | null;
  sort_order: number | null;
  default_set_count: number | null;
}

function rowToTemplate(rows: TemplateDbRow[]): WorkoutTemplateRow | null {
  if (rows.length === 0) return null;
  const head = rows[0];
  const template: WorkoutTemplateRow = {
    id: head.id,
    name: head.name,
    notes: head.notes,
    exercises: [],
  };

  for (const row of rows) {
    if (row.exercise_id && row.exercise_name && row.category != null) {
      template.exercises.push({
        exerciseId: row.exercise_id,
        name: row.exercise_name,
        category: row.category,
        defaultSetCount: row.default_set_count ?? 3,
        sortOrder: row.sort_order ?? 0,
      });
    }
  }

  template.exercises.sort((a, b) => a.sortOrder - b.sortOrder);
  return template;
}

async function fetchTemplateRows(
  templateId: string,
  userId: string
): Promise<TemplateDbRow[]> {
  const result = await query<TemplateDbRow>(
    `SELECT
       t.id,
       t.name,
       t.notes,
       te.exercise_id,
       e.name AS exercise_name,
       e.category,
       te.sort_order,
       te.default_set_count
     FROM workout_templates t
     LEFT JOIN workout_template_exercises te ON te.template_id = t.id
     LEFT JOIN exercises e ON e.id = te.exercise_id
     WHERE t.id = $1 AND t.user_id = $2
     ORDER BY te.sort_order ASC`,
    [templateId, userId]
  );
  return result.rows;
}

async function replaceTemplateExercises(
  client: PoolClient,
  templateId: string,
  exercises: { exerciseId: string; setCount: number }[]
) {
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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rows = await fetchTemplateRows(params.id, getFitnessUserId());
    const template = rowToTemplate(rows);
    if (!template) {
      return NextResponse.json({ error: "Mal ikke funnet" }, { status: 404 });
    }
    return NextResponse.json({ template });
  } catch (err) {
    console.error("[strength/templates/[id] GET]", err);
    return NextResponse.json({ error: "Kunne ikke hente mal" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: {
    name?: string;
    notes?: string | null;
    exercises?: { exerciseId: string; setCount: number }[];
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
      `SELECT id FROM workout_templates WHERE id = $1 AND user_id = $2`,
      [params.id, userId]
    );
    if (!existing.rows[0]) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Mal ikke funnet" }, { status: 404 });
    }

    const setClauses: string[] = ["updated_at = NOW()"];
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

    values.push(params.id, userId);
    await client.query(
      `UPDATE workout_templates SET ${setClauses.join(", ")}
       WHERE id = $${idx++} AND user_id = $${idx}`,
      values
    );

    if (body.exercises !== undefined) {
      await replaceTemplateExercises(client, params.id, body.exercises);
    }

    await client.query("COMMIT");

    const rows = await fetchTemplateRows(params.id, userId);
    const template = rowToTemplate(rows);
    return NextResponse.json({ template });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[strength/templates/[id] PATCH]", err);
    return NextResponse.json({ error: "Kunne ikke oppdatere mal" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await query(
      `DELETE FROM workout_templates WHERE id = $1 AND user_id = $2 RETURNING id`,
      [params.id, getFitnessUserId()]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Mal ikke funnet" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[strength/templates/[id] DELETE]", err);
    return NextResponse.json({ error: "Kunne ikke slette mal" }, { status: 500 });
  }
}
