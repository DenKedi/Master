"use client";
import { usePrefetch } from "@/hooks/usePrefetch";

const LABELS = ["Cards", "Decks", "Shop", "Currency", "Friends"] as const;

export default function HubPrefetchStatus() {
  const { cards, decks, shop, currency, friends, progress, loading } = usePrefetch();
  const buckets = [cards, decks, shop, currency, friends];

  function reloadAll() {
    cards.refetch();
    decks.refetch();
    shop.refetch();
    currency.refetch();
    friends.refetch();
  }

  return (
    <div className="flex items-center gap-3">
      {/* Progress segments */}
      <div className="flex items-center gap-1.5">
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
              {errored ? "✕" : done ? "✓" : "⋯"}
            </span>
          );
        })}
      </div>

      {/* Reload button */}
      <button
        onClick={reloadAll}
        disabled={loading}
        className="px-2.5 py-1 text-[10px] tracking-widest uppercase font-bold transition-all duration-200"
        style={{
          color: loading ? "var(--text-muted)" : "var(--gold)",
          background: loading ? "rgba(200,150,42,0.05)" : "rgba(200,150,42,0.10)",
          border: `1px solid ${loading ? "rgba(200,150,42,0.1)" : "rgba(200,150,42,0.25)"}`,
          clipPath: "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "⋯" : "⟳"}
      </button>
    </div>
  );
}
