"use client";

import { useEffect } from "react";
import type { BattleCard } from "@/lib/battle/types";

/* ═══════════════════════════════════════════════════════════════════════════
 *  CardDisplayPanel — Full-detail card inspector + combo preview panel.
 *
 *  Two modes:
 *   "inspect"  – Centered fullscreen overlay (triggered by click).
 *                Shows full card details, optional action button.
 *   "preview"  – Right-side floating panel (triggered by hover).
 *                Shows combo result card or mystery placeholder.
 * ═══════════════════════════════════════════════════════════════════════════ */

// ── Style maps ──────────────────────────────────────────────────────────────

const RARITY_STYLES: Record<string, { border: string; glow: string; text: string; label: string }> = {
  normal:  { border: "rgba(107,114,128,0.5)", glow: "rgba(107,114,128,0.2)", text: "#9ca3af", label: "Normal" },
  nice:    { border: "rgba(59,130,246,0.5)",  glow: "rgba(59,130,246,0.3)",  text: "#60a5fa", label: "Nice" },
  special: { border: "rgba(239,68,68,0.5)",   glow: "rgba(239,68,68,0.3)",   text: "#f87171", label: "Special" },
  uiiiii:  { border: "rgba(34,197,94,0.5)",   glow: "rgba(34,197,94,0.3)",   text: "#4ade80", label: "Uiiiii!" },
  unknown: { border: "rgba(168,85,247,0.5)",  glow: "rgba(168,85,247,0.3)",  text: "#a855f7", label: "Unknown" },
};

const TYPE_ICONS: Record<string, string> = {
  character: "👤",
  arsenal: "⚔️",
  destination: "🏟️",
  trick: "✨",
};

const CHARACTER_TYPE_LABELS: Record<string, { icon: string; label: string }> = {
  human: { icon: "🧑", label: "Human" },
  goblin: { icon: "👺", label: "Goblin" },
  beast: { icon: "🐺", label: "Beast" },
  demon: { icon: "😈", label: "Demon" },
};

// ── Types ───────────────────────────────────────────────────────────────────

export interface ComboPreviewInfo {
  result: BattleCard;
  characterName: string;
  arsenalName: string;
  discovered: boolean;
}

