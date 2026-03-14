"use client";

import { CrownIcon, SkullIcon, HandshakeIcon } from "./icons";

interface GameOver2Props {
  won: boolean;
  tie?: boolean;
  xpReward?: number;
  isTutorial?: boolean;
  starterDeckGranted?: boolean;
  onContinue: () => void;
}

export default function GameOver2({
  won,
  tie,
  xpReward,
  isTutorial,
  starterDeckGranted,
  onContinue,
}: GameOver2Props) {
  const title = tie ? "Draw" : won ? "Victory" : "Defeat";
  const subtitle = tie
    ? "Neither side prevailed."
    : won
    ? "You have triumphed."
    : "You have fallen. Rise again.";

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center b2-animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative b2-glass-strong rounded-xl px-8 py-10 max-w-sm mx-4 text-center b2-animate-scale-in">
        {/* Corner ornaments */}
        <div className="corner-tl" />
        <div className="corner-br" />
        {/* Icon */}
        <div className="flex items-center justify-center mb-4">
          {tie ? (
            <HandshakeIcon size={56} style={{ color: "var(--b2-text-muted)" }} />
          ) : won ? (
            <CrownIcon size={56} style={{ color: "var(--b2-accent)" }} />
          ) : (
            <SkullIcon size={56} style={{ color: "var(--b2-danger)" }} />
          )}
        </div>

        {/* Title */}
        <h2
          className={`font-display font-black text-3xl tracking-widest uppercase mb-2 ${won ? "text-gold-gradient" : ""}`}
          style={{ color: won ? undefined : tie ? "var(--b2-text)" : "var(--b2-danger)" }}
        >
          {title}
        </h2>

        {/* Subtitle */}
        <p className="text-sm mb-6" style={{ color: "var(--b2-text-muted)" }}>
          {subtitle}
        </p>

        {/* XP reward */}
        {xpReward !== undefined && xpReward > 0 && (
          <div
            className="rounded-md px-4 py-2 mb-4 inline-block"
            style={{ background: "rgba(192, 160, 80, 0.1)", border: "1px solid rgba(192, 160, 80, 0.2)" }}
          >
            <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: "var(--b2-accent)" }}>
              +{xpReward} XP
            </span>
          </div>
        )}

        {/* Starter deck message */}
        {starterDeckGranted && (
          <p className="text-xs mb-4" style={{ color: "var(--b2-text-muted)" }}>
            A starter deck has been added to your collection.
          </p>
        )}

        {/* Continue */}
        <button className="b2-btn b2-btn-accent px-8 py-3" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
