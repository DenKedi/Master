"use client";

import Image from "next/image";
import type { BattleCard } from "@/lib/battle/types";
import { useEffect, useState, useRef, useCallback } from "react";

export interface TrickBanner2Data {
  card: BattleCard;
  playerId: string;
  description: string;
}

interface TrickBanner2Props {
  trick: TrickBanner2Data;
  playerName: string;
  opponentName: string;
  onDone: () => void;
}

export default function TrickBanner2({
  trick,
  playerName,
  opponentName,
  onDone,
}: TrickBanner2Props) {
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");
  const [canDismiss, setCanDismiss] = useState(false);
  const doneRef = useRef(false);
  const isPlayer = trick.playerId === "player";
  const casterName = isPlayer ? playerName : opponentName;

  const dismiss = useCallback(() => {
    if (doneRef.current || !canDismiss) return;
    doneRef.current = true;
    setPhase("exit");
    setTimeout(onDone, 350);
  }, [onDone, canDismiss]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPhase("show");
      setCanDismiss(true);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        dismiss();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dismiss]);

  const isExiting = phase === "exit";
  const accentColor = isPlayer ? "var(--gold)" : "var(--crimson)";
  const glowRgb = isPlayer ? "200,150,42" : "200,60,80";

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.82)",
        opacity: isExiting ? 0 : 1,
        transition: "opacity 350ms ease-out",
        pointerEvents: "all",
      }}
      onClick={canDismiss ? dismiss : undefined}
    >
      <div
        style={{
          opacity: phase === "enter" ? 0 : 1,
          transform: phase === "enter" ? "scale(0.82) translateY(20px)" : "scale(1) translateY(0)",
          transition: "all 420ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div
          className="b2-glass-strong rounded-2xl px-8 py-7 flex flex-col items-center gap-4 cursor-pointer"
          style={{
            borderColor: `rgba(${glowRgb},0.35)`,
            boxShadow: `0 0 40px 12px rgba(${glowRgb},0.2), 0 0 80px 30px rgba(${glowRgb},0.08)`,
            minWidth: "260px",
            maxWidth: "320px",
          }}
        >
          {/* Caster label */}
          <div
            className="text-xs tracking-[0.25em] uppercase font-bold"
            style={{ color: accentColor }}
          >
            {casterName} activates a trick!
          </div>

          {/* Trick icon */}
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center"
            style={{
              background: `rgba(${glowRgb},0.12)`,
              boxShadow: `0 0 16px 4px rgba(${glowRgb},0.25)`,
              border: `1px solid rgba(${glowRgb},0.3)`,
            }}
          >
            <Image
              src="/icons/types/trick.png"
              alt="Trick"
              width={40}
              height={40}
              style={{ filter: `drop-shadow(0 0 6px rgba(${glowRgb},0.7))` }}
            />
          </div>

          {/* Card name */}
          <div
            className="text-base font-bold tracking-wide text-center"
            style={{ color: accentColor }}
          >
            {trick.card.name}
          </div>

          {/* Description */}
          <div
            className="text-xs text-center leading-snug"
            style={{ color: "var(--b2-text-muted)" }}
          >
            {trick.description}
          </div>

          {/* Tap hint */}
          <div
            className="text-[10px] tracking-widest uppercase mt-1"
            style={{ color: "var(--b2-text-muted)", opacity: 0.45 }}
          >
            Tap to continue
          </div>
        </div>
      </div>
    </div>
  );
}
