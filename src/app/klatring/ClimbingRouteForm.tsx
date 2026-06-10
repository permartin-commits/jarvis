"use client";

import { useState, useEffect } from "react";
import { Loader2, Mountain, Plus, Star } from "lucide-react";
import { AppModal } from "@/components/AppModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { KLATRING_PANEL_BUTTON_CLASS } from "./klatring-panel-buttons";
import { FRENCH_GRADES } from "@/lib/climbing";

const ROUTE_FORM_ID = "climbing-route-register-form";

interface ClimbingRouteFormProps {
  onSaved?: () => void;
  onClose?: () => void;
  onSavingChange?: (saving: boolean) => void;
}

const nativeSelectClass =
  "h-9 w-full rounded-lg border border-border/60 bg-secondary/20 px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function loadCrags(): Promise<string[]> {
  return fetch("/api/climbing-routes")
    .then((r) => r.json())
    .then((d) => (d.crags as string[]) ?? [])
    .catch(() => []);
}

export function ClimbingRouteForm({
  onSaved,
  onClose,
  onSavingChange,
}: ClimbingRouteFormProps) {
  const [crags, setCrags] = useState<string[]>([]);
  const [cragMode, setCragMode] = useState<"existing" | "new">("existing");
  const [selectedCrag, setSelectedCrag] = useState("");
  const [newCrag, setNewCrag] = useState("");
  const [rutenavn, setRutenavn] = useState("");
  const [grad, setGrad] = useState<string>(FRENCH_GRADES[10]);
  const [stjerner, setStjerner] = useState(0);
  const [datoSend, setDatoSend] = useState("");
  const [flash, setFlash] = useState(false);
  const [kommentar, setKommentar] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCrags().then((list) => {
      setCrags(list);
      if (list.length === 0) {
        setCragMode("new");
      } else {
        setSelectedCrag(list[0]);
      }
    });
  }, []);

  function resetForm() {
    setRutenavn("");
    setGrad(FRENCH_GRADES[10]);
    setStjerner(0);
    setDatoSend("");
    setFlash(false);
    setKommentar("");
    setNewCrag("");
    setError(null);
    if (crags.length > 0) {
      setCragMode("existing");
      setSelectedCrag(crags[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const crag =
      cragMode === "existing" ? selectedCrag.trim() : newCrag.trim();
    if (!crag) {
      setError("Velg eller skriv inn crag.");
      return;
    }
    if (!rutenavn.trim()) {
      setError("Rutenavn er påkrevd.");
      return;
    }

    onSavingChange?.(true);
    try {
      const res = await fetch("/api/climbing-routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crag,
          rutenavn: rutenavn.trim(),
          grad,
          stjerner,
          dato_send: datoSend || null,
          flash: datoSend ? flash : false,
          kommentar: kommentar.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kunne ikke lagre.");
        return;
      }
      resetForm();
      const updated = await loadCrags();
      setCrags(updated);
      if (updated.length > 0 && cragMode === "new") {
        setSelectedCrag(crag);
        setCragMode("existing");
      }
      onSaved?.();
      onClose?.();
    } catch {
      setError("Nettverksfeil — prøv igjen.");
    } finally {
      onSavingChange?.(false);
    }
  }

  return (
    <form
      id={ROUTE_FORM_ID}
      onSubmit={handleSubmit}
      className="space-y-4 px-4 py-4"
    >
      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Crag
        </p>
        {crags.length > 0 && (
          <div className="flex gap-1 rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setCragMode("existing")}
              className={cn(
                "flex-1 rounded-md py-1.5 text-[11px] font-medium transition-colors",
                cragMode === "existing"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Eksisterende
            </button>
            <button
              type="button"
              onClick={() => setCragMode("new")}
              className={cn(
                "flex-1 rounded-md py-1.5 text-[11px] font-medium transition-colors",
                cragMode === "new"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Nytt crag
            </button>
          </div>
        )}
        {cragMode === "existing" && crags.length > 0 ? (
          <select
            value={selectedCrag}
            onChange={(e) => setSelectedCrag(e.target.value)}
            className={nativeSelectClass}
          >
            {crags.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        ) : (
          <Input
            value={newCrag}
            onChange={(e) => setNewCrag(e.target.value)}
            placeholder="Navn på crag / område"
            className="h-9"
          />
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Rutenavn
        </p>
        <Input
          value={rutenavn}
          onChange={(e) => setRutenavn(e.target.value)}
          placeholder="F.eks. Den blå sirkelen"
          className="h-9"
          required
        />
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Grad (fransk)
        </p>
        <select
          value={grad}
          onChange={(e) => setGrad(e.target.value)}
          className={nativeSelectClass}
        >
          {FRENCH_GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Stjerner (0–3)
        </p>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStjerner(n)}
              className={cn(
                "flex flex-1 items-center justify-center gap-0.5 rounded-md border py-2 text-xs transition-colors",
                stjerner === n
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/20"
              )}
            >
              {n === 0 ? (
                "—"
              ) : (
                Array.from({ length: n }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 fill-current"
                  />
                ))
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Dato for send
        </p>
        <Input
          type="date"
          value={datoSend}
          onChange={(e) => setDatoSend(e.target.value)}
          className="h-9"
        />
        <p className="text-[10px] text-muted-foreground">
          Uten dato registreres ruten som{" "}
          <span className="font-medium text-foreground">Prosjekt</span>.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="flash"
          checked={flash}
          disabled={!datoSend}
          onCheckedChange={(c) => setFlash(c === true)}
        />
        <label
          htmlFor="flash"
          className={cn(
            "cursor-pointer text-xs",
            !datoSend && "text-muted-foreground/60"
          )}
        >
          Flash
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Kommentar
        </p>
        <Textarea
          value={kommentar}
          onChange={(e) => setKommentar(e.target.value)}
          placeholder="Beta, forhold, notater…"
          rows={2}
          className="min-h-[56px] resize-none rounded-lg border border-border/60 bg-secondary/15 text-sm"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}

/** Knapp i høyre panel — åpner AppModal for ny rute. */
export function ClimbingRouteRegisterButton({
  onRouteSaved,
}: {
  onRouteSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleClose() {
    if (saving) return;
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={KLATRING_PANEL_BUTTON_CLASS}
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Registrer rute
      </Button>

      <AppModal
        open={open}
        onClose={handleClose}
        closeOnBackdrop={!saving}
        showCloseButton={!saving}
        maxWidth="max-w-md"
        aria-labelledby="climbing-route-register-title"
        title={
          <span id="climbing-route-register-title" className="flex items-center gap-2">
            <Mountain className="h-4 w-4 text-primary" />
            Ny rute
          </span>
        }
        description="Logg send eller prosjekt. Uten send-dato tagges ruten som Prosjekt."
        footer={
          <div className="flex gap-2 px-4 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-9 flex-1 text-xs"
              disabled={saving}
              onClick={handleClose}
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              form={ROUTE_FORM_ID}
              className="h-9 flex-1 gap-2 text-xs font-semibold"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Lagrer…
                </>
              ) : (
                <>
                  <Mountain className="h-3.5 w-3.5" />
                  Lagre rute
                </>
              )}
            </Button>
          </div>
        }
      >
        <ClimbingRouteForm
          onSaved={onRouteSaved}
          onClose={() => setOpen(false)}
          onSavingChange={setSaving}
        />
      </AppModal>
    </>
  );
}
