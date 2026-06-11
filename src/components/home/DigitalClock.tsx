"use client";

import { useEffect, useState } from "react";

function formatOslo(now: Date) {
  return {
    time: now.toLocaleTimeString("nb-NO", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Europe/Oslo",
    }),
    date: now.toLocaleDateString("nb-NO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Oslo",
    }),
  };
}

export function DigitalClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { time, date } = formatOslo(now ?? new Date());

  return (
    <div className="text-right font-mono tabular-nums">
      <p className="text-3xl font-light tracking-tight text-pia-text sm:text-4xl md:text-5xl">
        {now ? time : "--:--:--"}
      </p>
      <p className="mt-1 text-xs capitalize text-pia-muted sm:text-sm">{date}</p>
    </div>
  );
}
