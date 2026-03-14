"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { BattleCard } from "@/lib/battle/types";

export interface TrickActivationData {
  card: BattleCard;
  playerId: string;
  description: string;
}

interface TrickActivationProps {
  trick: TrickActivationData;
  playerName?: string;
  opponentName?: string;
  onDone: () => void;
}

type AnimPhase = "enter" | "glow" | "effect" | "wait" | "exit";

// Busts stale browser cache
import { RENDER_V } from "@/lib/renderVersion";
const CACHE_BUST = `v=${RENDER_V}`;

export default function TrickActivation({
  trick,
  playerName = "You",
  opponentName = "Opponent",
  onDone,
}: TrickActivationProps) {
  const [phase, setPhase] = useState<AnimPhase>("enter");
  const [canDismiss, setCanDismiss] = useState(false);
  const doneRef = useRef(false);

  const isPlayer = trick.playerId === "player";
  const casterName = isPlayer ? playerName : opponentName;

  const finish = useCallback(() => {
    if (doneRef.current || !canDismiss) return;
    doneRef.current = true;
    setPhase("exit");
    setTimeout(onDone, 400);
  }, [onDone, canDismiss]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const after = (ms: number, fn: () => void) => {
      timers.push(setTimeout(fn, ms));
    };

    after(600, () => setPhase("glow"));
    after(1400, () => setPhase("effect"));
    after(2800, () => { setPhase("wait"); setCanDismiss(true); });

    return () => timers.forEach(clearTimeout);
  }, []);

  // Auto-dismiss after short delay in "wait"
  useEffect(() => {
    if (phase !== "wait") return;
    const t = setTimeout(finish, 1500);
    return () => clearTimeout(t);
  }, [phase, finish]);

  // Dismiss on Space / Enter / click
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [finish]);

  const isExiting = phase === "exit";
  const showGlow = phase === "glow" || phase === "effect" || phase === "wait" || phase === "exit";
  const showEffect = phase === "effect" || phase === "wait" || phase === "exit";

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4"
      style={{
        background: "rgba(0,0,0,0.85)",
        opacity: isExiting ? 0 : 1,
        transition: "opacity 400ms ease-out",
        pointerEvents: "all",
      }}
      onClick={canDismiss ? finish : undefined}
    >
      {/* Caster label */}
      <div
        className="text-xs tracking-[0.3em] uppercase mb-3 font-display font-bold"
        style={{
          color: isPlayer ? "var(--gold)" : "var(--crimson)",
          opacity: phase === "enter" ? 0 : 1,
          transform: phase === "enter" ? "translateY(10px)" : "translateY(0)",
          transition: "all 400ms ease-out",
        }}
      >
        {casterName} activates a trick!
      </div>

      {/* Card container with glow */}
      <div
        className="relative"
        style={{
          transform: phase === "enter" ? "scale(0.7) translateY(40px)" : "scale(1) translateY(0)",
          opacity: phase === "enter" ? 0 : 1,
          transition: "all 500ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Glow ring behind card */}
        {showGlow && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              boxShadow: `0 0 40px 15px rgba(168,85,247,0.5), 0 0 80px 30px rgba(168,85,247,0.2)`,
              animation: "reveal-glow-pulse 1.5s ease-in-out infinite",
            }}
          />
        )}

        {/* Trick card */}
        <img
          src={`/api/cards/render/${encodeURIComponent(trick.card.cardId || trick.card.name)}?${CACHE_BUST}`}
          alt={trick.card.name}
          className="w-44 sm:w-52 rounded-lg select-none relative z-10"
          style={{
            boxShadow: showGlow
              ? "0 0 30px rgba(168,85,247,0.6), 0 0 60px rgba(0,0,0,0.5)"
              : "0 0 20px rgba(0,0,0,0.5)",
            transition: "box-shadow 500ms",
          }}
          draggable={false}
        />

        {/* "✨ Trick!" badge */}
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-display font-black tracking-widest uppercase px-3 py-1 rounded-full z-20"
          style={{
            background: "rgba(168,85,247,0.3)",
            border: "1px solid rgba(168,85,247,0.6)",
            color: "#c084fc",
            opacity: showGlow ? 1 : 0,
            transform: showGlow ? "translateY(0)" : "translateY(8px)",
            transition: "all 300ms ease-out",
          }}
        >
          ✨ Trick!
        </div>
      </div>

      {/* Effect description */}
      {showEffect && (
        <div
          className="mt-6 text-center max-w-xs"
          style={{
            animation: "combat-calc-in 400ms ease-out both",
          }}
        >
          <div
            className="text-sm font-bold font-display tracking-wider"
            style={{ color: "#c084fc" }}
          >
            {trick.card.name}
          </div>
          <div
            className="text-xs mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            {trick.description}
          </div>
        </div>
      )}

      {/* Dismiss hint */}
      {canDismiss && (
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm tracking-wider uppercase animate-pulse"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          Tap to continue
        </div>
      )}
    </div>
  );
}
