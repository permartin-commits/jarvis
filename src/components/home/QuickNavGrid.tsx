"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BrainCircuit,
  Briefcase,
  Dumbbell,
  FolderKanban,
  Footprints,
  Grip,
  Mountain,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string; icon: LucideIcon; desc: string }[] = [
  { href: "/agent", label: "Agent", icon: BrainCircuit, desc: "System & AI" },
  { href: "/business", label: "Business", icon: Briefcase, desc: "CRM & kurs" },
  { href: "/portefolje", label: "Portefølje", icon: TrendingUp, desc: "Aksjer" },
  { href: "/fitness", label: "Fitness", icon: Dumbbell, desc: "Styrke" },
  { href: "/klatring", label: "Klatring", icon: Grip, desc: "Beastmaker" },
  { href: "/run-forrest", label: "Run Forrest", icon: Footprints, desc: "Strava" },
  { href: "/prosjekter", label: "Prosjekter", icon: FolderKanban, desc: "Masterplan" },
  { href: "/fridel", label: "Fridel", icon: Mountain, desc: "Hytter" },
];

export function QuickNavGrid() {
  const pathname = usePathname();

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {LINKS.map(({ href, label, icon: Icon, desc }) => {
        const active =
          href === "/"
            ? pathname === "/"
            : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "pia-bubble-card group flex flex-col items-center justify-center gap-2 px-3 py-5 text-center",
              active && "ring-1 ring-pia-coral/35"
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                active
                  ? "bg-pia-coral/20 text-pia-coral"
                  : "bg-pia-surface/50 text-pia-muted group-hover:text-pia-pink"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 2} />
            </div>
            <div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  active ? "text-pia-coral" : "text-pia-text"
                )}
              >
                {label}
              </p>
              <p className="text-[10px] text-pia-muted">{desc}</p>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
