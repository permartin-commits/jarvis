/** Max Hangs — standard Beastmaker fingerstyrke-protokoll. */
export const MAX_HANGS_PROTOCOL = "Max Hangs" as const;

/** Alltid 5 sek «gjør deg klar» før hvert heng. */
export const MAX_HANGS_PREP_SECONDS = 5;

export const DEFAULT_MAX_HANGS_SETS = 5;
export const DEFAULT_HANG_SECONDS = 10;
export const DEFAULT_REST_MINUTES = 3;

export const DEFAULT_HOLD_SIZE = "2cm";
export const HOLD_SIZE_OPTIONS = ["1cm", "2cm", "3cm"] as const;

export type HoldSize = (typeof HOLD_SIZE_OPTIONS)[number];

export type WorkoutPhase =
  | "idle"
  | "prep"
  | "hang"
  | "rest"
  | "summary"
  | "saving"
  | "analysis";

export interface TrainingSession {
  id: number;
  date: string;
  protocol_type: string;
  perceived_effort: number | null;
  notes: string | null;
  is_completed: boolean;
  ai_session_analysis: string | null;
  next_session_suggestion: string | null;
  created_at: string;
}

export interface TrainingSessionDetail extends TrainingSession {
  hang_logs: HangLog[];
}

/** Formater øktdato (DATE fra Postgres kan komme som ISO-streng). */
export function formatTrainingSessionDate(
  session: Pick<TrainingSession, "date" | "created_at">
): string {
  const raw = session.date ?? session.created_at;
  if (raw == null || raw === "") return "—";

  let d: Date;
  if (typeof raw === "string") {
    const dayOnly = raw.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dayOnly) && raw.length <= 10) {
      d = new Date(`${dayOnly}T12:00:00`);
    } else {
      d = new Date(raw);
    }
  } else {
    d = new Date(raw as string);
  }

  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("nb-NO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Repeaters — styrkeutholdenhet på Beastmaker. */
export const REPEATERS_PROTOCOL = "Repeaters" as const;

/** 5 sek «gjør deg klar» før arbeidsblokken i hvert sett (inkl. første heng). */
export const REPEATERS_PREP_SECONDS = MAX_HANGS_PREP_SECONDS;

export const REPEATERS_REPS_PER_SET = 6;
export const REPEATERS_HANG_SECONDS = 7;
export const REPEATERS_SHORT_PAUSE_SECONDS = 3;
export const REPEATERS_LONG_REST_SECONDS = 180;
export const DEFAULT_REPEATERS_SETS = 3;
export const MIN_REPEATERS_SETS = 3;
export const MAX_REPEATERS_SETS = 6;
export const DEFAULT_REPEATERS_HOLD = "20mm";

export type RepeatersTimerPhase =
  | "prep"
  | "hang"
  | "short_pause"
  | "long_rest";

export interface RepeatersWorkoutConfig {
  totalSets: number;
  repsPerSet: number;
  hangSeconds: number;
  shortPauseSeconds: number;
  longRestSeconds: number;
  holdSize: string;
  weight: number;
}

export function clampRepeatersConfig(input: {
  totalSets: number;
  repsPerSet: number;
  hangSeconds: number;
  shortPauseSeconds: number;
  longRestMinutes?: number;
}): Pick<
  RepeatersWorkoutConfig,
  "totalSets" | "repsPerSet" | "hangSeconds" | "shortPauseSeconds" | "longRestSeconds"
> {
  const totalSets = Math.min(
    MAX_REPEATERS_SETS,
    Math.max(MIN_REPEATERS_SETS, Math.round(input.totalSets))
  );
  const repsPerSet = Math.min(20, Math.max(1, Math.round(input.repsPerSet)));
  const hangSeconds = Math.min(60, Math.max(3, Math.round(input.hangSeconds)));
  const shortPauseSeconds = Math.min(
    30,
    Math.max(1, Math.round(input.shortPauseSeconds))
  );
  const longRestMinutes =
    input.longRestMinutes != null
      ? Math.min(10, Math.max(1, input.longRestMinutes))
      : REPEATERS_LONG_REST_SECONDS / 60;
  const longRestSeconds = Math.round(longRestMinutes * 60);
  return {
    totalSets,
    repsPerSet,
    hangSeconds,
    shortPauseSeconds,
    longRestSeconds,
  };
}

export function repeatersPhaseLabel(
  phase: RepeatersTimerPhase,
  holdSize: string,
  setNumber: number,
  repNumber: number,
  totalSets: number,
  repsPerSet: number
): string {
  switch (phase) {
    case "prep":
      return `Gjør deg klar på ${holdSize}`;
    case "hang":
      return "HENG!";
    case "short_pause":
      return "SLIPP!";
    case "long_rest":
      return "HVILE";
    default:
      return `Sett ${setNumber}/${totalSets} · Rep ${repNumber}/${repsPerSet}`;
  }
}

export interface HangLog {
  id: number;
  session_id: number;
  set_number: number;
  rep_number: number;
  hold_size: string;
  weight_added: number;
  target_time_seconds: number;
  actual_time_seconds: number;
  is_failed: boolean;
  created_at: string;
}

export interface HangLogDraft {
  set_number: number;
  rep_number: number;
  hold_size: string;
  weight_added: number;
  target_time_seconds: number;
  actual_time_seconds: number;
  is_failed: boolean;
}

export interface SaveTrainingSessionBody {
  protocol_type: string;
  perceived_effort?: number | null;
  notes?: string | null;
  is_completed: boolean;
  hang_logs: HangLogDraft[];
}

export function formatTimerSeconds(total: number): string {
  const abs = Math.max(0, Math.floor(total));
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export interface MaxHangsWorkoutConfig {
  totalSets: number;
  hangSeconds: number;
  restSeconds: number;
  holdSize: string;
  weight: number;
}

export function phaseLabel(
  phase: WorkoutPhase,
  holdSize: string,
  setNumber: number,
  totalSets: number
): string {
  switch (phase) {
    case "prep":
      return `Gjør deg klar på ${holdSize}`;
    case "hang":
      return "HENG!";
    case "rest":
      return "HVILE";
    case "summary":
      return "Økt fullført";
    default:
      return `Sett ${setNumber}/${totalSets}`;
  }
}

export function clampMaxHangsConfig(input: {
  totalSets: number;
  hangSeconds: number;
  restMinutes: number;
}): Pick<MaxHangsWorkoutConfig, "totalSets" | "hangSeconds" | "restSeconds"> {
  const totalSets = Math.min(20, Math.max(1, Math.round(input.totalSets)));
  const hangSeconds = Math.min(120, Math.max(3, Math.round(input.hangSeconds)));
  const restMinutes = Math.min(15, Math.max(0.5, input.restMinutes));
  const restSeconds = Math.round(restMinutes * 60);
  return { totalSets, hangSeconds, restSeconds };
}
