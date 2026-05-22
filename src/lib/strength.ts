export type SetType = "N" | "W" | "D" | "F";

export const SET_TYPE_OPTIONS: { value: SetType; label: string }[] = [
  { value: "N", label: "Normal" },
  { value: "W", label: "Oppvarming" },
  { value: "D", label: "Drop" },
  { value: "F", label: "Failure" },
];

export interface ExerciseRow {
  id: string;
  name: string;
  category: string;
  mechanics: string | null;
}

export interface WorkoutSetPayload {
  exerciseId: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  setType: SetType;
  isCompleted: boolean;
}

export interface WorkoutHistoryRow {
  id: string;
  dato: string;
  oktNavn: string;
  hovedovelse: string | null;
  kategori: string | null;
  totaltVolumKg: number;
  categories: string[];
}

/** Single-user Jarvis install; override with FITNESS_USER_ID in .env.local */
export function getFitnessUserId(): string {
  return (
    process.env.FITNESS_USER_ID ?? "00000000-0000-4000-8000-000000000001"
  );
}

export function normalizeCategory(value: string): string {
  return value.trim().toLowerCase();
}
