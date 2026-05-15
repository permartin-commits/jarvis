"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  FormEvent,
} from "react";
import {
  BrainCircuit,
  SendHorizonal,
  AlertCircle,
  Loader2,
  Mic,
  Zap,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "pia";
  text: string;
}

// ── Speech Recognition — self-contained types (lib.dom not reliable in Next.js build) ──

interface SR {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart:  (() => void) | null;
  onresult: ((e: SRResultEvent) => void) | null;
  onerror:  ((e: SRErrorEvent)  => void) | null;
  onend:    (() => void) | null;
  start(): void;
  stop():  void;
  abort(): void;
}
interface SRResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: { readonly transcript: string };
}
interface SRResultList {
  readonly length: number;
  readonly resultIndex?: number;
  [index: number]: SRResult;
}
interface SRResultEvent {
  readonly resultIndex: number;
  readonly results: SRResultList;
}
interface SRErrorEvent {
  readonly error: string;
}
type SRConstructor = new () => SR;

// ── Constants ─────────────────────────────────────────────────────────────────

const CHAT_API = "/api/pia-chat";

// ── TTS helpers ───────────────────────────────────────────────────────────────

function stripMarkdown(text: string): string {
  return text
    // Replace URLs (bare or inside markdown links) with "en lenke"
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "en lenke")
    // Fenced code blocks — drop entirely
    .replace(/`{3}[\s\S]*?`{3}/gm, "")
    // Headings — keep text, drop symbols
    .replace(/^#{1,6}\s+/gm, "")
    // Bold+italic, bold, italic (both * and _)
    .replace(/\*{3}([\s\S]+?)\*{3}/g, "$1")
    .replace(/_{3}([\s\S]+?)_{3}/g, "$1")
    .replace(/\*{2}([\s\S]+?)\*{2}/g, "$1")
    .replace(/_{2}([\s\S]+?)_{2}/g, "$1")
    .replace(/\*([\s\S]+?)\*/g, "$1")
    .replace(/_([\s\S]+?)_/g, "$1")
    // Strikethrough
    .replace(/~~([\s\S]+?)~~/g, "$1")
    // Inline code — keep text
    .replace(/`([^`]+)`/g, "$1")
    // Horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // Blockquotes
    .replace(/^>\s*/gm, "")
    // Unordered list markers
    .replace(/^[\s]*[-*+]\s+/gm, "")
    // Ordered list markers
    .replace(/^[\s]*\d+\.\s+/gm, "")
    // Stray leftover symbols: #, *, _, \, backtick
    .replace(/[#*_\\`]/g, "")
    // Collapse 3+ newlines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Pick the best available Norwegian voice, preferring Google > Nora > any nb voice
function pickNorwegianVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();

  const score = (v: SpeechSynthesisVoice): number => {
    const name = v.name.toLowerCase();
    const lang = v.lang.toLowerCase();
    if (!lang.startsWith("nb") && !lang.startsWith("no")) return -1;
    if (name.includes("google") && (name.includes("no") || name.includes("norsk"))) return 3;
    if (name.includes("nora")) return 2;
    if (name.includes("google")) return 1;
    return 0;
  };

  const ranked = voices
    .map((v) => ({ v, s: score(v) }))
    .filter(({ s }) => s >= 0)
    .sort((a, b) => b.s - a.s);

  return ranked[0]?.v ?? null;
}

// ── Orb ───────────────────────────────────────────────────────────────────────

