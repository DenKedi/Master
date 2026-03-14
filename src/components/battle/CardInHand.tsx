"use client";

import { useState } from "react";
import type { BattleCard } from "@/lib/battle/types";
import { RENDER_V } from "@/lib/renderVersion";

/** Build the render-route URL for a card. Combo results use query overrides. */
function cardImageUrl(card: BattleCard): string {
  const base = `/api/cards/render/${encodeURIComponent(card.cardId || card.name)}`;
  // If card has overridden stats from a combo bonus, pass them as query params
  if (card.comboSource) {
    const p = new URLSearchParams();
    p.set("atk", String(card.attack));
    p.set("def", String(card.defense));
    p.set("v", String(RENDER_V));
    return `${base}?${p}`;
  }
  return `${base}?v=${RENDER_V}`;
}

interface CardInHandProps {
  card: BattleCard;
  onClick?: () => void;
  /** Open the card display panel (single click / tap) */
  onInspect?: () => void;
  /** Desktop hover start (for combo preview) */
  onHoverStart?: () => void;
  /** Desktop hover end */
  onHoverEnd?: () => void;
  highlighted?: boolean;
  disabled?: boolean;
  /** Card is staged (selected for play) — show dimmed with indicator */
  staged?: boolean;
  /** Opponent cards show face-down */
  faceDown?: boolean;
  /** Extra pointer-event props for drag support */
  dragProps?: Record<string, unknown>;
}

const RARITY_COLORS: Record<string, string> = {
  normal:  "rgba(156,163,175,0.6)",
  nice:    "rgba(96,165,250,0.7)",
  special: "rgba(248,113,113,0.7)",
  uiiiii:  "rgba(74,222,128,0.7)",
  unknown: "rgba(168,85,247,0.7)",
};

export default function CardInHand({
  card,
  onClick,
  onInspect,
  onHoverStart,
  onHoverEnd,
  highlighted,
  disabled,
  staged,
  faceDown,
  dragProps,
}: CardInHandProps) {
  if (faceDown) {
    return (
      <div
        className="w-20 h-28 sm:w-24 sm:h-[8.5rem] rounded flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, #1a0030, #0a0018)",
          border: "1px solid rgba(200,150,42,0.15)",
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
        }}
      >
        <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">
          🂠
        </div>
      </div>
    );
  }

  return (
    <button
      data-card={card.uid}
      onClick={disabled ? undefined : (onInspect ?? onClick)}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      aria-disabled={disabled || undefined}
      className={[
        "relative w-20 h-28 sm:w-24 sm:h-[8.5rem] rounded flex-shrink-0 flex flex-col p-1.5 text-left transition-all duration-200 select-none",
        highlighted && !staged ? "ring-2 ring-yellow-400 scale-105 z-10" : "",
        staged ? "opacity-40 grayscale scale-95" : "",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-grab hover:-translate-y-1 hover:shadow-lg active:cursor-grabbing",
      ].join(" ")}
      style={{
        background: "linear-gradient(135deg, rgba(15,0,32,0.95), rgba(8,0,18,0.95))",
        border: `1px solid ${highlighted && !staged ? "var(--gold-bright)" : RARITY_COLORS[card.rarity] ?? "var(--border-gold)"}`,
        boxShadow: highlighted && !staged ? "0 0 16px rgba(200,150,42,0.4)" : "none",
        ...(dragProps?.style as React.CSSProperties ?? {}),
      }}
      {...(dragProps ? {
        onPointerDown: dragProps.onPointerDown as React.PointerEventHandler,
      } : {})}
    >
      {/* Rendered card image */}
      <CardImage name={card.name} src={cardImageUrl(card)} />

      {/* Staged / highlight overlays remain via className above */}
    </button>
  );
}

function CardImage({ name, src }: { name: string; src: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && (
        <div
          className="absolute inset-0 rounded animate-pulse"
          style={{ background: "rgba(15,0,32,0.9)" }}
        />
      )}
      <img
        src={src}
        alt={name}
        draggable={false}
        onLoad={() => setLoaded(true)}
        className="absolute inset-0 w-full h-full object-cover rounded select-none"
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 200ms" }}
      />
    </>
  );
}
