"use client";

import type { BattleCard, CardEffect } from "@/lib/battle/types";
import { CloseIcon, SwordIcon, ShieldIcon, ComboIcon } from "./icons";
import { useEffect, useCallback, useRef } from "react";
import { RENDER_V } from "@/lib/renderVersion";
import { RARITY_COLORS } from "@/lib/rarityColors";


interface CardInspect2Props {
  card: BattleCard;
  /** Combo recipe info if applicable */
  comboInfo?: {
    characterName: string;
    arsenalName: string;
  } | null;
  /** Action button (e.g. "Play as Fighter") */
  action?: {
    label: string;
    onClick: () => void;
  } | null;
  /** How many px from the bottom the panel should stop (e.g. hand tray height) */
  bottomOffset?: number;
  /** Keep panel alive when mouse moves into it */
  onPanelMouseEnter?: () => void;
  onPanelMouseLeave?: () => void;
  onClose: () => void;
}

function triggerLabel(trigger: string) {
  switch (trigger) {
    case "on-play": return "On Play";
    case "on-combo": return "On Combo";
    case "on-attack": return "On Attack";
    case "on-defend": return "On Defend";
    case "passive": return "Passive";
    case "on-discard": return "On Discard";
    case "on-death": return "On Death";
    default: return trigger;
  }
}

function typeLabel(type: string) {
  switch (type) {
    case "character": return "Character";
    case "arsenal": return "Arsenal";
    case "destination": return "Destination";
    case "trick": return "Trick";
    default: return type;
  }
}

function typeColor(type: string) {
  switch (type) {
    case "character": return "var(--b2-type-character)";
    case "arsenal": return "var(--b2-type-arsenal)";
    case "destination": return "var(--b2-type-destination)";
    case "trick": return "var(--b2-type-trick)";
    default: return "var(--b2-text-muted)";
  }
}

export default function CardInspect2({
  card,
  comboInfo,
  action,
  bottomOffset = 0,
  onPanelMouseEnter,
  onPanelMouseLeave,
  onClose,
}: CardInspect2Props) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Measure the rendered card image width so the info section matches it exactly
  const imgRef = useRef<HTMLImageElement>(null);
  const updateWidth = useCallback(() => {}, []);

  return (
    <>
      {/* Panel — flex column filling from top-0 to bottomOffset, no scroll */}
      <div
        className="fixed top-0 right-0 z-50 w-[540px] max-w-[90vw] b2-glass-strong b2-animate-slide-right pointer-events-auto flex flex-col overflow-hidden"
        style={{
          bottom: bottomOffset,
          borderColor: RARITY_COLORS[card.rarity] ?? "var(--b2-border-light)",
          boxShadow: `0 0 24px ${(RARITY_COLORS[card.rarity] ?? "rgba(200,150,42,0.3)") + "55"}`,
        }}
        onMouseEnter={onPanelMouseEnter}
        onMouseLeave={onPanelMouseLeave}
      >
        {/* Close button */}
        <button
          className="absolute top-3 right-3 p-2 rounded-md hover:bg-white/5 transition-colors z-10"
          onClick={onClose}
          aria-label="Close"
        >
          <CloseIcon size={22} style={{ color: "var(--b2-text-muted)" }} />
        </button>

        {/* ── Card image — fills full width, heights itself by aspect ratio ── */}
        <div style={{
          flex: card.type === "destination" ? "0 0 auto" : "1 1 0",
          minHeight: 0,
          overflow: "hidden",
          padding: card.type === "destination" ? "10px 8px 0 8px" : "10px 36px 0 8px",
          aspectRatio: card.type === "destination" ? "880 / 560" : undefined,
          maxHeight: card.type === "destination" ? undefined : undefined,
        }}>
          <img
            ref={imgRef}
            src={`/api/cards/render/${encodeURIComponent(card.cardId || card.name)}?v=${RENDER_V}`}
            alt={card.name}
            draggable={false}
            onLoad={updateWidth}
            style={{
              width: "100%",
              height: "100%",
              objectFit: card.type === "destination" ? "contain" : "cover",
              objectPosition: "top",
              display: "block",
            }}
          />
        </div>

        {/* Divider */}
        <div style={{ flexShrink: 0, height: 1, background: "rgba(255,255,255,0.06)" }} />

        {/* ── Info — compact fixed section at the bottom ── */}
        <div
          className="flex flex-col py-2 gap-1.5 overflow-hidden"
          style={{ flexShrink: 0, paddingLeft: 8, paddingRight: 8 }}
        >
          {/* Name + type + rarity */}
          <div style={{ flexShrink: 0 }}>
            <h3
              className="font-display font-bold text-xl tracking-wider uppercase truncate"
              style={{ color: "var(--b2-text)" }}
            >
              {card.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{
                  color: typeColor(card.type),
                  background: `color-mix(in srgb, ${typeColor(card.type)} 15%, transparent)`,
                }}
              >
                {typeLabel(card.type)}
              </span>
              <span
                className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{
                  color: RARITY_COLORS[card.rarity] ?? "var(--b2-text-muted)",
                  background: `${(RARITY_COLORS[card.rarity] ?? "rgba(255,255,255,0.04)") + "22"}`,
                  border: `1px solid ${(RARITY_COLORS[card.rarity] ?? "transparent") + "44"}`,
                }}
              >
                {card.rarity}
              </span>
            </div>
          </div>

          {/* Stats */}
          {(card.type === "character" || card.type === "arsenal") && (
            <div className="flex items-center gap-5" style={{ flexShrink: 0 }}>
              <div className="flex items-center gap-1.5">
                <SwordIcon size={16} style={{ color: "var(--b2-danger)" }} />
                <span className="font-bold text-base tabular-nums" style={{ color: "var(--b2-text)" }}>{card.attack}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldIcon size={16} style={{ color: "var(--b2-type-arsenal)" }} />
                <span className="font-bold text-base tabular-nums" style={{ color: "var(--b2-text)" }}>{card.defense}</span>
              </div>
            </div>
          )}

          {/* Description */}
          {card.description && (
            <p
              className="text-sm leading-snug"
              style={{ color: "var(--b2-text-muted)", flexShrink: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}
            >
              {card.description}
            </p>
          )}

          {/* Effects — single line per effect, no grow */}
          {card.effects.length > 0 && (
            <div className="flex flex-col gap-1">
              {card.effects.map((eff, i) => (
                <div
                  key={i}
                  className="rounded px-2 py-1 text-xs"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider mr-1.5"
                    style={{ color: "var(--b2-accent)" }}
                  >
                    {triggerLabel(eff.trigger)}
                  </span>
                  <span style={{ color: "var(--b2-text)" }}>{eff.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Combo recipe */}
          {comboInfo && (
            <div
              className="rounded-lg px-3 py-2"
              style={{
                flexShrink: 0,
                background: "rgba(74, 30, 138, 0.12)",
                border: "1px solid var(--border-arcane)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <ComboIcon size={14} style={{ color: "var(--b2-combo)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--b2-combo)" }}>
                  Combo Recipe
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--b2-text-muted)" }}>
                {comboInfo.characterName} + {comboInfo.arsenalName}
              </p>
            </div>
          )}

          {/* Action button */}
          {action && (
            <button
              className="b2-btn b2-btn-accent w-full"
              style={{ flexShrink: 0 }}
              onClick={() => { action.onClick(); onClose(); }}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
