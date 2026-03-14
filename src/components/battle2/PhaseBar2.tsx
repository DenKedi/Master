"use client";

import { ChevronIcon, ConfirmIcon } from "./icons";

interface PhaseBar2Props {
  turn: number;
  phase: "select" | "resolve";
  playerConfirmed: boolean;
  opponentConfirmed: boolean;
  hasDrawn: boolean;
}

const PHASES = ["draw", "select", "resolve"] as const;

function phaseLabel(p: (typeof PHASES)[number]) {
  switch (p) {
    case "draw": return "Draw";
    case "select": return "Select";
    case "resolve": return "Resolve";
  }
}

function currentPhaseIndex(phase: "select" | "resolve", hasDrawn: boolean) {
  if (phase === "resolve") return 2;
  if (hasDrawn) return 1;
  return 0;
}

export default function PhaseBar2({
  turn,
  phase,
  playerConfirmed,
  opponentConfirmed,
  hasDrawn,
}: PhaseBar2Props) {
  const activeIdx = currentPhaseIndex(phase, hasDrawn);

  return (
    <div className="relative z-10 flex items-center justify-between px-4 py-2" style={{ background: "var(--b2-bg)", borderBottom: "1px solid var(--b2-border)" }}>
      {/* Turn label */}
      <span className="font-display text-xs font-bold tracking-[0.2em] uppercase" style={{ color: "var(--gold)" }}>
        Turn {turn}
      </span>

      {/* Phase stepper */}
      <div className="flex items-center gap-1">
        {PHASES.map((p, i) => (
          <div key={p} className="flex items-center">
            <div
              className="b2-phase-node"
              data-active={i === activeIdx ? "true" : undefined}
              data-done={i < activeIdx ? "true" : undefined}
            >
              {i < activeIdx ? (
                <ConfirmIcon size={12} />
              ) : null}
              {phaseLabel(p)}
            </div>
            {i < PHASES.length - 1 && (
              <ChevronIcon size={14} className="mx-0.5" style={{ color: "var(--b2-text-muted)", opacity: 0.4 }} />
            )}
          </div>
        ))}
      </div>

      {/* Spacer for symmetry */}
      <div className="w-16" />
    </div>
  );
}
