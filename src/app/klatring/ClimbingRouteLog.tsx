"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowUpDown, ChevronDown, ChevronUp, Mountain, Star, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClimbingRoute } from "@/lib/climbing";
import { gradeIndex, routeStatus } from "@/lib/climbing";
import { ClimbingSendsBarChart } from "./ClimbingSendsBarChart";
import { ClimbingRouteDetailModal } from "./ClimbingRouteDetailModal";

const PREVIEW_COUNT = 8;
const ALL_CRAG = "Alle";

const cragSelectClass =
  "h-8 min-w-[9rem] max-w-[12rem] rounded-lg border border-border bg-secondary/30 px-2.5 text-xs text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type SortCol = "crag" | "rutenavn" | "grad" | "dato_send";
type SortDir = "asc" | "desc";

function loadRoutes(): Promise<ClimbingRoute[]> {
  return fetch("/api/climbing-routes")
    .then((r) => r.json())
    .then((d) => (d.routes as ClimbingRoute[]) ?? [])
    .catch(() => []);
}

function formatSendDate(iso: string | null): string {
  if (!iso) return "—";
  const d = iso.slice(0, 10);
  return new Date(d + "T12:00:00").toLocaleDateString("nb-NO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StarRating({ count }: { count: number }) {
  if (count === 0) {
    return <span className="text-muted-foreground/50">—</span>;
  }
  return (
    <span className="inline-flex gap-0.5 text-amber-500">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-3 w-3 fill-current" />
      ))}
    </span>
  );
}

