"use client";

import type { BattleCard } from "@/lib/battle/types";

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

const TYPE_ICONS: Record<string, string> = {
  character: "👤",
  arsenal: "⚔️",
  destination: "🏟️",
  trick: "✨",
};

const CHARACTER_TYPE_ICONS: Record<string, string> = {
  human: "🧑",
  goblin: "👺",
  beast: "🐺",
  demon: "😈",
};

const TYPE_COLORS: Record<string, string> = {
  character: "rgba(200,150,42,0.4)",
  arsenal: "rgba(59,130,246,0.4)",
  destination: "rgba(34,197,94,0.4)",
  trick: "rgba(168,85,247,0.4)",
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
        className="w-20 h-28 sm:w-24 sm:h-32 rounded flex-shrink-0"
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
      disabled={disabled}
      className={[
        "relative w-20 h-28 sm:w-24 sm:h-34 rounded flex-shrink-0 flex flex-col p-1.5 text-left transition-all duration-200 select-none",
        highlighted && !staged ? "ring-2 ring-yellow-400 scale-105 z-10" : "",
        staged ? "opacity-40 grayscale scale-95" : "",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-grab hover:-translate-y-1 hover:shadow-lg active:cursor-grabbing",
      ].join(" ")}
      style={{
        background: "linear-gradient(135deg, rgba(15,0,32,0.95), rgba(8,0,18,0.95))",
        border: `1px solid ${highlighted && !staged ? "var(--gold-bright)" : TYPE_COLORS[card.type] ?? "var(--border-gold)"}`,
        boxShadow: highlighted && !staged ? "0 0 16px rgba(200,150,42,0.4)" : "none",
        ...(dragProps?.style as React.CSSProperties ?? {}),
      }}
      {...(dragProps ? {
        onPointerDown: dragProps.onPointerDown as React.PointerEventHandler,
        onPointerMove: dragProps.onPointerMove as React.PointerEventHandler,
        onPointerUp: dragProps.onPointerUp as React.PointerEventHandler,
        onPointerCancel: dragProps.onPointerCancel as React.PointerEventHandler,
      } : {})}
    >
      {/* Type icon */}
      <div className="text-[10px] flex items-center gap-0.5 mb-0.5">
        <span>{TYPE_ICONS[card.type]}</span>
        <span
          className="uppercase tracking-wider font-bold truncate"
          style={{ color: "var(--text-muted)", fontSize: "7px" }}
        >
          {card.type}
        </span>
        {card.characterType && (
          <span className="ml-auto text-[9px]" title={card.characterType}>
            {CHARACTER_TYPE_ICONS[card.characterType] ?? ''}
          </span>
        )}
      </div>

      {/* Card name */}
      <div
        className="text-[9px] sm:text-[10px] font-bold leading-tight mb-auto truncate"
        style={{ color: "var(--text-primary)" }}
      >
        {card.name}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mt-auto">
        {(card.type === "character" || card.type === "arsenal") && (
          <>
            <div className="text-[10px] font-bold" style={{ color: "#ef4444" }}>
              ⚔{card.attack}
            </div>
            <div className="text-[10px] font-bold" style={{ color: "#3b82f6" }}>
              🛡{card.defense}
            </div>
          </>
        )}
        {card.effects.length > 0 && (card.type === "destination" || card.type === "trick") && (
          <div
            className="text-[7px] truncate"
            style={{ color: "var(--text-muted)" }}
          >
            {card.effects[0].description}
          </div>
        )}
      </div>

      {/* Rarity indicator */}
      <div
        className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full"
        style={{
          background:
            card.rarity === "normal" ? "#6b7280"
            : card.rarity === "nice" ? "#3b82f6"
            : card.rarity === "special" ? "#ef4444"
            : card.rarity === "uiiiii" ? "#22c55e"
            : "#a855f7",
        }}
      />

      {/* C/S tier tag */}
      {(card.type === "character" || card.type === "arsenal") && (
        <div
          className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black leading-none"
          style={{
            background: card.comboSource
              ? "linear-gradient(135deg, #a855f7, #7c3aed)"
              : "linear-gradient(135deg, #c8962a, #a17720)",
            color: "#fff",
            boxShadow: card.comboSource
              ? "0 0 6px rgba(168,85,247,0.6)"
              : "0 0 6px rgba(200,150,42,0.6)",
          }}
        >
          {card.comboSource ? "S" : "C"}
        </div>
      )}
    </button>
  );
}
