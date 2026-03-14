"use client";

import type { BattleCard, BattleCardType } from "@/lib/battle/types";
import type { DropZoneId } from "@/hooks/useBattleDrag";
import { ConfirmIcon, SwordIcon } from "./icons";
import CardInHand2 from "./CardInHand2";

interface HandTray2Props {
  hand: BattleCard[];
  deckCount: number;
  deckName?: string;
  /** Card UIDs that are staged (selected for play) */
  stagedUids: Set<string>;
  /** Card UIDs to highlight */
  highlightUids?: string[];
  /** Is the confirm button active */
  canConfirm: boolean;
  /** Is it confirmed already */
  confirmed: boolean;
  /** Disabled state */
  disabled: boolean;
  /** Should the deck be highlighted (draw phase) */
  shouldDraw?: boolean;
  /** Drag-and-drop: returns draggable props for a card */
  getDraggableProps?: (card: BattleCard, canDrag: boolean) => Record<string, unknown>;
  /** Card click handler */
  onCardClick?: (card: BattleCard) => void;
  /** Card hover handler */
  onCardHover?: (card: BattleCard) => void;
  /** Card hover-out handler */
  onCardHoverOut?: () => void;
  /** Deck click handler */
  onDeckClick?: () => void;
  /** Confirm handler */
  onConfirm: () => void;
  /** Is the "Use Arsenal" button active */
  canConfirmArsenal?: boolean;
  /** Confirm arsenal handler */
  onConfirmArsenal?: () => void;
  /** Which card uid is currently visually animating a draw */
  animatingDrawUid?: string;
}

export default function HandTray2({
  hand,
  deckCount,
  deckName,
  stagedUids,
  highlightUids = [],
  animatingDrawUid,
  canConfirm,
  confirmed,
  disabled,
  getDraggableProps,
  onCardClick,
  onCardHover,
  onCardHoverOut,
  onDeckClick,
  onConfirm,
  canConfirmArsenal,
  onConfirmArsenal,
  shouldDraw,
}: HandTray2Props) {
  return (
    <div className="px-3 py-3 flex items-center gap-3 shrink-0 overflow-visible" style={{ height: 210, borderTop: "1px solid var(--b2-border)", background: "rgba(5,0,13,0.6)" }}>
      {/* Deck pile */}
      <div className="flex flex-col items-center shrink-0 mx-2" id="battle2-deck-pile">
        <div
          className={`relative flex items-center justify-center rounded-md overflow-hidden cursor-pointer transition-all duration-300 hover:brightness-110 ${shouldDraw ? "animate-pulse" : ""}`}
          onClick={onDeckClick}
          style={{
            width: 128,
            height: 177,
            border: shouldDraw ? "2px solid var(--gold-bright)" : "1px solid var(--border-gold)",
            boxShadow: shouldDraw
              ? "0 0 20px rgba(200,150,42,0.5), 0 0 40px rgba(200,150,42,0.2)"
              : "0 0 8px rgba(200,150,42,0.08)",
          }}
        >
          <img src="/card-back.webp" alt="Deck" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
          {/* Count badge */}
          <span
            className="absolute -top-1.5 -right-1.5 text-[10px] font-bold tabular-nums px-1 py-0.5 rounded-full"
            style={{
              background: "rgba(12,12,18,0.9)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "var(--b2-text-muted)",
              minWidth: "18px",
              textAlign: "center",
            }}
          >
            {deckCount}
          </span>
          {/* Draw prompt overlay */}
          {shouldDraw && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
              <span className="text-[10px] font-display font-bold tracking-wider uppercase" style={{ color: "var(--gold-bright)", textShadow: "0 0 8px rgba(200,150,42,0.8)" }}>Draw</span>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-24 shrink-0" style={{ background: "linear-gradient(to bottom, transparent, var(--gold-dim), transparent)" }} />

      {/* Hand cards */}
      <div className="flex-1 flex items-center gap-2 overflow-visible py-1">
        {hand.map((card) => (
          <div key={card.uid} id={`hand-card-slot-${card.uid}`}>
            <CardInHand2
              card={card}
              staged={stagedUids.has(card.uid)}
              highlighted={highlightUids.includes(card.uid)}
              isPlaceholder={animatingDrawUid === card.uid}
              draggableProps={getDraggableProps?.(card, !disabled && !confirmed)}
              onClick={() => onCardClick?.(card)}
              onHover={() => onCardHover?.(card)}
              onHoverOut={onCardHoverOut}
            />
          </div>
        ))}
        {hand.length === 0 && (
          <span className="text-xs italic px-4" style={{ color: "var(--b2-text-muted)" }}>
            No cards in hand
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-16 shrink-0" style={{ background: "linear-gradient(to bottom, transparent, var(--gold-dim), transparent)" }} />

      {/* Confirm / Use Arsenal button */}
      {canConfirmArsenal ? (
        <button
          className="b2-btn b2-btn-accent shrink-0"
          disabled={disabled}
          onClick={onConfirmArsenal}
          data-action="confirm-arsenal"
        >
          <SwordIcon size={16} />
          <span className="hidden sm:inline">Use Arsenal</span>
        </button>
      ) : (
        <button
          className={`b2-btn shrink-0 ${confirmed ? "b2-btn-accent" : "b2-btn-accent"}`}
          disabled={!canConfirm || disabled}
          onClick={onConfirm}
          data-action="confirm"
          style={{
            opacity: confirmed ? 0.5 : undefined,
          }}
        >
          <ConfirmIcon size={16} />
          <span className="hidden sm:inline">{confirmed ? "Locked" : "Confirm"}</span>
        </button>
      )}
    </div>
  );
}
