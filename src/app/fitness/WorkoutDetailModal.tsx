"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { SetType, WorkoutDetail } from "@/lib/strength";
import { SET_TYPE_OPTIONS } from "@/lib/strength";

interface EditableSet {
  clientId: string;
  exerciseId: string;
  setNumber: number;
  weight: string;
  reps: string;
  setType: SetType;
  isCompleted: boolean;
}

interface EditableExercise {
  exerciseId: string;
  name: string;
  category: string;
  sets: EditableSet[];
}

function newClientId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toEditable(workout: WorkoutDetail): {
  name: string;
  notes: string;
  exercises: EditableExercise[];
} {
  return {
    name: workout.name,
    notes: workout.notes ?? "",
    exercises: workout.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      name: ex.name,
      category: ex.category,
      sets: ex.sets.map((s) => ({
        clientId: s.id || newClientId(),
        exerciseId: ex.exerciseId,
        setNumber: s.setNumber,
        weight: s.weightKg != null ? String(s.weightKg) : "",
        reps: s.reps != null ? String(s.reps) : "",
        setType: s.setType,
        isCompleted: s.isCompleted,
      })),
    })),
  };
}

function buildPayload(
  name: string,
  notes: string,
  exercises: EditableExercise[]
) {
  return {
    name: name.trim() || "Styrkeøkt",
    notes: notes.trim() || null,
    sets: exercises.flatMap((ex) =>
      ex.sets.map((s) => ({
        exerciseId: ex.exerciseId,
        setNumber: s.setNumber,
        weightKg: s.weight.trim() ? parseFloat(s.weight) : null,
        reps: s.reps.trim() ? parseInt(s.reps, 10) : null,
        setType: s.setType,
        isCompleted: s.isCompleted,
      }))
    ),
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface WorkoutDetailModalProps {
  workoutId: string;
  onClose: () => void;
  onUpdated?: () => void;
}

export function WorkoutDetailModal({
  workoutId,
  onClose,
  onUpdated,
}: WorkoutDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    startedAt: string;
    completedAt: string | null;
  } | null>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<EditableExercise[]>([]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ name, notes, exercises });

  useEffect(() => {
    latestRef.current = { name, notes, exercises };
  }, [name, notes, exercises]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/strength/workouts/${workoutId}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Kunne ikke hente økt");
        return r.json();
      })
      .then((data: { workout: WorkoutDetail }) => {
        const editable = toEditable(data.workout);
        setName(editable.name);
        setNotes(editable.notes);
        setExercises(editable.exercises);
        setMeta({
          startedAt: data.workout.startedAt,
          completedAt: data.workout.completedAt,
        });
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Kunne ikke hente økt")
      )
      .finally(() => setLoading(false));
  }, [workoutId]);

  const persist = useCallback(async () => {
    const { name: n, notes: no, exercises: ex } = latestRef.current;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/strength/workouts/${workoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(n, no, ex)),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Lagring feilet");
      }
      const data = (await res.json()) as { workout: WorkoutDetail };
      setMeta({
        startedAt: data.workout.startedAt,
        completedAt: data.workout.completedAt,
      });
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lagring feilet");
    } finally {
      setSaving(false);
    }
  }, [workoutId, onUpdated]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void persist(), 600);
  }, [persist]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function updateSet(
    exerciseId: string,
    setClientId: string,
    patch: Partial<EditableSet>
  ) {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.exerciseId !== exerciseId
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s) =>
                s.clientId === setClientId ? { ...s, ...patch } : s
              ),
            }
      )
    );
    scheduleSave();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0 flex-1 space-y-1">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Laster økt…
              </div>
            ) : (
              <>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    scheduleSave();
                  }}
                  className="h-8 border-border/60 bg-secondary/20 text-sm font-semibold"
                />
                {meta && (
                  <p className="text-[10px] text-muted-foreground">
                    {formatDate(meta.startedAt)}
                    {meta.completedAt == null && (
                      <span className="ml-2 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-400">
                        Planlagt
                      </span>
                    )}
                  </p>
                )}
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Lukk"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
              {error}
            </p>
          )}

          <label className="block space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Notat
            </span>
            <Textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                scheduleSave();
              }}
              rows={3}
              placeholder="Notater om økten…"
              className="min-h-[4.5rem] border-border/60 bg-secondary/15 text-xs"
            />
          </label>

          {!loading && exercises.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Ingen øvelser registrert på denne økten.
            </p>
          ) : (
            exercises.map((ex) => (
              <div
                key={ex.exerciseId}
                className="overflow-hidden rounded-lg border border-border/80 bg-secondary/10"
              >
                <div className="border-b border-border/60 bg-secondary/25 px-3 py-2">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {ex.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {ex.category}
                  </p>
                </div>
                <div className="px-2 py-2">
                  <div className="mb-1 grid grid-cols-[2rem_1fr_1fr_2.5rem_4.5rem] gap-1.5 px-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                    <span>#</span>
                    <span className="text-center">Kg</span>
                    <span className="text-center">Reps</span>
                    <span className="text-center">✓</span>
                    <span>Type</span>
                  </div>
                  {ex.sets.map((set) => (
                    <div
                      key={set.clientId}
                      className={cn(
                        "mb-1 grid grid-cols-[2rem_1fr_1fr_2.5rem_4.5rem] items-center gap-1.5 rounded-md px-1 py-1",
                        set.isCompleted && "bg-primary/10 ring-1 ring-primary/25"
                      )}
                    >
                      <span className="text-center text-[10px] tabular-nums text-muted-foreground">
                        {set.setNumber}
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        value={set.weight}
                        onChange={(e) =>
                          updateSet(ex.exerciseId, set.clientId, {
                            weight: e.target.value,
                          })
                        }
                        className="h-7 border-border/50 bg-background/60 px-1.5 text-center text-xs tabular-nums"
                      />
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={set.reps}
                        onChange={(e) =>
                          updateSet(ex.exerciseId, set.clientId, {
                            reps: e.target.value,
                          })
                        }
                        className="h-7 border-border/50 bg-background/60 px-1.5 text-center text-xs tabular-nums"
                      />
                      <div className="flex justify-center">
                        <Checkbox
                          checked={set.isCompleted}
                          onCheckedChange={(checked) =>
                            updateSet(ex.exerciseId, set.clientId, {
                              isCompleted: checked === true,
                            })
                          }
                        />
                      </div>
                      <Select
                        value={set.setType}
                        onValueChange={(v) =>
                          updateSet(ex.exerciseId, set.clientId, {
                            setType: (v ?? "N") as SetType,
                          })
                        }
                      >
                        <SelectTrigger
                          size="sm"
                          className="h-7 w-full min-w-0 border-border/50 bg-background/60 px-1 text-[10px]"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SET_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="shrink-0 border-t border-border px-4 py-2.5 text-center text-[10px] text-muted-foreground">
          {saving ? (
            <span className="inline-flex items-center gap-1.5 text-primary">
              <Loader2 className="h-3 w-3 animate-spin" />
              Lagrer…
            </span>
          ) : (
            "Endringer lagres automatisk"
          )}
        </div>
      </div>
    </div>
  );
}
