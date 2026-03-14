"use client";

import { useState } from "react";
import type { BattleCard } from "@/lib/battle/types";
import { RENDER_V } from "@/lib/renderVersion";

function cardImageUrl(card: BattleCard): string {
  const base = `/api/cards/render/${encodeURIComponent(card.cardId || card.name)}`;
  if (card.comboSource) {
    const p = new URLSearchParams();
    p.set("atk", String(card.attack));
    p.set("def", String(card.defense));
    p.set("v", String(RENDER_V));
    return `${base}?${p}`;
  }
  return `${base}?v=${RENDER_V}`;
}

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
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div
      ref={dropRef}
      data-area={areaId}
      onClick={active && onInspect ? onInspect : undefined}
      className={[
        "relative rounded-lg transition-all duration-300",
        highlighted ? "ring-2 ring-yellow-400" : "",
        dropHover ? "ring-2 ring-emerald-400 scale-105" : "",
        active && onInspect ? "cursor-pointer hover:brightness-110" : "",
      ].join(" ")}
      style={{
        width: "clamp(100px, 15vw, 160px)",
        aspectRatio: "5 / 7",
        background: dropHover
          ? "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(15,0,32,0.9))"
          : active
            ? "transparent"
            : "linear-gradient(135deg, rgba(255,255,255,0.02), rgba(15,0,32,0.6))",
        border: active && imgLoaded
          ? "none"
          : `1px solid ${
              dropHover
                ? "rgba(34,197,94,0.6)"
                : active
                  ? isPlayer ? "rgba(200,150,42,0.3)" : "rgba(155,26,42,0.3)"
                  : "rgba(255,255,255,0.06)"
            }`,
      }}
    >
      {active ? (
        <>
          {/* Card render image */}
          {!imgLoaded && (
            <div className="absolute inset-0 rounded-lg animate-pulse" style={{ background: "rgba(15,0,32,0.9)" }} />
          )}
          <img
            src={cardImageUrl(active)}
            alt={active.name}
            draggable={false}
            onLoad={() => setImgLoaded(true)}
            className="absolute inset-0 w-full h-full object-cover rounded-lg select-none"
            style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 200ms" }}
          />

          {/* Stat overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 rounded-b-lg px-1.5 py-1 flex items-center justify-between"
            style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }}
          >
            <div className="text-[10px] font-bold" style={{ color: "#ef4444" }}>⚔{active.attack}</div>
            <div className="text-[10px] font-bold" style={{ color: "#3b82f6" }}>🛡{active.defense}</div>
          </div>

          {/* Combo badge */}
          {(active.comboSource || comboPreview) && (
            <div className="absolute top-0 left-0 right-0 rounded-t-lg px-1.5 py-1 text-center"
              style={{ background: "linear-gradient(rgba(0,0,0,0.8), transparent)" }}
            >
              <div className="text-[8px] font-bold tracking-wider uppercase" style={{ color: "#c084fc" }}>
                ✦ Combo
              </div>
            </div>
          )}

          {/* Arsenal badge */}
          {activeArsenal && (
            <div className="absolute top-1 right-1 px-1 py-0.5 rounded text-[7px] font-bold"
              style={{ background: "rgba(59,130,246,0.8)", color: "#fff" }}
            >
              ⚔ +{activeArsenal.attack}/+{activeArsenal.defense}
            </div>
          )}
          {!activeArsenal && pendingArsenal && (
            <div className="absolute top-1 right-1 px-1 py-0.5 rounded text-[7px] font-bold"
              style={{ background: "rgba(234,179,8,0.8)", color: "#fff" }}
            >
              ⏳ {pendingArsenal.name}
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="text-[9px] font-bold tracking-[0.15em] uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            {isPlayer ? "Your Fighter" : "Enemy Fighter"}
          </div>
          <div
            className="text-[10px] tracking-wider uppercase mt-1"
            style={{ color: "rgba(255,255,255,0.15)" }}
          >
            Empty Slot
          </div>
        </div>
      )}
    </div>
  );
}
