"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { AppModal } from "@/components/AppModal";
import { cn } from "@/lib/utils";
import type { ExerciseRow, WorkoutTemplateRow } from "@/lib/strength";

interface EditableExercise {
  exerciseId: string;
  name: string;
  category: string;
  setCount: number;
}

interface FastOktEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}

function loadTemplates(): Promise<WorkoutTemplateRow[]> {
  return fetch("/api/strength/templates", { cache: "no-store" })
    .then((r) => r.json())
    .then((d) => (d.templates as WorkoutTemplateRow[]) ?? [])
    .catch(() => []);
}

function loadExercises(): Promise<ExerciseRow[]> {
  return fetch("/api/strength/exercises")
    .then((r) => r.json())
    .then((d) => (d.exercises as ExerciseRow[]) ?? [])
    .catch(() => []);
}

export function FastOktEditor({
  open,
  onOpenChange,
  onChanged,
}: FastOktEditorProps) {
  const [templates, setTemplates] = useState<WorkoutTemplateRow[]>([]);
  const [catalog, setCatalog] = useState<ExerciseRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<EditableExercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplateIntoForm = useCallback((template: WorkoutTemplateRow) => {
    setSelectedId(template.id);
    setName(template.name);
    setNotes(template.notes ?? "");
    setExercises(
      [...template.exercises]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((ex) => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
          category: ex.category,
          setCount: ex.defaultSetCount,
        }))
    );
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([loadTemplates(), loadExercises()])
      .then(([rows, exs]) => {
        setTemplates(rows);
        setCatalog(exs);
        if (rows.length > 0) {
          loadTemplateIntoForm(rows[0]);
        } else {
          setSelectedId(null);
          setName("");
          setNotes("");
          setExercises([]);
        }
      })
      .finally(() => setLoading(false));
  }, [open, loadTemplateIntoForm]);

  function moveExercise(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= exercises.length) return;
    setExercises((prev) => {
      const copy = [...prev];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  }

  function addExercise(exercise: ExerciseRow) {
    if (exercises.some((e) => e.exerciseId === exercise.id)) return;
    setExercises((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        name: exercise.name,
        category: exercise.category,
        setCount: 3,
      },
    ]);
    setPickerOpen(false);
  }

  async function saveTemplate() {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/strength/templates/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          notes: notes.trim() || null,
          exercises: exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            setCount: ex.setCount,
          })),
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Lagring feilet");
      }
      const data = (await res.json()) as { template: WorkoutTemplateRow };
      const rows = await loadTemplates();
      setTemplates(rows);
      loadTemplateIntoForm(data.template);
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lagring feilet");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate() {
    if (!selectedId) return;
    if (!window.confirm(`Slette malen «${name}»?`)) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/strength/templates/${selectedId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Sletting feilet");
      }
      const rows = await loadTemplates();
      setTemplates(rows);
      if (rows.length > 0) {
        loadTemplateIntoForm(rows[0]);
      } else {
        setSelectedId(null);
        setName("");
        setNotes("");
        setExercises([]);
      }
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sletting feilet");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal
      open={open}
      onClose={() => onOpenChange(false)}
      title="Rediger faste økter"
      description="Endre navn, øvelser og antall sett for malene dine."
      maxWidth="max-w-lg"
      footer={
        templates.length > 0 ? (
          <div className="space-y-2 p-4">
            <Button
              className="h-9 w-full gap-2 text-xs font-semibold"
              disabled={saving || !selectedId}
              onClick={() => void saveTemplate()}
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Lagre endringer
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full gap-2 text-xs text-destructive hover:text-destructive"
              disabled={saving || !selectedId}
              onClick={() => void deleteTemplate()}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Slett mal
            </Button>
          </div>
        ) : undefined
      }
    >
        <div className="px-4 py-3 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Laster maler…
            </div>
          ) : templates.length === 0 ? (
            <p className="py-12 text-center text-xs text-muted-foreground">
              Ingen faste økter ennå. Huk av «Lagre som fast økt» når du lagrer
              en plan.
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Velg mal
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => loadTemplateIntoForm(t)}
                      className={cn(
                        "rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                        selectedId === t.id
                          ? "border-primary/50 bg-primary/15 text-foreground"
                          : "border-border/60 bg-secondary/20 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block space-y-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Navn
                </span>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 border-border/60 bg-secondary/20 text-xs"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Notat
                </span>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="min-h-[3rem] border-border/60 bg-secondary/15 text-xs"
                />
              </label>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Øvelser
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-[10px]"
                    onClick={() => setPickerOpen((v) => !v)}
                  >
                    <Plus className="h-3 w-3" />
                    Legg til
                  </Button>
                </div>

                {pickerOpen && (
                  <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <Command className="bg-transparent">
                      <CommandInput placeholder="Søk øvelse…" className="text-xs" />
                      <CommandList className="max-h-40">
                        <CommandEmpty className="py-3 text-xs text-muted-foreground">
                          Ingen øvelse funnet.
                        </CommandEmpty>
                        <CommandGroup>
                          {catalog.map((ex) => (
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

                {exercises.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border/60 py-6 text-center text-[11px] text-muted-foreground">
                    Ingen øvelser i malen.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {exercises.map((ex, index) => (
                      <li
                        key={ex.exerciseId}
                        className="flex items-center gap-2 rounded-lg border border-border/70 bg-secondary/15 px-2.5 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{ex.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {ex.category}
                          </p>
                        </div>
                        <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          Sett
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={ex.setCount}
                            onChange={(e) => {
                              const n = parseInt(e.target.value, 10);
                              setExercises((prev) =>
                                prev.map((item, i) =>
                                  i === index
                                    ? {
                                        ...item,
                                        setCount: Number.isFinite(n)
                                          ? Math.max(1, n)
                                          : 1,
                                      }
                                    : item
                                )
                              );
                            }}
                            className="h-7 w-12 border-border/50 bg-background/60 px-1 text-center text-xs tabular-nums"
                          />
                        </label>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveExercise(index, -1)}
                            className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                            aria-label="Flytt opp"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === exercises.length - 1}
                            onClick={() => moveExercise(index, 1)}
                            className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                            aria-label="Flytt ned"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setExercises((prev) =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Fjern øvelse"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {error && (
                <p className="text-[11px] text-destructive">{error}</p>
              )}
            </>
          )}
        </div>
    </AppModal>
  );
}
