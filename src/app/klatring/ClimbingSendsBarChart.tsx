"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClimbingRoute } from "@/lib/climbing";
import { buildSendCountByGrade } from "@/lib/climbing";

const CHART_HEIGHT_PX = 140;

interface ClimbingSendsBarChartProps {
  routes: ClimbingRoute[];
}

export function ClimbingSendsBarChart({ routes }: ClimbingSendsBarChartProps) {
  const data = useMemo(() => buildSendCountByGrade(routes), [routes]);
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const yTicks = useMemo(() => {
    if (maxCount <= 1) return [1, 0];
    const mid = Math.ceil(maxCount / 2);
    if (mid === maxCount) return [maxCount, 0];
    return [maxCount, mid, 0];
  }, [maxCount]);

  return (
    <Card className="mt-4 overflow-hidden border-border bg-card">
      <CardHeader className="border-b border-border px-4 pb-3 pt-4">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sendt per grad
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {data.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Ingen sendte ruter ennå — diagrammet fylles når du logger send med
            dato.
          </p>
        ) : (
          <div className="flex gap-3">
            <div
              className="flex w-6 shrink-0 flex-col justify-between py-0.5 text-right text-[9px] tabular-nums text-muted-foreground"
              style={{ height: CHART_HEIGHT_PX }}
              aria-hidden
            >
              {yTicks.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>

            <div className="min-w-0 flex-1 overflow-x-auto">
              <div
                className="flex items-end gap-1.5 border-b border-border/60 px-0.5 pb-0"
                style={{ height: CHART_HEIGHT_PX }}
                role="img"
                aria-label="Stolpediagram: antall sendte ruter per grad"
              >
                {data.map((d) => {
                  const barPx = Math.max(
                    8,
                    Math.round((d.count / maxCount) * (CHART_HEIGHT_PX - 12))
                  );
                  return (
                    <div
                      key={d.grad}
                      className="group flex h-full min-w-[2rem] flex-1 flex-col items-center justify-end sm:min-w-0"
                      title={`${d.grad}: ${d.count} send${d.count === 1 ? "" : "t"}`}
                    >
                      <span className="mb-1 text-[9px] font-medium tabular-nums text-foreground/80 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                        {d.count}
                      </span>
                      <div
                        className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-primary to-primary/45 transition-colors group-hover:from-[#DA4167] group-hover:to-primary/55"
                        style={{ height: barPx }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-1.5 px-0.5">
                {data.map((d) => (
                  <span
                    key={`${d.grad}-lbl`}
                    className="min-w-[2rem] flex-1 truncate text-center text-[9px] font-medium text-muted-foreground sm:min-w-0"
                  >
                    {d.grad}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
                <span>Grad</span>
                <span>Antall sendt</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
