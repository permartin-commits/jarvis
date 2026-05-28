import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getFitnessUserId, type WorkoutTemplateRow } from "@/lib/strength";

export const dynamic = "force-dynamic";

interface TemplateDbRow {
  id: string;
  name: string;
  notes: string | null;
  exercise_id: string;
  exercise_name: string;
  category: string;
  sort_order: number;
  default_set_count: number;
}

export async function GET() {
  try {
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
       WHERE t.user_id = $1
       ORDER BY t.name ASC, te.sort_order ASC`,
      [getFitnessUserId()]
    );

    const map = new Map<string, WorkoutTemplateRow>();

    for (const row of result.rows) {
      let template = map.get(row.id);
      if (!template) {
        template = {
          id: row.id,
          name: row.name,
          notes: row.notes,
          exercises: [],
        };
        map.set(row.id, template);
      }

      if (row.exercise_id) {
        template.exercises.push({
          exerciseId: row.exercise_id,
          name: row.exercise_name,
          category: row.category,
          defaultSetCount: row.default_set_count,
          sortOrder: row.sort_order,
        });
      }
    }

    return NextResponse.json({ templates: [...map.values()] });
  } catch (err) {
    console.error("[strength/templates GET]", err);
    return NextResponse.json({ templates: [] });
  }
}
