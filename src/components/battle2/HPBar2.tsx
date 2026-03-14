"use client";

import { HeartIcon } from "./icons";

interface HPBar2Props {
  current: number;
  max: number;
  /** Recent HP change for pop-up animation */
  delta?: number;
  /** Whose bar is this */
  label?: string;
  /** Which side: controls alignment */
  side: "left" | "right";
}

function hpLevel(current: number, max: number): "healthy" | "low" | "critical" {
  const pct = current / max;
  if (pct <= 0.15) return "critical";
  if (pct <= 0.3) return "low";
  return "healthy";
}

export default function HPBar2({ current, max, delta, label, side }: HPBar2Props) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const level = hpLevel(current, max);

  return (
    <div
      className="b2-glass rounded-lg px-3 py-2 min-w-[140px]"
      style={{ textAlign: side === "right" ? "right" : "left" }}
    >
      {/* Label row */}
      <div className="flex items-center gap-1.5 mb-1" style={{ justifyContent: side === "right" ? "flex-end" : "flex-start" }}>
        <HeartIcon size={14} className="shrink-0" style={{ color: `var(--b2-hp-${level})` }} />
        {label && (
          <span className="font-display text-xs font-bold tracking-wider uppercase truncate" style={{ color: "var(--b2-text)" }}>
            {label}
          </span>
        )}
        <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--gold-dim)" }}>
          {current}/{max}
        </span>
      </div>

      {/* Bar track */}
      <div className="b2-hp-track relative">
        <div
          className="b2-hp-fill"
          data-level={level}
          style={{ width: `${pct}%` }}
        />

        {/* Damage / heal delta pop */}
        {delta !== undefined && delta !== 0 && (
          <span
            className="b2-animate-damage-pop absolute top-0 font-bold text-sm tabular-nums pointer-events-none"
            style={{
              color: delta < 0 ? "var(--b2-danger)" : "var(--b2-hp-healthy)",
              [side === "right" ? "right" : "left"]: "8px",
            }}
          >
            {delta > 0 ? `+${delta}` : delta}
          </span>
        )}
      </div>
    </div>
  );
}