function PiaOrb({
  isListening,
  onClick,
  supported,
  size = 200,
}: {
  isListening: boolean;
  onClick: () => void;
  supported: boolean;
  size?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isListening ? "Stopp opptak" : "Start taleopptak"}
      title={
        !supported
          ? "Talegjenkjenning støttes ikke i denne nettleseren"
          : isListening
          ? "Klikk for å stoppe"
          : "Klikk for å snakke med PIA"
      }
      className={cn(
        "relative flex items-center justify-center select-none rounded-full",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        supported ? "cursor-pointer" : "cursor-default"
      )}
      style={{ width: size, height: size }}
    >
      {/* Listening pulse rings */}
      {isListening && (
        <>
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              background:
                "radial-gradient(circle, rgba(239,68,68,0.25) 0%, transparent 70%)",
              animationDuration: "1.4s",
            }}
          />
          <span
            className="absolute rounded-full border border-red-500/40 animate-pulse"
            style={{ inset: -10 }}
          />
        </>
      )}

      {/* Ambient primary glow */}
      <div
        className="absolute inset-0 rounded-full transition-opacity duration-500"
        style={{
          background: isListening
            ? "radial-gradient(circle, rgba(239,68,68,0.22) 0%, transparent 65%)"
            : "radial-gradient(circle, var(--primary) 0%, transparent 65%)",
          opacity: isListening ? 0.35 : 0.12,
          filter: "blur(30px)",
        }}
      />
      {/* Ambient navy glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 60% 65%, #1e3a8a 0%, transparent 60%)",
          opacity: 0.22,
          filter: "blur(28px)",
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        className="absolute inset-0"
      >
        <defs>
          <radialGradient id="orbFill" cx="38%" cy="32%" r="65%">
            <stop
              offset="0%"
              style={{
                stopColor: isListening ? "#ef4444" : "var(--primary)",
                stopOpacity: 0.55,
              }}
            />
            <stop
              offset="100%"
              style={{
                stopColor: isListening ? "#ef4444" : "var(--primary)",
                stopOpacity: 0.04,
              }}
            />
          </radialGradient>
          <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="coreBloom" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ring 1 — outermost dotted, slow CW */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 100 100"
            to="360 100 100"
            dur="32s"
            repeatCount="indefinite"
          />
          <circle
            cx="100" cy="100" r="90"
            stroke={isListening ? "#7f1d1d" : "#172554"}
            strokeWidth="0.75"
            strokeDasharray="2 10"
            opacity="0.55"
          />
          <line x1="100" y1="4"   x2="100" y2="17"  stroke={isListening ? "#7f1d1d" : "#172554"} strokeWidth="1.5" opacity="0.7" />
          <line x1="100" y1="183" x2="100" y2="196" stroke={isListening ? "#7f1d1d" : "#172554"} strokeWidth="1.5" opacity="0.7" />
          <line x1="4"   y1="100" x2="17"  y2="100" stroke={isListening ? "#7f1d1d" : "#172554"} strokeWidth="1.5" opacity="0.7" />
          <line x1="183" y1="100" x2="196" y2="100" stroke={isListening ? "#7f1d1d" : "#172554"} strokeWidth="1.5" opacity="0.7" />
        </g>

        {/* Ring 2 — arc segments, CCW */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 100 100"
            to="-360 100 100"
            dur={isListening ? "8s" : "18s"}
            repeatCount="indefinite"
          />
          <circle
            cx="100" cy="100" r="74"
            stroke={isListening ? "#991b1b" : "#1e3a8a"}
            strokeWidth="1.5"
            strokeDasharray="84 32"
            opacity="0.65"
            filter="url(#softGlow)"
          />
        </g>

        {/* Ring 3 — small dashes, CW medium */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 100 100"
            to="360 100 100"
            dur={isListening ? "5s" : "11s"}
            repeatCount="indefinite"
          />
          <circle
            cx="100" cy="100" r="59"
            stroke={isListening ? "#b91c1c" : "#1d4ed8"}
            strokeWidth="0.75"
            strokeDasharray="6 5"
            opacity="0.4"
          />
        </g>

        {/* Ring 4 — solid inner ring, static */}
        <circle
          cx="100" cy="100" r="47"
          stroke={isListening ? "#dc2626" : "#2563eb"}
          strokeWidth="1"
          opacity="0.55"
          filter="url(#softGlow)"
        />

        {/* Crosshair */}
        <line x1="64" y1="100" x2="136" y2="100" style={{ stroke: isListening ? "#ef4444" : "var(--primary)" }} strokeWidth="0.5" opacity="0.18" />
        <line x1="100" y1="64" x2="100" y2="136" style={{ stroke: isListening ? "#ef4444" : "var(--primary)" }} strokeWidth="0.5" opacity="0.18" />

        {/* Core fill */}
        <circle cx="100" cy="100" r="47" fill="url(#orbFill)" filter="url(#coreBloom)" />
      </svg>

      {/* Centre icon — mic when listening, bolt otherwise */}
      <div className="relative z-10 flex items-center justify-center transition-transform duration-200 active:scale-90">
        {isListening ? (
          <Mic
            style={{ width: 26, height: 26, color: "#450a0a" }}
            strokeWidth={2.5}
            className="animate-pulse"
          />
        ) : (
          <Zap
            style={{ width: 28, height: 28, color: "#0f172a" }}
            strokeWidth={2.5}
            fill="#0f172a"
          />
        )}
      </div>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function PiaCoreSection({
  greeting = "",
  compact = false,
}: {
  greeting?: string;
  compact?: boolean;
}) {
  const [input, setInput]             = useState("");
  const [messages, setMessages]       = useState<Message[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [micUnsupported, setMicUnsupported] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking]     = useState(false);

  const bottomRef      = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SR | null>(null);

  // ── Auto-scroll ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ── Text-to-Speech ────────────────────────────────────────────────────────

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const clean = stripMarkdown(text);
    if (!clean) return;

    const fire = () => {
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang  = "nb-NO";
      utterance.rate  = 1.15;
      utterance.pitch = 1;

      const voice = pickNorwegianVoice();
      if (voice) utterance.voice = voice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend   = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    };

    // Voices may not be loaded yet on first call — wait for them
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      fire();
    } else {
      window.speechSynthesis.addEventListener("voiceschanged", fire, { once: true });
    }
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      if (prev) {
        // Turning off — cancel any ongoing speech immediately
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
      }
      return !prev;
    });
  }, []);

  // ── Speech Recognition ────────────────────────────────────────────────────

  const toggleListening = useCallback(() => {
    // Stop if already listening
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const win = typeof window !== "undefined"
      ? (window as Window & { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor })
      : null;
    const SR: SRConstructor | null = win?.SpeechRecognition ?? win?.webkitSpeechRecognition ?? null;

    if (!SR) {
      setMicUnsupported(true);
      setError("Talegjenkjenning støttes ikke i denne nettleseren (prøv Chrome).");
      return;
    }

    const recognition = new SR();
    recognition.lang = "nb-NO";
    recognition.continuous = true;
    recognition.interimResults = true;

    // Snapshot the text that was in the input before we started speaking,
    // so interim results are appended rather than replacing existing text.
    const prefix = input.trimEnd();
    let sessionFinals = "";

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SRResultEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          sessionFinals += t;
        } else {
          interim = t;
        }
      }
      const combined = [prefix, sessionFinals + interim]
        .filter(Boolean)
        .join(" ");
      setInput(combined);
    };

    recognition.onerror = (event: SRErrorEvent) => {
      if (event.error === "not-allowed") {
        setError("Mikrofontillatelse avvist. Sjekk nettleserinnstillingene og last inn siden på nytt.");
      } else if (event.error !== "aborted" && event.error !== "no-speech") {
        setError(`Talefeil: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Trim trailing whitespace left by interim placeholders
      setInput((v) => v.trimEnd());
      inputRef.current?.focus();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, input]);

  // ── Chat submit ───────────────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Stop any active recording before sending
    if (isListening) recognitionRef.current?.stop();

    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setLoading(true);

    try {
      const res = await fetch(CHAT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sporsmal: trimmed, sessionId: "per_martin_web" }),
      });

      const data = (await res.json()) as { svar?: string; error?: string };

      if (!res.ok) throw new Error(data.error ?? `Feil fra serveren (${res.status})`);
      const svar = data.svar?.trim();

      if (!svar) throw new Error("Fikk tomt svar fra PIA.");

      setMessages((prev) => [...prev, { role: "pia", text: svar }]);
      if (voiceEnabled) speak(svar);
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Orb ──────────────────────────────────────────────────── */}
      <PiaOrb
        isListening={isListening}
        onClick={toggleListening}
        supported={!micUnsupported}
        size={compact ? 120 : 200}
      />

      {/* ── Label ────────────────────────────────────────────────── */}
      <div className="text-center space-y-1">
        <h2 className={cn(
          "font-bold tracking-[0.45em] uppercase bg-gradient-to-r from-primary via-primary/60 to-primary bg-clip-text text-transparent",
          compact ? "text-base" : "text-2xl"
        )}>
          PIA
        </h2>
        {!compact && (
          <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground/60">
            Master OS
          </p>
        )}
      </div>

      {/* ── Greeting (full mode only) ─────────────────────────────── */}
      {!compact && (
        <p className="text-base font-medium text-foreground/75 text-center">
          {greeting} Per Martin, hva vil du gjøre i dag?
        </p>
      )}

      {/* ── Chat area ────────────────────────────────────────────── */}
      <div className={cn("w-full flex flex-col gap-3", compact ? "max-w-full" : "max-w-xl")}>

        {/* Message thread */}
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

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input form */}
        <form onSubmit={handleSubmit} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder={
              isListening
                ? "Snakker…"
                : isSpeaking
                ? "PIA snakker…"
                : hasMessages
                ? "Fortsett samtalen…"
                : "Snakk med PIA…"
            }
            autoComplete="off"
            className={cn(
              "w-full rounded-full border bg-primary/5 px-5 py-3.5 text-sm outline-none ring-0 transition-colors",
              "placeholder:text-muted-foreground/40 text-foreground",
              // extra right padding: 3 buttons × 32px + gaps
              micUnsupported ? "pr-[4.5rem]" : "pr-[7.5rem]",
              isListening
                ? "border-red-500/50 bg-red-500/5 placeholder:text-red-400/50"
                : loading
                ? "border-primary/15 cursor-wait opacity-70"
                : "border-primary/25 hover:border-primary/40 focus:border-primary/60"
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as FormEvent);
              }
            }}
          />

          {/* Speaker toggle button */}
          <button
            type="button"
            onClick={toggleVoice}
            aria-label={voiceEnabled ? "Slå av stemme" : "Slå på stemme"}
            title={voiceEnabled ? "Slå av talesvar" : "Slå på talesvar"}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full transition-all",
              micUnsupported ? "right-11" : "right-[4.75rem]",
              voiceEnabled
                ? isSpeaking
                  ? "bg-primary/20 text-primary ring-1 ring-primary/40 animate-pulse"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
                : "text-muted-foreground/30 hover:bg-secondary/50 hover:text-muted-foreground/60"
            )}
          >
            {voiceEnabled
              ? <Volume2 className="h-3.5 w-3.5" />
              : <VolumeX className="h-3.5 w-3.5" />
            }
          </button>

          {/* Mic toggle button */}
          {!micUnsupported && (
            <button
              type="button"
              onClick={toggleListening}
              disabled={loading}
              aria-label={isListening ? "Stopp opptak" : "Start taleopptak"}
              className={cn(
                "absolute right-11 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full transition-all",
                isListening
                  ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/40 animate-pulse"
                  : loading
                  ? "text-muted-foreground/20 cursor-not-allowed"
                  : "text-muted-foreground/40 hover:bg-secondary/50 hover:text-muted-foreground"
              )}
            >
              <Mic className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Send button */}
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

        {/* Footer hint (full mode only) */}
        {!compact && !hasMessages && (
          <p className="text-center text-[10px] text-muted-foreground/50">
            {isListening
              ? "Snakker nå — klikk på orben eller mikrofon-ikonet for å stoppe"
              : `Klikk på orben for å snakke · Enter for å sende · Stemme ${voiceEnabled ? "på" : "av"}`}
          </p>
        )}
      </div>
    </>
  );
}
