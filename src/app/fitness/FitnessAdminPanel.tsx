"use client";

import { useCallback, useEffect, useState } from "react";
import { Dumbbell, Loader2, Pencil, Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppModal } from "@/components/AppModal";
import { LiveWorkoutLogger } from "./LiveWorkoutLogger";
import { StrengthTrainingLog } from "./StrengthTrainingLog";
import type { ExerciseRow } from "@/lib/strength";

/* ------------------------------------------------------------------ */
/* Exercise manager                                                      */
/* ------------------------------------------------------------------ */

interface ExerciseFormState {
  id: string | null;
  name: string;
  category: string;
  mechanics: string;
}

function blankForm(): ExerciseFormState {
  return { id: null, name: "", category: "", mechanics: "" };
}

function ExerciseManager() {
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ExerciseFormState>(blankForm());
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/strength/exercises")
      .then((r) => r.json())
      .then((d) => setExercises((d.exercises as ExerciseRow[]) ?? []))
      .catch(() => setExercises([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setForm(blankForm());
    setEditing(true);
    setError(null);
  }

  function openEdit(ex: ExerciseRow) {
    setForm({ id: ex.id, name: ex.name, category: ex.category, mechanics: ex.mechanics ?? "" });
    setEditing(true);
    setError(null);
  }

  async function handleSave() {
    const { id, name, category, mechanics } = form;
    if (!name.trim() || !category.trim()) {
      setError("Navn og kategori er påkrevd.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = id ? `/api/strength/exercises/${id}` : "/api/strength/exercises";
      const method = id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), category: category.trim(), mechanics: mechanics.trim() || null }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Lagring feilet");
      }
      setEditing(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Feil ved lagring");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-gradient-to-br from-primary/[0.06] via-card to-card px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
            <Dumbbell className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Øvelsesoversikt</h2>
            <p className="text-xs text-muted-foreground">
              {loading ? "Laster…" : `${exercises.length} øvelser`}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs font-semibold"
          onClick={openNew}
        >
          <Plus className="h-3.5 w-3.5" />
          Ny øvelse
        </Button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary/70" />
          Henter øvelser…
        </div>
      ) : exercises.length === 0 ? (
        <p className="py-10 text-center text-xs text-muted-foreground">
          Ingen øvelser ennå. Trykk «Ny øvelse» for å legge til.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3 border-b border-border/60 bg-secondary/20 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <span className="min-w-0 flex-1">Navn</span>
            <span className="w-28 shrink-0">Kategori</span>
            <span className="hidden w-28 shrink-0 sm:inline">Mekanikk</span>
            <span className="w-8 shrink-0" />
          </div>
          <div className="divide-y divide-border/60">
            {exercises.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                  {ex.name}
                </p>
                <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">
                  {ex.category}
                </span>
                <span className="hidden w-28 shrink-0 truncate text-xs text-muted-foreground sm:inline">
                  {ex.mechanics ?? "—"}
                </span>
                <button
                  type="button"
                  onClick={() => openEdit(ex)}
                  className="w-8 shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label={`Rediger ${ex.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Edit / new exercise modal */}
      <AppModal
        open={editing}
        onClose={() => setEditing(false)}
        title={form.id ? "Rediger øvelse" : "Ny øvelse"}
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center gap-2 p-4">
            <Button
              type="button"
              variant="outline"
              className="h-9 flex-1 text-xs"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Avbryt
            </Button>
            <Button
              className="h-9 flex-1 gap-2 text-xs font-semibold"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Lagre
            </Button>
          </div>
        }
      >
        <div className="space-y-3 px-4 py-4">
          <label className="block space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Navn *
            </span>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="f.eks. Benkpress"
              className="h-8 border-border/60 bg-secondary/20 text-xs"
              autoFocus
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Kategori *
            </span>
            <Input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="f.eks. Bryst"
              className="h-8 border-border/60 bg-secondary/20 text-xs"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Mekanikk
            </span>
            <Input
              value={form.mechanics}
              onChange={(e) => setForm((f) => ({ ...f, mechanics: e.target.value }))}
              placeholder="f.eks. Compound"
              className="h-8 border-border/60 bg-secondary/20 text-xs"
            />
          </label>
          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>
      </AppModal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Admin panel                                                           */
/* ------------------------------------------------------------------ */

interface FitnessAdminPanelProps {
  refreshKey?: number;
  onWorkoutSaved?: () => void;
}

export function FitnessAdminPanel({ refreshKey = 0, onWorkoutSaved }: FitnessAdminPanelProps) {
  const [logOpen, setLogOpen] = useState(false);
  const [templateVersion] = useState(0);
  const [innerRefresh, setInnerRefresh] = useState(0);

  function handleSaved() {
    setLogOpen(false);
    setInnerRefresh((n) => n + 1);
    onWorkoutSaved?.();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Admin</h2>
          <p className="text-xs text-muted-foreground">Øvelser og økt-historikk</p>
        </div>
        <Button
          className="h-9 gap-2 text-xs font-semibold"
          onClick={() => setLogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Logg ny økt
        </Button>
      </div>

      <StrengthTrainingLog refreshKey={refreshKey + innerRefresh} />

      <ExerciseManager />

      <AppModal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            Styrkeøkt
          </span>
        }
        description="Planlegg hjemme eller logg sett underveis."
        maxWidth="max-w-xl"
        closeOnBackdrop={false}
      >
        <LiveWorkoutLogger
          templateVersion={templateVersion}
          onWorkoutSaved={handleSaved}
          onClose={() => setLogOpen(false)}
        />
      </AppModal>
    </div>
  );
}
