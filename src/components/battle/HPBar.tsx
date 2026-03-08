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

  const barColor = isCritical
    ? "linear-gradient(90deg, #dc2626, #ef4444)"
    : isLow
    ? "linear-gradient(90deg, #f59e0b, #ef4444)"
    : "linear-gradient(90deg, rgb(17, 3, 28), rgb(227, 185, 56))";

  const glowColor = isCritical
    ? "0 0 12px rgba(220,38,38,0.5)"
    : isLow
    ? "0 0 10px rgba(245,158,11,0.4)"
    : "0 0 6px rgba(227,185,56,0.3)";

  return (
    <div
      className={`flex flex-col gap-1 ${align === "right" ? "items-end" : "items-start"}`}
    >
      <div className="flex items-center gap-2 w-full justify-between">
        <span
          className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </span>
        <span
          className="text-xs font-bold tabular-nums"
          style={{ color: isCritical ? "#ef4444" : isLow ? "#f59e0b" : "var(--gold-bright)" }}
        >
          {current}/{max}
        </span>
      </div>
      <div
        className="w-full h-1.5 rounded-full overflow-hidden relative"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: barColor,
            boxShadow: glowColor,
          }}
        />
        {recentDelta && recentDelta < 0 && (
          <div
            className="absolute top-0 right-2 -mt-5 text-xs font-bold animate-slide-up"
            style={{ color: "#ef4444" }}
          >
            {recentDelta}
          </div>
        )}
      </div>
    </div>
  );
}
