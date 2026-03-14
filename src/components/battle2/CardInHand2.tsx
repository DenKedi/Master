"use client";

import { useState } from "react";
import type { BattleCard, BattleCardType } from "@/lib/battle/types";
import { CardBackPattern } from "./icons";
import { RENDER_V } from "@/lib/renderVersion";

interface CardInHand2Props {
  card: BattleCard;
  /** Is this card face-down (opponent hand) */
  faceDown?: boolean;
  /** Is this card staged (selected for play) */
  staged?: boolean;
  /** Highlight for tutorial guidance */
  highlighted?: boolean;
  /** If true, card acts as an invisible placeholder */
  isPlaceholder?: boolean;
  /** Draggable props from useBattleDrag */
  draggableProps?: Record<string, unknown>;
  /** Click handler for inspect */
  onClick?: () => void;
  /** Hover handler for inspect panel */
  onHover?: () => void;
  /** Hover-out handler */
  onHoverOut?: () => void;
}

function typeStripeClass(type: BattleCardType) {
  switch (type) {
    case "character": return "b2-card-stripe-character";
    case "arsenal": return "b2-card-stripe-arsenal";
    case "destination": return "b2-card-stripe-destination";
    case "trick": return "b2-card-stripe-trick";
  }
}

function getRarityGradient(rarity: string = "normal") {
  const r = rarity.toLowerCase();
  if (r === "uiiiii" || r === "unknown") {
    return "linear-gradient(135deg, rgba(34,197,94,1) 0%, rgba(74,222,128,1) 50%, rgba(34,197,94,1) 100%)";
  }
  if (r === "special") {
    return "linear-gradient(135deg, rgba(220,38,38,1) 0%, rgba(250,204,21,1) 50%, rgba(220,38,38,1) 100%)";
  }
  if (r === "nice") {
    return "linear-gradient(135deg, rgba(59,130,246,1) 0%, rgba(147,197,253,1) 50%, rgba(59,130,246,1) 100%)";
  }
  return "linear-gradient(135deg, rgba(200,150,42,0.8) 0%, rgba(255,230,120,0.8) 50%, rgba(200,150,42,0.8) 100%)";
}

export default function CardInHand2({
  card,
  faceDown,
  staged,
  highlighted,
  isPlaceholder,
  draggableProps,
  onClick,
  onHover,
  onHoverOut,
}: CardInHand2Props) {
  if (faceDown) {
    return (
      <div
        className="relative rounded-md overflow-hidden shrink-0"
        style={{
          width: 96,
          height: 135,
        }}
      >
        <img
          src="/card-back.webp"
          alt="Card back"
          draggable={false}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const isDestination = card.type === "destination";
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Merge our styles with any draggable styles (e.g. touch-action: none)
  const dragStyle = (draggableProps as { style?: React.CSSProperties } | undefined)?.style;
  const { style: _discardStyle, ...dragRest } = (draggableProps ?? {}) as Record<string, unknown>;

  return (
    <div
      className={`
        relative rounded-md overflow-hidden shrink-0 ${isPlaceholder ? '' : 'cursor-pointer'}
        transition-all duration-150 ease-out z-0
        ${isPlaceholder ? '' : staged ? "translate-y-1 opacity-50 saturate-50" : "hover:-translate-y-1.5 hover:z-10"}
        ${highlighted && !isPlaceholder ? "ring-2 ring-offset-1 ring-offset-transparent" : ""}
      `}
      style={{
        width: 144,
        height: 200,
        padding: isPlaceholder ? 0 : 2,
        background: isPlaceholder ? 'transparent' : getRarityGradient(card.rarity),
        visibility: isPlaceholder ? 'hidden' : 'visible',
        boxShadow: highlighted && !isPlaceholder
          ? "0 0 20px rgba(200,150,42,0.4)"
          : isPlaceholder ? "none" : "0 0 10px rgba(200,150,42,0.08)",
        ...(highlighted && !isPlaceholder ? { ringColor: "var(--gold)" } as React.CSSProperties : {}),
        ...dragStyle,
      }}
      onClick={isPlaceholder ? undefined : onClick}
      onMouseEnter={isPlaceholder ? undefined : onHover}
      onMouseLeave={isPlaceholder ? undefined : onHoverOut}
      data-card={card.uid}
      {...dragRest}
    >
      <div className={`relative w-full h-full rounded-[4px] overflow-hidden`} style={{ background: "linear-gradient(135deg, rgba(15,0,32,0.9), rgba(10,0,24,0.9))" }}>
        <img
          src={`/api/cards/render/${encodeURIComponent(card.cardId || card.name)}?atk=${card.attack}&def=${card.defense}&v=${RENDER_V}`}
          alt={card.name}
          draggable={false}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          className={isDestination ? "absolute top-1/2 left-1/2" : "absolute inset-0 w-full h-full object-cover"}
          style={isDestination ? { width: "157.14%", height: "auto", transform: "translate(-50%, -50%) rotate(90deg)", maxWidth: "none" } : undefined}
        />

        {/* Fallback while image loads or on error */}
        {(!imgLoaded || imgError) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
            <span className="text-[8px] font-bold text-center leading-tight uppercase" style={{ color: "var(--gold-dim)" }}>
              {card.name}
            </span>
          </div>
        )}

        {/* Staged overlay */}
        {staged && (
          <div className="absolute inset-0 bg-black/30" />
        )}
      </div>
    </div>
  );
}
