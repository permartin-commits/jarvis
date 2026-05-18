"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface QdrantStatusRow {
  id: number;
  status: string | null;
  points_count: string | number | null;
  vectors_count: string | number | null;
  optimizer_status: string | null;
}

const POLL_MS = 30_000;

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function ledClass(statusRaw: string | null | undefined): string {
  const s = norm(statusRaw);
  if (s === "green" || s === "ok" || s === "healthy") {
    return "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.65)] animate-pulse";
  }
  if (
    s.includes("orange") ||
    s.includes("yellow") ||
    s.includes("warn") ||
    s.includes("degraded")
  ) {
    return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse";
  }
  return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.55)] animate-pulse";
}

function formatOptimizerLabel(raw: string | null | undefined): string {
  const t = (raw ?? "—").trim();
  const up = t.toUpperCase();
  return `[ OPTIMIZER: ${up || "—"} ]`;
}

export function QdrantMemory() {
  const [data, setData]           = useState<QdrantStatusRow | null>(null);
  const [loading, setLoading]     = useState(true);
  const [errorMsg, setErrorMsg]    = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/qdrant-status", { cache: "no-store" });
      const payload = await res.json() as { status: QdrantStatusRow | null; error?: string };
      setData(payload.status);
      setErrorMsg(res.ok ? null : (payload.error ?? "Feil ved lasting"));
    } catch {
      setErrorMsg("Nettverksfeil");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const points =
    data?.points_count != null
      ? Number(data.points_count)
      : NaN;
  const vectors =
    data?.vectors_count != null
      ? Number(data.vectors_count)
      : NaN;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-card border-border",
        "font-mono"
      )}
    >
      <div className="px-5 pt-5 pb-4 border-b border-border bg-secondary/20">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "h-3 w-3 shrink-0 rounded-full ring-2 ring-black/40",
              data ? ledClass(data.status) : "bg-muted-foreground/40"
            )}
            aria-hidden
          />
          <h2 className="text-[11px] font-bold tracking-[0.35em] text-foreground uppercase">
            QDRANT
          </h2>
          {errorMsg && (
            <span className="text-[10px] text-red-400 uppercase tracking-wide ml-auto">
              {errorMsg}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 pb-8">
        {loading ? (
          <div className="h-14 rounded bg-secondary/40 animate-pulse" />
        ) : !data ? (
          <p className="text-sm text-muted-foreground">
            Ingen rad med <span className="text-foreground">id = 1</span> i{" "}
            <span className="text-primary">qdrant_status</span>.
          </p>
        ) : (
          <div className="space-y-1">
            <p
              className="text-4xl md:text-5xl font-bold tabular-nums tracking-tight"
              style={{
                color: "#34d399",
                textShadow: "0 0 24px rgba(52,211,153,0.35)",
              }}
            >
              {Number.isFinite(points)
                ? points.toLocaleString("nb-NO")
                : "—"}
            </p>
            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
              Aktive minner
            </p>
            {Number.isFinite(vectors) && (
              <p className="pt-3 text-[10px] text-muted-foreground/80 uppercase tracking-wide">
                Vektorer:{" "}
                <span className="text-foreground/90 tabular-nums">
                  {vectors.toLocaleString("nb-NO")}
                </span>
              </p>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-3 right-4 text-[9px] text-muted-foreground/70 tracking-[0.12em]">
        {loading ? "[ OPTIMIZER: … ]" : formatOptimizerLabel(data?.optimizer_status)}
      </div>
    </div>
  );
}
