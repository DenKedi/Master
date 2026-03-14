"use client";
import { usePrefetch } from "@/hooks/usePrefetch";

const LABELS = ["Cards", "Decks", "Shop", "Currency", "Friends"] as const;

export default function PrefetchBar() {
  const { cards, decks, shop, currency, friends, progress, loading } = usePrefetch();

  if (!loading && progress >= 1) return null;

  const buckets = [cards, decks, shop, currency, friends];

  return (
    <div className="mb-3 animate-slide-up">
      {/* Label */}
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-[10px] tracking-[0.25em] uppercase font-bold"
          style={{ color: "var(--gold-dim)" }}
        >
          Loading assets…
        </span>
        <span
          className="text-[10px] tracking-wider tabular-nums"
          style={{ color: "var(--text-muted)" }}
        >
          {Math.round(progress * 100)}%
        </span>
      </div>

      {/* Track */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: 4,
          background: "rgba(200,150,42,0.08)",
          borderRadius: 2,
        }}
      >
        <div
          className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
          style={{
            width: `${progress * 100}%`,
            background: "linear-gradient(90deg, var(--gold-dim), var(--gold), var(--gold-bright))",
            borderRadius: 2,
            boxShadow: "0 0 8px rgba(200,150,42,0.5)",
          }}
        />
      </div>

      {/* Segment labels */}
      <div className="flex gap-2 mt-1.5">
        {LABELS.map((label, i) => {
          const b = buckets[i];
          const done = !b.loading;
          const errored = !!b.error;
          return (
            <span
              key={label}
              className="text-[9px] tracking-wider uppercase transition-colors duration-300"
              style={{
                color: errored
                  ? "var(--crimson-bright)"
                  : done
                    ? "var(--gold)"
                    : "var(--text-muted)",
              }}
            >
              {done ? "✓" : "⋯"} {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
