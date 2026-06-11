"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TrendingUp,
  FolderKanban,
  Zap,
  Menu,
  X,
  LayoutDashboard,
  CircleDollarSign,
  Dumbbell,
  BrainCircuit,
  Mountain,
  Footprints,
  Grip,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export const navItems: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Oversikt", href: "/", icon: LayoutDashboard },
  { label: "Agent", href: "/agent", icon: BrainCircuit },
  { label: "Business", href: "/business", icon: Briefcase },
  { label: "Fitness", href: "/fitness", icon: Dumbbell },
  { label: "Fridel", href: "/fridel", icon: Mountain },
  { label: "Klatring", href: "/klatring", icon: Grip },
  { label: "Portefølje", href: "/portefolje", icon: TrendingUp },
  { label: "Prosjekter", href: "/prosjekter", icon: FolderKanban },
  { label: "Run Forrest", href: "/run-forrest", icon: Footprints },
];

const COST_POLL_MS = 60_000;

function ApiCostInline() {
  const [costNok, setCostNok] = useState<string | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/api-cost")
        .then((r) => r.json())
        .then((d) => setCostNok(d.costNok ?? null))
        .catch(() => {});

    load();
    const id = setInterval(load, COST_POLL_MS);
    return () => clearInterval(id);
  }, []);

  if (!costNok) return null;

  return (
    <div className="hidden items-center gap-1.5 rounded-full border border-border/80 bg-pia-surface/30 px-2.5 py-1 sm:flex">
      <CircleDollarSign className="h-3 w-3 text-pia-coral/80" />
      <span className="text-[10px] font-medium tabular-nums text-pia-muted">{costNok}</span>
    </div>
  );
}

function NavDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <aside
        className="absolute right-0 top-0 flex h-full w-[min(100vw,20rem)] flex-col border-l border-border bg-sidebar shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        aria-label="Navigasjonsmeny"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pia-coral/15 ring-1 ring-pia-coral/35">
              <Zap className="h-3.5 w-3.5 text-pia-coral" strokeWidth={2.5} />
            </div>
            <span className="font-bold tracking-wide text-pia-text text-sm">PIA</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-pia-muted transition-colors hover:bg-sidebar-accent hover:text-pia-text"
            aria-label="Lukk meny"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          <p className="mb-2 px-2 text-[10px] uppercase tracking-widest text-pia-muted">
            Navigasjon
          </p>
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-pia-coral/12 text-pia-coral ring-1 ring-pia-coral/25"
                    : "text-pia-text hover:bg-sidebar-accent"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-pia-coral" : "text-pia-muted"
                  )}
                />
                {label}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-pia-coral" />
                )}
              </Link>
            );
          })}
        </nav>

        <Separator className="opacity-50" />
        <div className="px-4 py-3">
          <p className="text-[10px] text-pia-muted">v0.1.0 — lokalt</p>
        </div>
      </aside>
    </div>
  );
}

export function TopNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const current =
    navItems.find(({ href }) =>
      href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
    ) ?? navItems[0];

  // Lukk meny ved rutebytte
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lås scroll når meny er åpen
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header className="relative z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-sidebar/95 px-4 backdrop-blur-sm">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pia-coral/15 ring-1 ring-pia-coral/35">
            <Zap className="h-4 w-4 text-pia-coral" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 leading-none">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wide text-pia-text">PIA</span>
              <span className="hidden text-pia-muted sm:inline">·</span>
              <span className="hidden truncate text-sm text-pia-muted sm:inline">
                {current.label}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] text-emerald-400/90">Online</span>
            </div>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <ApiCostInline />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 text-pia-muted transition-colors hover:bg-pia-surface/40 hover:text-pia-text"
            aria-label="Åpne meny"
            aria-expanded={menuOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <NavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
