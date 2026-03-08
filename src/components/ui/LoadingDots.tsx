"use client";

/**
 * Parchment-style horizontal bouncing dots loading animation.
 * Matches the arcane / dark-fantasy theme used in navbar items.
 *
 * Usage:
 *   <LoadingDots />                       — compact inline dots
 *   <LoadingDots label="Summoning..." />  — dots + flavour text
 *   <LoadingDots size="lg" />             — full-page centred variant
 */

interface LoadingDotsProps {
  /** Optional flavour text displayed above the dots */
  label?: string;
  /** "sm" (inline), "md" (default section), "lg" (full-page) */
  size?: "sm" | "md" | "lg";
}

const DOT_COUNT = 4;

export default function LoadingDots({ label, size = "md" }: LoadingDotsProps) {
  const dotSize = size === "sm" ? 6 : size === "lg" ? 12 : 8;
  const gap = size === "sm" ? 6 : size === "lg" ? 12 : 8;

  const wrapperClass =
    size === "lg"
      ? "flex flex-col items-center justify-center min-h-[60vh] gap-5"
      : size === "sm"
      ? "inline-flex items-center gap-1"
      : "flex flex-col items-center justify-center h-40 gap-4";

  return (
    <div className={wrapperClass}>
      {label && (
        <div
          className="font-display font-bold tracking-[0.2em] uppercase animate-arcane-pulse"
          style={{
            color: "var(--text-muted)",
            fontSize: size === "lg" ? "0.85rem" : "0.7rem",
            letterSpacing: "0.18em",
          }}
        >
          {label}
        </div>
      )}

      <div
        className="loading-dots"
        style={{ display: "flex", alignItems: "center", gap: `${gap}px` }}
      >
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <span
            key={i}
            className="loading-dot"
            style={{
              width: dotSize,
              height: dotSize,
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
