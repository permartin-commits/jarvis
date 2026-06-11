"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface PiaDarkModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "max-w-lg" | "max-w-xl" | "max-w-2xl";
}

export function PiaDarkModal({
  open,
  onClose,
  title,
  subtitle,
  badge,
  children,
  footer,
  maxWidth = "max-w-lg",
}: PiaDarkModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className={`flex w-full ${maxWidth} max-h-[min(90vh,100dvh-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-pia-bg shadow-2xl shadow-black/50`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="h-0.5 w-full bg-gradient-to-r from-pia-coral via-pia-pink to-pia-coral" />

        <div className="shrink-0 border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                {badge}
              </div>
              <h2 className="text-lg font-semibold text-pia-text">{title}</h2>
              {subtitle && (
                <p className="mt-1 text-xs text-pia-muted">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-pia-muted transition-colors hover:bg-pia-surface/50 hover:text-pia-text"
              aria-label="Lukk"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-border bg-pia-surface/20 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
