"use client";

import { useState, useCallback, useEffect } from "react";
import { RENDER_V } from "@/lib/renderVersion";

export interface RevealCard {
  name: string;
  cardId?: string;
  rarity: "normal" | "nice" | "rare" | "epic" | "unknown" | string | undefined;
  quantity?: number;
}

interface CardRevealOverlayProps {
  cards: RevealCard[];
  title: string;
  subtitle?: string;
  /** Called when the final summary is dismissed */
  onComplete: () => void;
}

const RARITY_GLOW: Record<string, { glow: string; border: string; text: string }> = {
  normal: { glow: "rgba(156,163,175,0.4)", border: "#9ca3af", text: "#e5e7eb" },
  nice: { glow: "rgba(59,130,246,0.6)", border: "#3b82f6", text: "#bfdbfe" },
  rare: { glow: "rgba(147,51,234,0.7)", border: "#9333ea", text: "#e9d5ff" },
  epic: { glow: "rgba(220,38,38,0.8)", border: "#dc2626", text: "#fecaca" },
  unknown: { glow: "rgba(34,197,94,0.8)", border: "#22c55e", text: "#bbf7d0" },
};

type Phase = "entering" | "revealed" | "summary";

export default function CardRevealOverlay({
  cards,
  title,
  subtitle,
  onComplete,
}: CardRevealOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("entering");

  // Handle entering animation completion
  useEffect(() => {
    if (currentIndex < cards.length) {
      setPhase("entering");
      const t = setTimeout(() => {
        setPhase("revealed");
      }, 800); // tightly match css animation 0.8s
      return () => clearTimeout(t);
    }
  }, [currentIndex, cards.length]);

  const handleNext = useCallback(() => {
    if (phase !== "revealed") return;
    
    setTimeout(() => {
        const nextIdx = currentIndex + 1;
        if (nextIdx >= cards.length) {
          setPhase("summary");
        } else {
          setCurrentIndex(nextIdx);
        }
    }, 50); // slight delay for feel
  }, [phase, currentIndex, cards.length]);

  const handleInteract = useCallback(() => {
    if (phase === "revealed") handleNext();
    else if (phase === "summary") onComplete();
  }, [phase, handleNext, onComplete]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleInteract();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleInteract]);

  // ── Summary view ──
  if (phase === "summary") {
    return (
      <div
        className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.92)" }}
        onClick={onComplete}
      >
        <div className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: "var(--gold)" }}>
          ✦ Cards Collected ✦
        </div>
        <h2 className="font-display font-black text-2xl sm:text-3xl tracking-widest uppercase text-gold-gradient mb-6 text-center">
          {title}
        </h2>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-w-3xl max-h-[60vh] overflow-y-auto px-2 mb-8">
          {cards.map((c, i) => {
            const r = RARITY_GLOW[c.rarity || 'normal'] ?? RARITY_GLOW.normal;
            return (
              <div
                key={i}
                className="w-20 sm:w-24 aspect-[512/880] rounded overflow-hidden relative"
                style={{
                  border: `2px solid ${r.border}`,
                  boxShadow: `0 0 10px ${r.glow}`,
                }}
              >
                <img
                  src={`/api/cards/render/${encodeURIComponent(c.cardId ?? c.name)}?v=${RENDER_V}`}
                  alt={c.name}
                  className="w-full"
                  draggable={false}
                />
                {(c.quantity ?? 1) > 1 && (
                  <div
                    className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-black"
                    style={{ background: "rgba(0,0,0,0.8)", color: r.text }}
                  >
                    x{c.quantity}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onComplete(); }}
          className="btn-game px-8 py-3 text-sm font-bold tracking-widest uppercase"
        >
          ✦ Continue ✦
        </button>

        <div className="mt-3 text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
          Click or press Space
        </div>
      </div>
    );
  }

  // ── Card reveal view ──
  return (
    <div
      className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-4 overflow-hidden"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={handleInteract}
    >
      <style>{`
        @keyframes card-pull-enter {
          0% { transform: scale(0.6) translateY(40vh) rotateY(180deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: scale(1) translateY(0) rotateY(180deg); opacity: 1; }
        }

        @keyframes reveal-glow-pulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>

      {/* Header - More centered layout */}
      <div className="absolute top-[8vh] sm:top-[12vh] left-0 right-0 text-center z-50 pointer-events-none px-4">
        <div className="text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-1 sm:mb-2" style={{ color: "var(--gold)" }}>
          ✦ {subtitle ?? title} ✦
        </div>
        <h2 className="font-display font-black text-xl sm:text-3xl tracking-widest uppercase text-gold-gradient" style={{ textShadow: "0 0 20px rgba(200,150,42,0.3)" }}>
          {title}
        </h2>
        <div className="mt-2 sm:mt-4 text-[10px] sm:text-xs tracking-widest" style={{ color: "var(--text-muted)" }}>
          Card {currentIndex + 1} of {cards.length}
        </div>
      </div>

      {cards.map((c, i) => {
        const isPast = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isFuture = i > currentIndex;

        if (isFuture) return null;

        const rarity = RARITY_GLOW[c.rarity || 'normal'] ?? RARITY_GLOW.normal;

        // Tray Math for past cards seamlessly dropping down
        const trayCardWidth = 48; // slightly smaller tray cards for mobile
        const gap = 8;
        const totalPast = currentIndex;
        const offsetX = (i - (totalPast - 1) / 2) * (trayCardWidth + gap);
        
        // Target vertical offset to position accurately near bottom
        const offsetY = "calc(50vh - 10vh - 24px)"; 

        return (
          <div
            key={i}
            className="absolute pointer-events-none flex items-center justify-center transform-gpu"
            style={{
              left: "50%",
              top: "50%",
              width: isPast ? `${trayCardWidth}px` : "min(70vw, 320px)",
              aspectRatio: "512 / 880",
              perspective: "1200px",
              // Live shrink down into the shelf below
              transform: isPast 
                ? `translate(calc(-50% + ${offsetX}px), ${offsetY})` 
                : `translate(-50%, calc(-50% + 2vh))`,
              transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
              zIndex: isCurrent ? 50 : 10 + i,
            }}
          >
            <div
              className="w-full h-full relative"
              style={{
                transformStyle: "preserve-3d",
                animation: (isCurrent && phase === "entering") 
                  ? "card-pull-enter 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards" 
                  : "none",
                transform: "rotateY(180deg)", // Fixed final state (front side visible)
              }}
            >
              {/* Card back */}
              <div
                className="absolute inset-0 w-full rounded-[4%] flex items-center justify-center select-none overflow-hidden"
                style={{
                  backfaceVisibility: "hidden",
                  border: "2px solid rgba(200,150,42,0.5)",
                  boxShadow: "0 0 40px rgba(200,150,42,0.15)",
                  transform: "rotateY(0deg)", // Starts facing camera during spin automatically
                }}
              >
                <img
                  src="/card-back.webp" // Used the configured default fallback
                  alt="Card back"
                  draggable={false}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Card front */}
              <div
                className="absolute inset-0 w-full rounded-[4%] overflow-hidden"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)", // Front face opposite to the back
                  border: `2px solid ${rarity.border}`,
                  boxShadow: (isCurrent && phase === "revealed")
                      ? `0 0 30px ${rarity.glow}, 0 0 60px ${rarity.glow}`
                      : `0 0 10px ${rarity.glow}`,
                  transition: "box-shadow 300ms ease-out",
                }}
              >
                <img
                  src={`/api/cards/render/${encodeURIComponent(c.cardId ?? c.name)}?v=${RENDER_V}`}
                  alt={c.name}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {(c.quantity ?? 1) > 1 && (
                  <div
                    className="absolute top-2 right-2 px-2 py-1 rounded-lg text-sm font-black"
                    style={{
                      background: "rgba(0,0,0,0.85)",
                      color: rarity.text,
                      border: `1px solid ${rarity.border}`,
                    }}
                  >
                    x{c.quantity}
                  </div>
                )}
              </div>

              {/* Rarity glow pulse on reveal */}
              {isCurrent && phase === "revealed" && (
                <div
                  className="absolute inset-0 rounded-[4%] pointer-events-none"
                  style={{
                    boxShadow: `0 0 40px ${rarity.glow}, 0 0 80px ${rarity.glow}`,
                    animation: "reveal-glow-pulse 2s ease-in-out infinite",
                    transform: "rotateY(180deg)", // Match front face rotation
                  }}
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Hint text */}
      <div className="absolute bottom-[5vh] sm:bottom-[10vh] left-0 right-0 text-center text-[10px] sm:text-xs tracking-widest z-50 pointer-events-none transition-opacity duration-300" style={{ color: "rgba(255,255,255,0.4)", opacity: phase === "revealed" ? 1 : 0 }}>
        Tap to continue
      </div>
    </div>
  );
}