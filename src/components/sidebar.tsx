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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { label: "Oversikt",   href: "/",          icon: LayoutDashboard },
  { label: "Portefølje", href: "/portefolje", icon: TrendingUp },
  { label: "Prosjekter", href: "/prosjekter", icon: FolderKanban },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function SidebarBrand() {
  return (
    <div className="flex h-16 items-center gap-2.5 px-5 shrink-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/40">
        <Zap className="h-4 w-4 text-primary" strokeWidth={2.5} />
      </div>
        <div className="flex flex-col leading-none gap-0.5">
          <span className="font-bold tracking-wide text-foreground">JARVIS</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Dashboard
          </span>
          <div className="flex items-center gap-1 pt-0.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] text-emerald-400/70">Online</span>
          </div>
        </div>
    </div>
  );
}

function SidebarNav({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      <p className="mb-2 px-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        Navigasjon
      </p>
      {navItems.map(({ label, href, icon: Icon }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onLinkClick}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              isActive
                ? "bg-primary/15 text-primary ring-1 ring-primary/20"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
              )}
            />
            {label}
            {isActive && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function ApiCostBadge() {
  const [costNok, setCostNok] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/api-cost")
      .then((r) => r.json())
      .then((d) => setCostNok(d.costNok ?? null))
      .catch(() => {});
  }, []);

  if (!costNok) return null;

  return (
    <div className="flex items-center gap-2.5 px-5 py-3">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 shrink-0">
        <CircleDollarSign className="h-3.5 w-3.5 text-primary/70" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          API Kostnad
        </p>
        <p className="text-xs font-semibold text-foreground tabular-nums">
          {costNok}
        </p>
      </div>
    </div>
  );
}

function SidebarFooter() {
  return (
    <>
      <Separator className="opacity-50" />
      <ApiCostBadge />
      <div className="px-5 py-3">
        <p className="text-[10px] text-muted-foreground">v0.1.0 &mdash; lokalt</p>
      </div>
    </>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex h-screen w-60 flex-col border-r border-border bg-sidebar shrink-0">
        <SidebarBrand />
        <Separator className="opacity-50" />
        <SidebarNav />
        <SidebarFooter />
      </aside>

      {/* ── Mobile: fixed top bar ───────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b border-border bg-sidebar/95 backdrop-blur-sm px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/40">
            <Zap className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
          </div>
          <span className="font-bold tracking-wide text-foreground text-sm">JARVIS</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
          aria-label="Åpne meny"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* ── Mobile: slide-in drawer ─────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 h-full w-72 flex flex-col bg-sidebar border-r border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/40">
                  <Zap className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
                </div>
                <span className="font-bold tracking-wide text-foreground text-sm">JARVIS</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
                aria-label="Lukk meny"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Nav links */}
            <div className="flex flex-col flex-1 overflow-y-auto">
              <SidebarNav onLinkClick={() => setMobileOpen(false)} />
              <SidebarFooter />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
