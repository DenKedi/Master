"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { BattleCard } from "@/lib/battle/types";
import { RENDER_V } from "@/lib/renderVersion";

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

const TYPE_ICONS: Record<string, React.ReactNode> = {
  character: <Image src="/icons/types/character.png" alt="Character" width={16} height={16} className="inline-block" />,
  arsenal: <Image src="/icons/types/arsenal.png" alt="Arsenal" width={16} height={16} className="inline-block" />,
  destination: <Image src="/icons/types/destination.png" alt="Destination" width={16} height={16} className="inline-block" />,
  trick: <Image src="/icons/types/trick.png" alt="Trick" width={16} height={16} className="inline-block" />,
};

const CHARACTER_TYPE_LABELS: Record<string, { icon: React.ReactNode; label: string }> = {
  human: { icon: <Image src="/icons/character-types/human.png" alt="Human" width={16} height={16} className="inline-block" />, label: "Human" },
  goblin: { icon: <Image src="/icons/character-types/goblin.png" alt="Goblin" width={16} height={16} className="inline-block" />, label: "Goblin" },
  beast: { icon: <Image src="/icons/character-types/beast.png" alt="Beast" width={16} height={16} className="inline-block" />, label: "Beast" },
  underworld: { icon: <Image src="/icons/character-types/underworld.png" alt="Underworld" width={16} height={16} className="inline-block" />, label: "Underworld" },
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
      {/* ── Rendered card image ── */}
      <div className="relative w-full overflow-hidden bg-black/40">
        {isHidden ? (
          <div
            className="w-full aspect-[512/880] flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--bg-void), var(--bg-panel))" }}
          >
            <div className="text-center">
              <div className="text-6xl opacity-30 animate-arcane-pulse">❓</div>
              <div className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                Undiscovered Combo
              </div>
            </div>
          </div>
        ) : (
          <img
            src={`/api/cards/render/${encodeURIComponent(card.cardId || card.name)}?v=${RENDER_V}`}
            alt={card.name}
            className="w-full"
            draggable={false}
          />
        )}

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

      {/* ── Extra info below card image ── */}
      <div className={mode === "inspect" ? "p-4 sm:p-5 space-y-3" : "p-3 space-y-2"}>
        {/* Hidden card name placeholder */}
        {isHidden && (
          <div className="flex items-start justify-between gap-2">
            <h2
              className={mode === "inspect" ? "font-display font-bold tracking-wide text-lg sm:text-xl" : "font-display font-bold tracking-wide text-sm sm:text-base"}
              style={{ color: "var(--text-muted)" }}
            >
              ??? Unknown ???
            </h2>
            <span
              className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: rarity.glow, color: rarity.text, border: `1px solid ${rarity.border}` }}
            >
              ???
            </span>
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
              background: "linear-gradient(135deg, rgba(30,10,5,0.9), rgba(80,50,10,0.9))",
              color: "var(--gold-bright)",
              boxShadow: "var(--glow-gold)",
              border: "1px solid var(--gold-dim)",
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
        className="fixed left-1/2 -translate-x-1/2 bottom-40 z-[90] animate-panel-slide-in"
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
