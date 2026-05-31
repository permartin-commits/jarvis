"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppModalProps {
  open: boolean;
  onClose: () => void;
  /** Klikk på backdrop — sett false under aktiv økt */
  closeOnBackdrop?: boolean;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "max-w-md" | "max-w-lg" | "max-w-xl";
  showCloseButton?: boolean;
  "aria-labelledby"?: string;
}

/**
 * Sentrert modal — samme skall som ruteredigering og styrkeøkt-detaljer.
 */
export function AppModal({
  open,
  onClose,
  closeOnBackdrop = true,
  title,
  description,
  children,
  footer,
  maxWidth = "max-w-md",
  showCloseButton = true,
  "aria-labelledby": ariaLabelledBy,
}: AppModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !open) return null;

  function handleBackdrop() {
    if (closeOnBackdrop) onClose();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onMouseDown={handleBackdrop}
      role="presentation"
    >
      <div
        className={cn(
          "flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl max-h-[min(90vh,100dvh-2rem)]",
          maxWidth
        )}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="text-sm font-semibold text-foreground">
              {ariaLabelledBy ? (
                <div id={ariaLabelledBy}>{title}</div>
              ) : (
                title
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Lukk"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-border bg-muted/30">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
