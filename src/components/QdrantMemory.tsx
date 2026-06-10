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
    return "text-emerald-400";
  }
  if (
    s.includes("orange") ||
    s.includes("yellow") ||
    s.includes("warn") ||
    s.includes("degraded")
  ) {
    return "text-amber-400";
  }
  return "text-red-400";
}

function formatOptimizerLabel(raw: string | null | undefined): string {
  const t = (raw ?? "—").trim();
  const up = t.toUpperCase();
  return up || "—";
}

export function QdrantMemory() {
  const [data, setData] = useState<QdrantStatusRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/qdrant-status", { cache: "no-store" });
      const payload = (await res.json()) as {
        status: QdrantStatusRow | null;
        error?: string;
      };
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
    data?.points_count != null ? Number(data.points_count) : NaN;
  const vectors =
    data?.vectors_count != null ? Number(data.vectors_count) : NaN;
  const statusDot = data ? ledClass(data.status) : "text-zinc-500";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-4 py-2">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-500">
            ▸ QDRANT — langtidshukommelse
          </p>
          {data && (
            <span className={cn("text-xs", statusDot)} aria-hidden>
              ●
            </span>
          )}
          {errorMsg && (
            <span className="ml-auto font-mono text-[9px] uppercase tracking-wide text-red-400">
              {errorMsg}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 p-4">
        {loading && (
          <p className="animate-pulse font-mono text-xs text-zinc-500">
            Laster…
          </p>
        )}

        {!loading && !data && (
          <p className="font-mono text-xs text-zinc-500">
            Ingen rad i{" "}
            <span className="text-violet-400">qdrant_status</span>.
          </p>
        )}

        {!loading && data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-zinc-800 bg-zinc-800/40 p-3 text-center space-y-1">
                <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-zinc-500">
                  Minner
                </p>
                <p
                  className={cn(
                    "font-mono text-2xl font-bold tabular-nums",
                    Number.isFinite(points) ? "text-emerald-400" : "text-zinc-100"
                  )}
                >
                  {Number.isFinite(points)
                    ? points.toLocaleString("nb-NO")
                    : "—"}
                </p>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-800/40 p-3 text-center space-y-1">
                <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-zinc-500">
                  Vektorer
                </p>
                <p className="font-mono text-2xl font-bold tabular-nums text-violet-400">
                  {Number.isFinite(vectors)
                    ? vectors.toLocaleString("nb-NO")
                    : "—"}
                </p>
              </div>
            </div>

            <div className="space-y-2 rounded-md border border-zinc-800 bg-zinc-800/40 p-4">
              <div className="flex items-baseline gap-3">
                <span className="w-24 shrink-0 font-mono text-[10px] tracking-widest uppercase text-zinc-500">
                  Status
                </span>
                <span
                  className={cn(
                    "font-mono text-sm font-semibold uppercase",
                    statusDot
                  )}
                >
                  {data.status ?? "—"}
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="w-24 shrink-0 font-mono text-[10px] tracking-widest uppercase text-zinc-500">
                  Optimizer
                </span>
                <span className="font-mono text-sm font-semibold tabular-nums text-zinc-100">
                  {formatOptimizerLabel(data.optimizer_status)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
