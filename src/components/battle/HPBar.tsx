"use client";

interface HPBarProps {
  current: number;
  max: number;
  label: string;
  /** Show on left (player) or right (opponent) */
  align?: "left" | "right";
  /** Recent damage for animation */
  recentDelta?: number;
}

/**
 * 90-degree arc HP indicator.
 * For player (align="left"): arc goes from bottom to left (bottom-left quadrant).
 * For opponent (align="right"): arc goes from top to right (top-right quadrant).
 */
export default function HPBar({
  current,
  max,
  label,
  align = "left",
  recentDelta,
}: HPBarProps) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const isLow = pct <= 30;
  const isCritical = pct <= 15;

const color = isCritical ? "#ef4444" : isLow ? "#f59e0b" : "#f0c040";
  const trackColor = "rgba(255,255,255,0.08)";

  // SVG arc parameters
  const size = 100;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const quarterArc = circumference / 4; // 90 degrees

  // How much of the 90-degree arc to fill
  const filledArc = quarterArc * (pct / 100);
  const emptyArc = quarterArc - filledArc;

  // Player (left): arc sweeps from right to bottom (bottom-right quadrant, opening inward)
  // Opponent (right): arc sweeps from left to top (top-left quadrant, opening inward)
  const rotation = align === "left" ? 0 : 180;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="block">
        {/* Track (background arc) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
          strokeDasharray={`${quarterArc} ${circumference - quarterArc}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
        />
        {/* Filled arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${filledArc} ${circumference - filledArc}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
          style={{
            transition: "stroke-dasharray 0.7s ease-out, stroke 0.3s",
            filter: `drop-shadow(0 0 4px ${color}60)`,
          }}
        />
      </svg>
      {/* HP text above the arc */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span
          className="text-[11px] font-bold tabular-nums leading-none"
          style={{ color, textShadow: '0 0 6px rgba(0,0,0,0.8)' }}
        >
          {current}/{max}
        </span>
      </div>
      {/* Recent delta */}
      {recentDelta && recentDelta < 0 && (
        <div
          className="absolute text-sm font-bold animate-slide-up"
          style={{
            color: "#ef4444",
            top: -8,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {recentDelta}
        </div>
      )}
    </div>
  );
}
