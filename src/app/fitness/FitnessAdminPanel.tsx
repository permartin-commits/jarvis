"use client";

import { useCallback, useEffect, useState } from "react";
import { Dumbbell, Loader2, Pencil, Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppModal } from "@/components/AppModal";
import { LiveWorkoutLogger } from "./LiveWorkoutLogger";
import { StrengthTrainingLog } from "./StrengthTrainingLog";
import { cn } from "@/lib/utils";
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

function ExerciseManager({ dark = false }: { dark?: boolean }) {
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
    <section
      className={cn(
        "overflow-hidden rounded-xl border",
        dark ? "border-zinc-800 bg-zinc-900/40" : "border-border"
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-3 border-b px-4 py-3.5",
          dark
            ? "border-zinc-800 bg-zinc-900/60"
            : "border-border bg-gradient-to-br from-primary/[0.06] via-card to-card"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
              dark
                ? "bg-violet-500/10 ring-violet-500/25"
                : "bg-primary/15 ring-primary/25"
            )}
          >
            <Dumbbell className={cn("h-4 w-4", dark ? "text-violet-400" : "text-primary")} />
          </div>
          <div>
            <h2 className={cn("text-sm font-semibold tracking-tight", dark ? "text-zinc-100" : "text-foreground")}>
              Øvelsesoversikt
            </h2>
            <p className={cn("text-xs", dark ? "text-zinc-500" : "text-muted-foreground")}>
              {loading ? "Laster…" : `${exercises.length} øvelser`}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant={dark ? "outline" : "default"}
          className={cn(
            "h-8 gap-1.5 text-xs font-semibold",
            dark && "border-zinc-700 bg-zinc-900/60 text-zinc-200 hover:border-violet-500/35 hover:bg-zinc-800"
          )}
          onClick={openNew}
        >
          <Plus className="h-3.5 w-3.5" />
          Ny øvelse
        </Button>
      </header>

      {loading ? (
        <div className={cn("flex items-center justify-center gap-2 py-10 text-xs", dark ? "text-zinc-500" : "text-muted-foreground")}>
          <Loader2 className={cn("h-4 w-4 animate-spin", dark ? "text-violet-400/70" : "text-primary/70")} />
          Henter øvelser…
        </div>
      ) : exercises.length === 0 ? (
        <p className={cn("py-10 text-center text-xs", dark ? "text-zinc-500" : "text-muted-foreground")}>
          Ingen øvelser ennå. Trykk «Ny øvelse» for å legge til.
        </p>
      ) : (
        <>
          <div
            className={cn(
              "flex items-center gap-3 border-b px-4 py-2 text-[10px] font-medium uppercase tracking-wider",
              dark
                ? "border-zinc-800 bg-zinc-900/60 text-zinc-600"
                : "border-border/60 bg-secondary/20 text-muted-foreground"
            )}
          >
            <span className="min-w-0 flex-1">Navn</span>
            <span className="w-28 shrink-0">Kategori</span>
            <span className="hidden w-28 shrink-0 sm:inline">Mekanikk</span>
            <span className="w-8 shrink-0" />
          </div>
          <div className={cn("divide-y", dark ? "divide-zinc-800/70" : "divide-border/60")}>
            {exercises.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <p className={cn("min-w-0 flex-1 truncate text-xs font-medium", dark ? "text-zinc-200" : "text-foreground")}>
                  {ex.name}
                </p>
                <span className={cn("w-28 shrink-0 truncate text-xs", dark ? "text-zinc-500" : "text-muted-foreground")}>
                  {ex.category}
                </span>
                <span className={cn("hidden w-28 shrink-0 truncate text-xs sm:inline", dark ? "text-zinc-500" : "text-muted-foreground")}>
                  {ex.mechanics ?? "—"}
                </span>
                <button
                  type="button"
                  onClick={() => openEdit(ex)}
                  className={cn(
                    "w-8 shrink-0 rounded p-1 transition-colors",
                    dark
                      ? "text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
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
  dark?: boolean;
}

export function FitnessAdminPanel({ refreshKey = 0, onWorkoutSaved, dark = false }: FitnessAdminPanelProps) {
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
          <h2 className={cn("text-sm font-semibold", dark ? "text-zinc-100" : "text-foreground")}>Admin</h2>
          <p className={cn("text-xs", dark ? "text-zinc-500" : "text-muted-foreground")}>Øvelser og økt-historikk</p>
        </div>
        <Button
          variant={dark ? "outline" : "default"}
          className={cn(
            "h-9 gap-2 text-xs font-semibold",
            dark &&
              "border-zinc-700/80 bg-zinc-900/60 text-zinc-200 shadow-none hover:border-violet-500/35 hover:bg-zinc-800 hover:text-violet-100"
          )}
          onClick={() => setLogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Logg ny økt
        </Button>
      </div>

      <StrengthTrainingLog refreshKey={refreshKey + innerRefresh} dark={dark} />

      <ExerciseManager dark={dark} />

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
