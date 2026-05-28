"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Dumbbell,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ExerciseRow, SetType, WorkoutTemplateRow } from "@/lib/strength";
import { SET_TYPE_OPTIONS } from "@/lib/strength";

interface ActiveSet {
  clientId: string;
  setNumber: number;
  weight: string;
  reps: string;
  completed: boolean;
  setType: SetType;
}

interface ActiveExercise {
  clientId: string;
  exerciseId: string;
  name: string;
  category: string;
  sets: ActiveSet[];
}

function newClientId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createSet(setNumber: number): ActiveSet {
  return {
    clientId: newClientId(),
    setNumber,
    weight: "",
    reps: "",
    completed: false,
    setType: "N",
  };
}

function loadExercises(): Promise<ExerciseRow[]> {
  return fetch("/api/strength/exercises")
    .then((r) => r.json())
    .then((d) => (d.exercises as ExerciseRow[]) ?? [])
    .catch(() => []);
}

function loadTemplates(): Promise<WorkoutTemplateRow[]> {
  return fetch("/api/strength/templates")
    .then((r) => r.json())
    .then((d) => (d.templates as WorkoutTemplateRow[]) ?? [])
    .catch(() => []);
}

interface LiveWorkoutLoggerProps {
  onWorkoutSaved?: () => void;
  onClose?: () => void;
  templateVersion?: number;
}