export function ClimbingRouteLog({ refreshKey = 0 }: { refreshKey?: number }) {
  const [routes, setRoutes] = useState<ClimbingRoute[]>([]);
  const [sortCol, setSortCol] = useState<SortCol>("dato_send");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showAll, setShowAll] = useState(false);
  const [cragFilter, setCragFilter] = useState(ALL_CRAG);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  function reload() {
    return loadRoutes().then(setRoutes);
  }

  useEffect(() => {
    reload();
  }, [refreshKey]);

  const selectedRoute =
    selectedId != null
      ? routes.find((r) => r.id === selectedId) ?? null
      : null;

  const allCrags = useMemo(() => {
    const names = new Set(routes.map((r) => r.crag));
    return Array.from(names).sort((a, b) => a.localeCompare(b, "nb"));
  }, [routes]);

  const cragOptions = allCrags;

  const filteredRoutes = useMemo(() => {
    if (cragFilter === ALL_CRAG) return routes;
    return routes.filter((r) => r.crag === cragFilter);
  }, [routes, cragFilter]);

  function toggleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir(col === "dato_send" ? "desc" : "asc");
    }
  }

  const displayed = [...filteredRoutes].sort((a, b) => {
    let cmp = 0;
    if (sortCol === "crag") {
      cmp = a.crag.localeCompare(b.crag, "nb");
    } else if (sortCol === "rutenavn") {
      cmp = a.rutenavn.localeCompare(b.rutenavn, "nb");
    } else if (sortCol === "grad") {
      cmp = gradeIndex(a.grad) - gradeIndex(b.grad);
    } else {
      const da = a.dato_send ?? "";
      const db = b.dato_send ?? "";
      cmp = da.localeCompare(db);
      if (cmp === 0) cmp = a.created_at.localeCompare(b.created_at);
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const visibleRows = showAll ? displayed : displayed.slice(0, PREVIEW_COUNT);
  const hasMore = displayed.length > PREVIEW_COUNT;

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 text-primary" />
    ) : (
      <ChevronDown className="h-3 w-3 text-primary" />
    );
  }

  const sends = routes.filter((r) => routeStatus(r) === "send").length;
  const prosjekter = routes.length - sends;

  return (
    <section className="overflow-hidden rounded-xl border border-border">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
          <Mountain className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <h2 className="text-sm font-semibold text-foreground">Rutelogg</h2>
          <p className="text-xs text-muted-foreground">
            {sends} send · {prosjekter} prosjekt
          </p>
        </div>
      </header>

      <div className="border-t border-border p-4">
        <Card className="overflow-hidden border-border bg-card">
          <CardHeader className="border-b border-border px-4 pb-3 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Alle ruter
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="crag-filter"
                  className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Crag
                </label>
                <select
                  id="crag-filter"
                  value={cragFilter}
                  onChange={(e) => {
                    setCragFilter(e.target.value);
                    setShowAll(false);
                  }}
                  className={cragSelectClass}
                >
                  <option value={ALL_CRAG}>Alle</option>
                  {cragOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-muted-foreground">
                  {filteredRoutes.length}
                  {cragFilter !== ALL_CRAG ? ` / ${routes.length}` : ""} ruter
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {routes.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Ingen ruter registrert ennå. Legg til via høyre panel.
              </p>
            ) : filteredRoutes.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Ingen ruter på valgt crag.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_3rem_2.5rem_4.5rem_3rem] gap-2 border-b border-border/60 bg-secondary/20 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => toggleSort("crag")}
                    className="flex items-center gap-1 text-left hover:text-foreground"
                  >
                    Crag <SortIcon col="crag" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSort("rutenavn")}
                    className="flex items-center gap-1 text-left hover:text-foreground"
                  >
                    Rute <SortIcon col="rutenavn" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSort("grad")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Grad <SortIcon col="grad" />
                  </button>
                  <span className="text-center">★</span>
                  <button
                    type="button"
                    onClick={() => toggleSort("dato_send")}
                    className="flex items-center justify-end gap-1 hover:text-foreground"
                  >
                    Send <SortIcon col="dato_send" />
                  </button>
                  <span className="text-right">Status</span>
                </div>

                <div className="divide-y divide-border/60">
                  {visibleRows.map((r) => {
                    const status = routeStatus(r);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedId(r.id)}
                        className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_3rem_2.5rem_4.5rem_3rem] gap-2 px-4 py-3 text-left transition-colors hover:bg-secondary/20 focus-visible:bg-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
                      >
                        <span className="truncate text-xs font-semibold text-foreground">
                          {r.crag}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs text-foreground">
                            {r.rutenavn}
                          </p>
                          {r.kommentar && (
                            <p className="mt-0.5 truncate text-[10px] text-muted-foreground/70">
                              {r.kommentar}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-medium tabular-nums text-primary">
                          {r.grad}
                        </span>
                        <span className="flex justify-center">
                          <StarRating count={r.stjerner} />
                        </span>
                        <span className="text-right text-xs tabular-nums text-foreground">
                          {formatSendDate(r.dato_send)}
                          {r.flash && r.dato_send && (
                            <Zap className="ml-0.5 inline h-3 w-3 text-amber-400" />
                          )}
                        </span>
                        <div className="flex justify-end">
                          <Badge
                            variant={status === "prosjekt" ? "outline" : "secondary"}
                            className={cn(
                              "h-5 px-1.5 text-[9px]",
                              status === "prosjekt" && "border-primary/30 text-primary"
                            )}
                          >
                            {status === "prosjekt" ? "Prosjekt" : "Send"}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {hasMore && (
                  <div className="border-t border-border/60 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setShowAll((v) => !v)}
                      className="w-full rounded-md border border-border bg-secondary/20 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                    >
                      {showAll
                        ? "Vis færre"
                        : `Vis mer (${displayed.length - PREVIEW_COUNT} til)`}
                    </button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <ClimbingSendsBarChart routes={filteredRoutes} />
      </div>

      {selectedRoute && (
        <ClimbingRouteDetailModal
          route={selectedRoute}
          crags={allCrags}
          onClose={() => setSelectedId(null)}
          onSaved={() => reload()}
          onDeleted={() => {
            setSelectedId(null);
            reload();
          }}
        />
      )}
    </section>
  );
}
