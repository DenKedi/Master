"use client";

import type { TurnPhase } from "@/lib/battle/types";

interface PhaseIndicatorProps {
  currentPhase: TurnPhase;
  turn: number;
  playerConfirmed: boolean;
  opponentConfirmed: boolean;
}

export default function PhaseIndicator({
  currentPhase,
  turn,
  playerConfirmed,
  opponentConfirmed,
}: PhaseIndicatorProps) {
  const phaseLabel =
    currentPhase === "select"
      ? playerConfirmed
        ? "Waiting…"
        : "Select Moves"
      : "Resolving";

  const phaseColor =
    currentPhase === "resolve"
      ? "#a855f7"
      : playerConfirmed
        ? "var(--text-muted)"
        : "var(--gold-bright)";

  return (
    <div className="flex items-center gap-2">
      <div
        className="text-[10px] font-bold tracking-widest uppercase"
        style={{ color: "var(--gold-bright)" }}
      >
        Turn {turn}
      </div>
      <div
        className="flex items-center gap-0.5 px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase"
        style={{
          background: `${phaseColor}20`,
          border: `1px solid ${phaseColor}80`,
          color: phaseColor,
          boxShadow: `0 0 8px ${phaseColor}33`,
        }}
      >
        {phaseLabel}
      </div>
      {/* Confirmation dots */}
      <div className="flex items-center gap-1 ml-1">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: playerConfirmed ? "#22c55e" : "rgba(255,255,255,0.15)",
            boxShadow: playerConfirmed ? "0 0 6px #22c55e80" : "none",
          }}
          title={playerConfirmed ? "You: Ready" : "You: Selecting"}
        />
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: opponentConfirmed ? "#ef4444" : "rgba(255,255,255,0.15)",
            boxShadow: opponentConfirmed ? "0 0 6px #ef444480" : "none",
          }}
          title={opponentConfirmed ? "Opponent: Ready" : "Opponent: Selecting"}
        />
      </div>
    </div>
  );
}