export function LiveWorkoutLogger({
  onWorkoutSaved,
  onClose,
  templateVersion = 0,
}: LiveWorkoutLoggerProps) {
  const [workoutName, setWorkoutName] = useState("Styrkeøkt");
  const [notes, setNotes] = useState("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplateRow[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExercises().then(setExercises);
  }, []);

  useEffect(() => {
    loadTemplates().then(setTemplates);
  }, [templateVersion]);

  const completedCount = useMemo(
    () =>
      activeExercises.reduce(
        (n, ex) => n + ex.sets.filter((s) => s.completed).length,
        0
      ),
    [activeExercises]
  );

  const applyTemplate = useCallback((template: WorkoutTemplateRow) => {
    setWorkoutName(template.name);
    setNotes(template.notes ?? "");
    setSelectedTemplateId(template.id);
    setActiveExercises(
      [...template.exercises]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((ex) => ({
          clientId: newClientId(),
          exerciseId: ex.exerciseId,
          name: ex.name,
          category: ex.category,
          sets: Array.from({ length: Math.max(1, ex.defaultSetCount) }, (_, i) =>
            createSet(i + 1)
          ),
        }))
    );
    setError(null);
  }, []);

  const loadTemplate = useCallback(
    async (templateId: string) => {
      setLoadingTemplateId(templateId);
      setError(null);
      try {
        const res = await fetch(`/api/strength/templates/${templateId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "Kunne ikke laste mal.");
        }
        const data = (await res.json()) as { template: WorkoutTemplateRow };
        applyTemplate(data.template);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kunne ikke laste mal.");
      } finally {
        setLoadingTemplateId(null);
      }
    },
    [applyTemplate]
  );

  const addExercise = useCallback((exercise: ExerciseRow) => {
    setActiveExercises((prev) => [
      ...prev,
      {
        clientId: newClientId(),
        exerciseId: exercise.id,
        name: exercise.name,
        category: exercise.category,
        sets: [createSet(1)],
      },
    ]);
    setPickerOpen(false);
  }, []);

  function updateSet(
    exerciseClientId: string,
    setClientId: string,
    patch: Partial<ActiveSet>
  ) {
    setActiveExercises((prev) =>
      prev.map((ex) =>
        ex.clientId !== exerciseClientId
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s) =>
                s.clientId === setClientId ? { ...s, ...patch } : s
              ),
            }
      )
    );
  }

  function addSetToExercise(exerciseClientId: string) {
    setActiveExercises((prev) =>
      prev.map((ex) =>
        ex.clientId !== exerciseClientId
          ? ex
          : { ...ex, sets: [...ex.sets, createSet(ex.sets.length + 1)] }
      )
    );
  }

  function removeExercise(exerciseClientId: string) {
    setActiveExercises((prev) =>
      prev.filter((ex) => ex.clientId !== exerciseClientId)
    );
  }

  function resetWorkout() {
    setWorkoutName("Styrkeøkt");
    setNotes("");
    setSaveAsTemplate(false);
    setSelectedTemplateId("");
    setActiveExercises([]);
    setError(null);
  }

  function buildSetsPayload(completedOnly: boolean) {
    return activeExercises.flatMap((ex) =>
      ex.sets
        .filter((s) => !completedOnly || s.completed)
        .map((s) => ({
          exerciseId: ex.exerciseId,
          setNumber: s.setNumber,
          weightKg: s.weight.trim() ? parseFloat(s.weight) : null,
          reps: s.reps.trim() ? parseInt(s.reps, 10) : null,
          setType: s.setType,
          isCompleted: s.completed,
        }))
    );
  }

  async function saveWorkout(finish: boolean) {
    if (finish && completedCount === 0) {
      setError("Marker minst ett sett som fullført.");
      return;
    }

    const payload = {
      name: workoutName.trim() || "Styrkeøkt",
      notes: notes.trim() || null,
      sets: buildSetsPayload(finish),
      saveAsTemplate,
      finish,
      templateExercises: activeExercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        setCount: ex.sets.length || 1,
      })),
    };

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/strength/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Lagring feilet.");
      }

      resetWorkout();
      loadTemplates().then(setTemplates);
      onWorkoutSaved?.();
      onClose?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lagring feilet.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 border-b border-border px-4 py-3">
        <label className="block space-y-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Økt-navn
          </span>
          <Input
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            className="h-8 border-border/60 bg-secondary/20 text-xs"
            placeholder="f.eks. Push Day"
          />
        </label>

        {templates.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Fast økt
            </span>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={loadingTemplateId != null}
                  onClick={() => void loadTemplate(t.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-60",
                    selectedTemplateId === t.id
                      ? "border-primary/50 bg-primary/15 text-foreground"
                      : "border-border/60 bg-secondary/20 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  {loadingTemplateId === t.id && (
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  )}
                  {t.name}
                  <span className="text-[10px] opacity-70">
                    ({t.exercises.length})
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Klikk en mal for å laste inn øvelser.
            </p>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen((open) => !open)}
          className="h-8 w-full justify-between border-border/60 bg-secondary/20 text-xs font-normal"
        >
          <span className="flex items-center gap-2 truncate text-muted-foreground">
            <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
            Legg til øvelse
          </span>
          <ChevronsUpDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 opacity-50 transition-transform",
              pickerOpen && "rotate-180"
            )}
          />
        </Button>

        {pickerOpen && (
          <div className="overflow-hidden rounded-lg border border-border bg-card ring-1 ring-primary/15">
            <Command className="bg-transparent">
              <CommandInput placeholder="Søk øvelse…" className="text-xs" />
              <CommandList className="max-h-48">
                <CommandEmpty className="py-4 text-xs text-muted-foreground">
                  Ingen øvelse funnet.
                </CommandEmpty>
                <CommandGroup>
                  {exercises.map((ex) => (
                    <CommandItem
                      key={ex.id}
                      value={`${ex.name} ${ex.category}`}
                      onSelect={() => addExercise(ex)}
                      className="cursor-pointer text-xs"
                    >
                      <span className="flex-1 truncate">{ex.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {ex.category}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        )}

        <label className="block space-y-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Notat
          </span>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Notater om økten…"
            className="min-h-[3rem] border-border/60 bg-secondary/15 text-xs"
          />
        </label>

        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-secondary/15 px-3 py-2">
          <Checkbox
            checked={saveAsTemplate}
            onCheckedChange={(checked) => setSaveAsTemplate(checked === true)}
          />
          <span className="text-xs text-foreground">Lagre som fast økt</span>
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {activeExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Dumbbell className="h-8 w-8 text-primary/40" />
            <p className="text-xs text-muted-foreground">
              Legg til øvelser, eller lagre en tom plan med bare navn og notat.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeExercises.map((ex) => (
              <div
                key={ex.clientId}
                className="overflow-hidden rounded-lg border border-border/80 bg-secondary/10"
              >
                <div className="flex items-center gap-2 border-b border-border/60 bg-secondary/25 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {ex.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {ex.category}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExercise(ex.clientId)}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Fjern øvelse"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
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
                        set.completed && "bg-primary/10 ring-1 ring-primary/20"
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
                          updateSet(ex.clientId, set.clientId, {
                            weight: e.target.value,
                          })
                        }
                        className="h-7 border-border/50 bg-background/60 px-1.5 text-center text-xs tabular-nums"
                        placeholder="0"
                      />
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={set.reps}
                        onChange={(e) =>
                          updateSet(ex.clientId, set.clientId, {
                            reps: e.target.value,
                          })
                        }
                        className="h-7 border-border/50 bg-background/60 px-1.5 text-center text-xs tabular-nums"
                        placeholder="0"
                      />
                      <div className="flex justify-center">
                        <Checkbox
                          checked={set.completed}
                          onCheckedChange={(checked) =>
                            updateSet(ex.clientId, set.clientId, {
                              completed: checked === true,
                            })
                          }
                        />
                      </div>
                      <Select
                        value={set.setType}
                        onValueChange={(v) =>
                          updateSet(ex.clientId, set.clientId, {
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

                  <button
                    type="button"
                    onClick={() => addSetToExercise(ex.clientId)}
                    className="mt-1 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border/60 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                  >
                    <Plus className="h-3 w-3" />
                    Legg til sett
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-2 border-t border-border bg-card/80 p-4">
        {error && (
          <p className="text-center text-[10px] text-destructive">{error}</p>
        )}
        <p className="text-center text-[10px] text-muted-foreground">
          {completedCount} fullførte sett
        </p>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full gap-2 text-xs font-semibold"
          disabled={saving}
          onClick={() => void saveWorkout(false)}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Lagre plan
        </Button>
        <Button
          className="h-9 w-full gap-2 text-xs font-semibold"
          disabled={saving || completedCount === 0}
          onClick={() => void saveWorkout(true)}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Fullfør økt
        </Button>
      </div>
    </div>
  );
}
