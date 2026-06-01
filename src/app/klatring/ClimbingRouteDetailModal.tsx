"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Star, Trash2 } from "lucide-react";
import { AppModal } from "@/components/AppModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FRENCH_GRADES,
  toDateInputValue,
  type ClimbingRoute,
} from "@/lib/climbing";

const nativeSelectClass =
  "h-9 w-full cursor-pointer rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface ClimbingRouteDetailModalProps {
  route: ClimbingRoute;
  crags: string[];
  onClose: () => void;
  onSaved?: () => void;
  onDeleted?: () => void;
}

function GradePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (grad: string) => void;
}) {
  const options = useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed || (FRENCH_GRADES as readonly string[]).includes(trimmed)) {
      return FRENCH_GRADES;
    }
    return [trimmed, ...FRENCH_GRADES] as readonly string[];
  }, [value]);

  return (
    <div className="max-h-36 overflow-y-auto rounded-lg border border-border bg-secondary/10 p-2">
      <div className="grid grid-cols-5 gap-1 sm:grid-cols-6">
        {options.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            className={cn(
              "rounded-md px-1 py-1.5 text-center text-xs font-medium tabular-nums transition-colors",
              value === g
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-background text-foreground ring-1 ring-border/80 hover:bg-primary/10 hover:ring-primary/30"
            )}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ClimbingRouteDetailModal({
  route,
  crags,
  onClose,
  onSaved,
  onDeleted,
}: ClimbingRouteDetailModalProps) {
  const [crag, setCrag] = useState(route.crag);
  const [rutenavn, setRutenavn] = useState(route.rutenavn);
  const [grad, setGrad] = useState(route.grad.trim());
  const [stjerner, setStjerner] = useState(route.stjerner);
  const [datoSend, setDatoSend] = useState(toDateInputValue(route.dato_send));
  const [flash, setFlash] = useState(route.flash);
  const [kommentar, setKommentar] = useState(route.kommentar ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCrag(route.crag);
    setRutenavn(route.rutenavn);
    setGrad(route.grad.trim());
    setStjerner(route.stjerner);
    setDatoSend(toDateInputValue(route.dato_send));
    setFlash(route.flash);
    setKommentar(route.kommentar ?? "");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- synk skjema kun ved bytte rute (id)
  }, [route.id]);

  const cragChoices = useMemo(() => {
    const names = new Set(crags);
    names.add(route.crag);
    names.add(crag);
    return Array.from(names).sort((a, b) => a.localeCompare(b, "nb"));
  }, [crags, route.crag, crag]);

  const status = datoSend ? "send" : "prosjekt";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/climbing-routes/${route.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crag: crag.trim(),
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
      onSaved?.();
      onClose();
    } catch {
      setError("Nettverksfeil — prøv igjen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `Slette «${route.rutenavn}» (${route.crag})? Dette kan ikke angres.`
      )
    ) {
      return;
    }
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/climbing-routes/${route.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Kunne ikke slette.");
        return;
      }
      onDeleted?.();
      onClose();
    } catch {
      setError("Nettverksfeil — prøv igjen.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppModal
      open
      onClose={onClose}
      aria-labelledby="route-detail-title"
      title={
        <span id="route-detail-title" className="truncate">
          {route.rutenavn}
        </span>
      }
      description={
        <span className="flex flex-wrap items-center gap-2">
          <Badge
            variant={status === "prosjekt" ? "outline" : "secondary"}
            className={cn(
              "h-5 text-[9px]",
              status === "prosjekt" && "border-primary/30 text-primary"
            )}
          >
            {status === "prosjekt" ? "Prosjekt" : "Send"}
          </Badge>
          <span>
            {grad} · {crag}
          </span>
        </span>
      }
      footer={
        <div className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            className="order-2 h-9 gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:order-1 sm:mr-auto"
            disabled={saving || deleting}
            onClick={handleDelete}
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Slett rute
          </Button>
          <Button
            type="button"
            variant="outline"
            className="order-3 h-9 sm:order-2"
            disabled={saving || deleting}
            onClick={onClose}
          >
            Avbryt
          </Button>
          <Button
            type="submit"
            form="route-detail-form"
            className="order-1 h-9 sm:order-3"
            disabled={saving || deleting}
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Lagrer…
              </>
            ) : (
              "Lagre endringer"
            )}
          </Button>
        </div>
      }
    >
      <form id="route-detail-form" onSubmit={handleSave}>
        <div className="space-y-4 px-4 py-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Crag</p>
              <select
                value={crag}
                onChange={(e) => setCrag(e.target.value)}
                className={nativeSelectClass}
              >
                {cragChoices.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Rutenavn</p>
              <Input
                value={rutenavn}
                onChange={(e) => setRutenavn(e.target.value)}
                className="h-9"
                required
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Grad (fransk)</p>
              <p className="text-[10px] text-muted-foreground">
                Valgt: <span className="font-semibold text-primary">{grad}</span>
              </p>
              <GradePicker value={grad} onChange={setGrad} />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Stjerner (0–3)</p>
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStjerner(n)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-0.5 rounded-lg border py-2 text-xs transition-colors",
                      stjerner === n
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/20"
                    )}
                  >
                    {n === 0 ? (
                      "—"
                    ) : (
                      Array.from({ length: n }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Dato for send</p>
              <Input
                type="date"
                value={datoSend}
                onChange={(e) => setDatoSend(e.target.value)}
                className="h-9"
              />
              <p className="text-[10px] text-muted-foreground">
                Tom dato ={" "}
                <span className="font-medium text-foreground">Prosjekt</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="route-flash"
                checked={flash}
                disabled={!datoSend}
                onCheckedChange={(c) => setFlash(c === true)}
              />
              <label
                htmlFor="route-flash"
                className={cn(
                  "cursor-pointer text-xs",
                  !datoSend && "text-muted-foreground/60"
                )}
              >
                Flash
              </label>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Kommentar</p>
              <Textarea
                value={kommentar}
                onChange={(e) => setKommentar(e.target.value)}
                rows={3}
                className="min-h-[72px] resize-none text-sm"
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </form>
    </AppModal>
  );
}
