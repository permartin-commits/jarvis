"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TrendingUp,
  FolderKanban,
  BrainCircuit,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const navItems = [
  {
    label: "Portefølje",
    href: "/portefolje",
    icon: TrendingUp,
  },
  {
    label: "Prosjekter",
    href: "/prosjekter",
    icon: FolderKanban,
  },
  {
    label: "AI Logger",
    href: "/ai-logger",
    icon: BrainCircuit,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-sidebar">
      {/* Logo / brand */}
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/40">
          <Zap className="h-4 w-4 text-primary" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-bold tracking-wide text-foreground">JARVIS</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Dashboard
          </span>
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="mb-2 px-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          Navigasjon
        </p>
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
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

      <Separator className="opacity-50" />

      {/* Footer */}
      <div className="px-5 py-4">
        <p className="text-[10px] text-muted-foreground">
          v0.1.0 &mdash; lokalt
        </p>
      </div>
    </aside>
  );
}
