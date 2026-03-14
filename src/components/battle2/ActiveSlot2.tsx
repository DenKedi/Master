"use client";

import type { BattleCard } from "@/lib/battle/types";
import { SwordIcon, ShieldIcon } from "./icons";
import { useRef } from "react";
import { RENDER_V } from "@/lib/renderVersion";

interface ActiveSlot2Props {
  card: BattleCard | null;
  /** Arsenal equipped to this fighter */
  arsenal?: BattleCard | null;
  /** Arsenal bonus stats if equipped */
  arsenalBonus?: { attack: number; defense: number } | null;
  /** Whether this card was produced by a combo */
  isCombo?: boolean;
  /** Side of arena */
  side: "player" | "opponent";
  /** Drop zone ref callback for drag-and-drop */
  dropRef?: (el: HTMLElement | null) => void;
  /** Is a valid card being dragged over this zone */
  isDropTarget?: boolean;
  /** Highlight for tutorial */
  highlighted?: boolean;
  /** Click handler for the fighter card */
  onClick?: () => void;
  /** Click handler for the arsenal card */
  onArsenalClick?: () => void;
  /** Hover handler — called with the hovered card (fighter or arsenal) */
  onHover?: (card: BattleCard) => void;
  /** Hover-out handler */
  onHoverOut?: () => void;
}

function getRarityBorderColor(rarity: string = "normal"): string {
  const r = rarity.toLowerCase();
  if (r === "special") return "rgba(220,38,38,1)";
  if (r === "nice") return "rgba(59,130,246,1)";
  if (r === "uiiiii" || r === "unknown") return "rgba(34,197,94,1)";
  return "var(--border-gold)";
}

export default function ActiveSlot2({
  card,
  arsenal,
  arsenalBonus,
  isCombo,
  side,
  dropRef,
  isDropTarget,
  highlighted,
  onClick,
  onArsenalClick,
  onHover,
  onHoverOut,
}: ActiveSlot2Props) {
  const slotRef = useRef<HTMLDivElement>(null);

  const handleRef = (el: HTMLDivElement | null) => {
    (slotRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    dropRef?.(el);
  };

  const totalAttack = card ? card.attack + (arsenalBonus?.attack ?? 0) : 0;
  const totalDefense = card ? card.defense + (arsenalBonus?.defense ?? 0) : 0;
  const hasBonus = arsenalBonus && (arsenalBonus.attack > 0 || arsenalBonus.defense > 0);

  return (
    <div
      ref={handleRef}
      className={`relative flex items-end gap-1 transition-all duration-200 ${
        isDropTarget ? "scale-[1.03]" : ""
      } ${highlighted ? "b2-animate-pulse" : ""}`}
      style={{ cursor: card ? "pointer" : "default" }}
      data-area={side === "player" ? "player-active" : "opponent-active"}
    >
      {/* Arsenal card — shown to the left of the fighter (player) or right (opponent) */}
      {arsenal && side === "player" && (
        <div
          className="relative rounded-md overflow-hidden transition-all duration-200 cursor-pointer hover:brightness-110"
          onClick={(e) => { e.stopPropagation(); onArsenalClick?.(); }}
          onMouseEnter={() => onHover?.(arsenal)}
          onMouseLeave={onHoverOut}
          style={{
            width: 64,
            height: 90,
            border: "1px solid var(--b2-type-arsenal)",
            boxShadow: "0 0 12px rgba(96,144,208,0.3)",
            marginBottom: 10,
          }}
        >
          <img
            src={`/api/cards/render/${encodeURIComponent(arsenal.cardId || arsenal.name)}?atk=${arsenal.attack}&def=${arsenal.defense}&v=${RENDER_V}`}
            alt={arsenal.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      )}

      {/* Main fighter column */}
      <div
        className="flex flex-col items-center"
        onClick={card ? onClick : undefined}
        onMouseEnter={card ? () => onHover?.(card) : undefined}
        onMouseLeave={onHoverOut}
      >
        {/* Card image */}
        <div
          className="relative rounded-lg overflow-hidden transition-all duration-200"
          style={{
            width: 160,
            height: 224,
            border: isDropTarget
              ? "2px solid var(--gold-bright)"
              : card
              ? `2px solid ${getRarityBorderColor(card.rarity)}`
              : "2px dashed var(--border-gold)",
            boxShadow: isDropTarget
              ? "0 0 20px rgba(200,150,42,0.4), 0 0 60px rgba(200,150,42,0.1)"
              : card ? `0 0 20px ${getRarityBorderColor(card.rarity)}33` : "none",
          }}
        >
          {card ? (
            <img
              src={`/api/cards/render/${encodeURIComponent(card.cardId || card.name)}?atk=${card.attack}&def=${card.defense}&v=${RENDER_V}`}
              alt={card.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center backdrop-blur-sm"
              style={{ background: "rgba(5,0,13,0.7)" }}
            >
              <span className="text-[10px]" style={{ color: "var(--b2-text-muted)" }}>
                {side === "player" ? "Your Fighter" : "Opponent"}
              </span>
            </div>
          )}
        </div>

        {/* Stat badges — always rendered to reserve space, hidden when no card */}
        <div className="flex items-center gap-3 mt-1.5" style={{ visibility: card ? "visible" : "hidden" }}>
          <div className="flex items-center gap-1">
            <SwordIcon size={14} style={{ color: "var(--b2-danger)" }} />
            <span className="text-sm font-bold tabular-nums" style={{ color: "var(--b2-text)" }}>
              {totalAttack}
            </span>
            {hasBonus && arsenalBonus!.attack > 0 && (
              <span className="text-[10px] font-semibold" style={{ color: "var(--b2-type-arsenal)" }}>
                +{arsenalBonus!.attack}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <ShieldIcon size={14} style={{ color: "var(--b2-type-arsenal)" }} />
            <span className="text-sm font-bold tabular-nums" style={{ color: "var(--b2-text)" }}>
              {totalDefense}
            </span>
            {hasBonus && arsenalBonus!.defense > 0 && (
              <span className="text-[10px] font-semibold" style={{ color: "var(--b2-type-arsenal)" }}>
                +{arsenalBonus!.defense}
              </span>
            )}
          </div>
        </div>

        {/* Card name — always rendered to reserve space, hidden when no card */}
        <span
          className="font-display text-xs font-bold mt-0.5 max-w-[180px] truncate text-center tracking-wide uppercase"
          style={{ color: "var(--gold-dim)", visibility: card ? "visible" : "hidden" }}
        >
          {card?.name ?? "\u00A0"}
        </span>
      </div>

      {/* Arsenal card — right side for opponent */}
      {arsenal && side === "opponent" && (
        <div
          className="relative rounded-md overflow-hidden transition-all duration-200"
          onMouseEnter={() => onHover?.(arsenal)}
          onMouseLeave={onHoverOut}
          style={{
            width: 64,
            height: 90,
            border: "1px solid var(--b2-type-arsenal)",
            boxShadow: "0 0 12px rgba(96,144,208,0.3)",
            marginBottom: 10,
          }}
        >
          <img
            src={`/api/cards/render/${encodeURIComponent(arsenal.cardId || arsenal.name)}?atk=${arsenal.attack}&def=${arsenal.defense}&v=${RENDER_V}`}
            alt={arsenal.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}
