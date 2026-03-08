"use client";

import type { BattleCard } from "@/lib/battle/types";

const CHARACTER_TYPE_ICONS: Record<string, string> = {
  human: "🧑",
  goblin: "👺",
  beast: "🐺",
  demon: "😈",
};

interface ActiveSlotProps {
  /** The active fighter card (character or combo result) */
  active: BattleCard | null;
  isPlayer: boolean;
  highlighted?: boolean;
  /** Data attribute for tutorial highlighting */
  areaId: string;
  /** If a combo is being previewed, show the source info */
  comboPreview?: { characterName: string; arsenalName: string };
  /** Arsenal currently equipped for this turn (already resolved) */
  activeArsenal?: BattleCard | null;
  /** Arsenal staged to be equipped once selection confirms (no recipe) */
  pendingArsenal?: BattleCard | null;
  /** Whether a compatible card is being dragged over this zone */
  dropHover?: boolean;
  /** Ref callback for drop zone registration */
  dropRef?: (el: HTMLDivElement | null) => void;
  /** Click active card to inspect */
  onInspect?: () => void;
}

export default function ActiveSlot({
  active,
  isPlayer,
  highlighted,
  areaId,
  comboPreview,
  activeArsenal,
  pendingArsenal,
  dropHover,
  dropRef,
  onInspect,
}: ActiveSlotProps) {
  return (
    <div
      ref={dropRef}
      data-area={areaId}
      onClick={active && onInspect ? onInspect : undefined}
      className={[
        "relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg transition-all duration-300 min-w-[140px] sm:min-w-[180px]",
        highlighted ? "ring-2 ring-yellow-400" : "",
        dropHover ? "ring-2 ring-emerald-400 scale-105" : "",
        active && onInspect ? "cursor-pointer hover:brightness-110" : "",
      ].join(" ")}
      style={{
        background: dropHover
          ? "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(15,0,32,0.9))"
          : active
            ? "linear-gradient(135deg, rgba(200,150,42,0.08), rgba(15,0,32,0.9))"
            : "linear-gradient(135deg, rgba(255,255,255,0.02), rgba(15,0,32,0.6))",
        border: `1px solid ${
          dropHover
            ? "rgba(34,197,94,0.6)"
            : active
              ? isPlayer ? "rgba(200,150,42,0.3)" : "rgba(155,26,42,0.3)"
              : "rgba(255,255,255,0.06)"
        }`,
      }}
    >
      {/* Label */}
      <div
        className="text-[9px] font-bold tracking-[0.2em] uppercase"
        style={{ color: "var(--text-muted)" }}
      >
        {isPlayer ? "Your Fighter" : "Enemy Fighter"}
      </div>

      {active ? (
        <>
          {/* Card name & description */}
          <div className="text-center">
            <div
              className="text-sm sm:text-base font-display font-bold tracking-wide flex items-center justify-center gap-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              {active.name}
              {active.characterType && CHARACTER_TYPE_ICONS[active.characterType] && (
                <span
                  className="inline-flex items-center justify-center text-[10px] flex-shrink-0"
                  title={active.characterType}
                >
                  {CHARACTER_TYPE_ICONS[active.characterType]}
                </span>
              )}
              {(active.type === "character" || active.type === "arsenal") && (
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-black leading-none flex-shrink-0"
                  style={{
                    background: active.comboSource
                      ? "linear-gradient(135deg, #a855f7, #7c3aed)"
                      : "linear-gradient(135deg, #c8962a, #a17720)",
                    color: "#fff",
                    boxShadow: active.comboSource
                      ? "0 0 6px rgba(168,85,247,0.6)"
                      : "0 0 6px rgba(200,150,42,0.6)",
                  }}
                >
                  {active.comboSource ? "S" : "C"}
                </span>
              )}
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              {active.description}
            </div>
          </div>

          {/* Combo source badge */}
          {(active.comboSource || comboPreview) && (
            <div
              className="px-2 py-1 rounded text-center"
              style={{
                background: "rgba(168,85,247,0.1)",
                border: "1px solid rgba(168,85,247,0.3)",
              }}
            >
              <div className="text-[9px] font-bold tracking-wider uppercase" style={{ color: "#c084fc" }}>
                ✦ Combo
              </div>
              <div className="text-[8px]" style={{ color: "var(--text-muted)" }}>
                {(comboPreview ?? active.comboSource)?.characterName} + {(comboPreview ?? active.comboSource)?.arsenalName}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-3 mt-1">
            <div className="text-xs font-bold" style={{ color: "#ef4444" }}>
              ⚔ {active.attack}
            </div>
            <div className="text-xs font-bold" style={{ color: "#3b82f6" }}>
              🛡 {active.defense}
            </div>
          </div>

          {/* Equipped arsenal badge (resolved) */}
          {activeArsenal && (
            <div
              className="px-2 py-1 rounded text-center"
              style={{
                background: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.3)",
              }}
            >
              <div className="text-[9px] font-bold tracking-wider uppercase" style={{ color: "#60a5fa" }}>
                ⚔ Arsenal
              </div>
              <div className="text-[8px]" style={{ color: "var(--text-muted)" }}>
                {activeArsenal.name} (+{activeArsenal.attack} ATK / +{activeArsenal.defense} DEF)
              </div>
              <div className="text-[8px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                Drops end of turn
              </div>
            </div>
          )}

          {/* Pending equip badge (staged, awaiting confirm) */}
          {!activeArsenal && pendingArsenal && (
            <div
              className="px-2 py-1 rounded text-center"
              style={{
                background: "rgba(234,179,8,0.1)",
                border: "1px solid rgba(234,179,8,0.3)",
              }}
            >
              <div className="text-[9px] font-bold tracking-wider uppercase" style={{ color: "#fbbf24" }}>
                ⏳ Equipping
              </div>
              <div className="text-[8px]" style={{ color: "var(--text-muted)" }}>
                {pendingArsenal.name}
              </div>
            </div>
          )}
        </>
      ) : (
        <div
          className="py-6 text-center text-[10px] tracking-wider uppercase"
          style={{ color: "rgba(255,255,255,0.15)" }}
        >
          Empty Slot
        </div>
      )}
    </div>
  );
}