interface CardDisplayPanelProps {
  /** The card to display (null = panel hidden) */
  card: BattleCard | null;
  /** Whether to hide card details (for undiscovered combo results) */
  isHidden?: boolean;
  /** Combo recipe info to display */
  comboInfo?: { characterName: string; arsenalName: string } | null;
  /** Action button (inspect mode only) */
  action?: { label: string; onClick: () => void } | null;
  /** Close handler */
  onClose: () => void;
  /** Display mode — "inspect" = centered overlay, "preview" = side panel */
  mode?: "inspect" | "preview";
  /** Hover-persistence handlers for preview mode */
  onPanelMouseEnter?: () => void;
  onPanelMouseLeave?: () => void;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function CardDisplayPanel({
  card,
  isHidden,
  comboInfo,
  action,
  onClose,
  mode = "inspect",
  onPanelMouseEnter,
  onPanelMouseLeave,
}: CardDisplayPanelProps) {
  // Close on Escape key (inspect mode only)
  useEffect(() => {
    if (!card || mode !== "inspect") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [card, onClose, mode]);

  if (!card) return null;

  const rarity = RARITY_STYLES[card.rarity] ?? RARITY_STYLES.unknown;
  const typeIcon = TYPE_ICONS[card.type] ?? "🃏";

  // ── Shared card content ────────────────────────────────────────────────

  const cardContent = (
    <div
      className={[
        "rounded-2xl overflow-hidden shadow-2xl",
        mode === "inspect" ? "w-full max-w-[340px] sm:max-w-[380px]" : "w-64 sm:w-72",
      ].join(" ")}
      style={{
        background: "linear-gradient(180deg, var(--bg-panel-alt) 0%, var(--bg-deep) 100%)",
        border: `2px solid ${rarity.border}`,
        boxShadow: `0 0 60px ${rarity.glow}, 0 25px 80px rgba(0,0,0,0.9)`,
        maxHeight: mode === "inspect" ? "90vh" : "80vh",
        overflowY: "auto",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Artwork ── */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-black/40">
        {card.imageUrl && !isHidden ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--bg-void), var(--bg-panel))" }}
          >
            {isHidden ? (
              <div className="text-center">
                <div className="text-6xl opacity-30 animate-arcane-pulse">❓</div>
                <div className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  Undiscovered Combo
                </div>
              </div>
            ) : (
              <span className="text-7xl opacity-20">{typeIcon}</span>
            )}
          </div>
        )}

        {/* Bottom gradient */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
          style={{ background: "linear-gradient(transparent, var(--bg-panel-alt))" }}
        />

        {/* Type badge (top-left) */}
        <div
          className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider backdrop-blur-md"
          style={{
            background: "rgba(0,0,0,0.65)",
            color: rarity.text,
            border: `1px solid ${rarity.border}`,
          }}
        >
          <span>{typeIcon}</span>
          <span>{card.type}</span>
          {card.characterType && CHARACTER_TYPE_LABELS[card.characterType] && (
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              {CHARACTER_TYPE_LABELS[card.characterType].icon}
            </span>
          )}
          {(card.type === "character" || card.type === "arsenal") && (
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black leading-none"
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
            </span>
          )}
        </div>

        {/* Close button (top-right) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm backdrop-blur-md transition-colors hover:bg-white/20"
          style={{
            background: "rgba(0,0,0,0.65)",
            color: "var(--text-muted)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          ✕
        </button>
      </div>

      {/* ── Card info ── */}
      <div className={mode === "inspect" ? "p-4 sm:p-5 space-y-3" : "p-3 space-y-2"}>
        {/* Name + Rarity */}
        <div className="flex items-start justify-between gap-2">
          <h2
            className={[
              "font-display font-bold tracking-wide",
              mode === "inspect" ? "text-lg sm:text-xl" : "text-sm sm:text-base",
              isHidden ? "" : "",
            ].join(" ")}
            style={{ color: isHidden ? "var(--text-muted)" : "var(--text-primary)" }}
          >
            {isHidden ? "??? Unknown ???" : card.name}
          </h2>
          <span
            className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ background: rarity.glow, color: rarity.text, border: `1px solid ${rarity.border}` }}
          >
            {isHidden ? "???" : rarity.label}
          </span>
        </div>

        {/* Description */}
        {!isHidden && card.description && (
          <p
            className={mode === "inspect" ? "text-sm leading-relaxed" : "text-xs leading-relaxed"}
            style={{ color: "var(--text-muted)" }}
          >
            {card.description}
          </p>
        )}

        {/* Character Type */}
        {!isHidden && card.characterType && CHARACTER_TYPE_LABELS[card.characterType] && (
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
            style={{
              background: "rgba(200,150,42,0.08)",
              border: "1px solid rgba(200,150,42,0.2)",
              color: "var(--text-muted)",
            }}
          >
            <span>{CHARACTER_TYPE_LABELS[card.characterType].icon}</span>
            <span>{CHARACTER_TYPE_LABELS[card.characterType].label}</span>
          </div>
        )}

        {/* Stats */}
        {!isHidden && (card.type === "character" || card.type === "arsenal") && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className={mode === "inspect" ? "text-xl" : "text-base"}>⚔</span>
              <div>
                <div
                  className={mode === "inspect" ? "text-xl font-bold" : "text-base font-bold"}
                  style={{ color: "#ef4444" }}
                >
                  {card.attack}
                </div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Attack
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={mode === "inspect" ? "text-xl" : "text-base"}>🛡</span>
              <div>
                <div
                  className={mode === "inspect" ? "text-xl font-bold" : "text-base font-bold"}
                  style={{ color: "#3b82f6" }}
                >
                  {card.defense}
                </div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Defense
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Effects */}
        {!isHidden && card.effects.length > 0 && (
          <div className="space-y-2">
            <div
              className="text-[10px] font-bold tracking-[0.15em] uppercase"
              style={{ color: "var(--gold)" }}
            >
              ✦ Effects
            </div>
            {card.effects.map((effect, i) => (
              <div
                key={effect.id ?? i}
                className="px-3 py-2 rounded-lg"
                style={{
                  background: "rgba(200,150,42,0.06)",
                  border: "1px solid rgba(200,150,42,0.15)",
                }}
              >
                <span
                  className="inline-block text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mb-1"
                  style={{ background: "rgba(200,150,42,0.15)", color: "var(--gold)" }}
                >
                  {effect.trigger}
                </span>
                <div
                  className={mode === "inspect" ? "text-sm" : "text-xs"}
                  style={{ color: "var(--text-primary)" }}
                >
                  {effect.description}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Combo source (for cards already produced by combo) */}
        {!isHidden && card.comboSource && !comboInfo && (
          <div
            className="px-3 py-2 rounded-lg"
            style={{
              background: "rgba(168,85,247,0.08)",
              border: "1px solid rgba(168,85,247,0.25)",
            }}
          >
            <div className="text-[10px] font-bold tracking-wider uppercase" style={{ color: "#c084fc" }}>
              ✦ Created from Combo
            </div>
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>
              {card.comboSource.characterName} + {card.comboSource.arsenalName}
            </div>
          </div>
        )}

        {/* Combo recipe info (preview section) */}
        {comboInfo && (
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: "1px solid rgba(168,85,247,0.3)" }}
          >
            <div className="px-3 py-2" style={{ background: "rgba(168,85,247,0.1)" }}>
              <div className="text-[10px] font-bold tracking-wider uppercase" style={{ color: "#c084fc" }}>
                ✦ Combo Recipe
              </div>
              <div className="text-sm mt-0.5" style={{ color: "var(--text-primary)" }}>
                {comboInfo.characterName} + {comboInfo.arsenalName}
              </div>
            </div>
            {isHidden && (
              <div className="px-3 py-3 text-center" style={{ background: "rgba(168,85,247,0.04)" }}>
                <div className="text-[10px] italic" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Try this combo in battle to discover the result!
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action button (inspect mode only) */}
        {action && mode === "inspect" && (
          <button
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className="w-full py-2.5 rounded-lg text-sm font-bold tracking-wider uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, var(--crimson), var(--crimson-bright))",
              color: "var(--text-primary)",
              boxShadow: "var(--glow-crimson)",
            }}
          >
            {action.label}
          </button>
        )}

        {/* Close hint (inspect mode) */}
        {mode === "inspect" && (
          <div className="text-center text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            Click outside or press ESC to close
          </div>
        )}
      </div>
    </div>
  );

  // ── Preview mode — floating side panel ──────────────────────────────────

  if (mode === "preview") {
    return (
      <div
        className="fixed right-3 top-1/2 -translate-y-1/2 z-[90] animate-panel-slide-in"
        onMouseEnter={onPanelMouseEnter}
        onMouseLeave={onPanelMouseLeave}
      >
        {cardContent}
      </div>
    );
  }

  // ── Inspect mode — centered overlay ─────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-panel-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      {/* Card */}
      <div className="relative animate-panel-scale-in">
        {cardContent}
      </div>
    </div>
  );
}
