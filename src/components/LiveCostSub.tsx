"use client";

import { useState, useEffect } from "react";

const POLL_MS = 60_000;

export function LiveCostSub({ initial }: { initial: string }) {
  const [cost, setCost] = useState(initial);

  useEffect(() => {
    const load = () =>
      fetch("/api/api-cost")
        .then((r) => r.json())
        .then((d) => { if (d.costNok) setCost(d.costNok); })
        .catch(() => {});

    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, []);

  return <span className="text-xs text-muted-foreground tabular-nums">{cost}</span>;
}
