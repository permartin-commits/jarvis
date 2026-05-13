"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { BrainCircuit, SendHorizonal, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const WEBHOOK_URL = "https://pia.verlanse.no/webhook/pia-svar";

interface Message {
  role: "user" | "pia";
  text: string;
}

export function PiaChatBox() {
  const [input, setInput]       = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setLoading(true);

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sporsmal: trimmed, sessionId: "per_martin_web" }),
      });

      if (!res.ok) {
        throw new Error(`Webhook svarte med status ${res.status}`);
      }

      const data = await res.json() as { svar?: string };
      const svar = data.svar?.trim();

      if (!svar) {
        throw new Error("Fikk tomt svar fra PIA.");
      }

      setMessages((prev) => [...prev, { role: "pia", text: svar }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil");
      setMessages((prev) => prev.slice(0, -1));
      setInput(trimmed);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="w-full max-w-xl flex flex-col gap-3">

      {/* ── Message thread ─────────────────────────────────────── */}
      {hasMessages && (
        <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1 rounded-xl scroll-smooth">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2.5",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "pia" && (
                <div className="flex-shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/25">
                  <BrainCircuit className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words max-w-[85%]",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-secondary/60 text-foreground border border-border/60 rounded-bl-sm"
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Loading bubble */}
          {loading && (
            <div className="flex gap-2.5 justify-start">
              <div className="flex-shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/25">
                <BrainCircuit className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="rounded-2xl rounded-bl-sm border border-border/60 bg-secondary/60 px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 text-primary/70 animate-spin" />
                <span className="text-xs text-muted-foreground">PIA tenker…</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* ── Error banner ───────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Input form ─────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder={hasMessages ? "Fortsett samtalen…" : "Snakk med PIA…"}
          autoComplete="off"
          className={cn(
            "w-full rounded-full border bg-primary/5 px-5 py-3.5 pr-12 text-sm outline-none ring-0 transition-colors",
            "placeholder:text-muted-foreground/40 text-foreground",
            loading
              ? "border-primary/15 cursor-wait opacity-70"
              : "border-primary/25 hover:border-primary/40 focus:border-primary/60 focus:bg-primary/8"
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as FormEvent);
            }
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send melding"
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full transition-all",
            loading || !input.trim()
              ? "text-muted-foreground/30 cursor-not-allowed"
              : "bg-primary/15 text-primary hover:bg-primary/25 active:scale-95"
          )}
        >
          {loading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <SendHorizonal className="h-3.5 w-3.5" />
          }
        </button>
      </form>

      {!hasMessages && (
        <p className="text-center text-[10px] text-muted-foreground/50">
          Trykk Enter eller klikk send · koblet til n8n
        </p>
      )}
    </div>
  );
}
