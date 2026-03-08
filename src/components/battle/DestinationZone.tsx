"use client";

import type { BattleCard } from "@/lib/battle/types";

interface DestinationZoneProps {
  destination: BattleCard | null;
  /** Destination staged for this turn but not yet resolved */
  stagedCard?: BattleCard | null;
  owner: string | null;
  playerId: string;
  /** Whether a destination card is being dragged over this zone */
  dropHover?: boolean;
  /** Ref callback for drop zone registration */
  dropRef?: (el: HTMLDivElement | null) => void;
  /** Click destination to inspect */
  onInspect?: () => void;
}

export default function DestinationZone({
  destination,
  stagedCard,
  owner,
  playerId,
  dropHover,
  dropRef,
  onInspect,
}: DestinationZoneProps) {
  const isOwnedByPlayer = owner === playerId;

  return (
    <div
      ref={dropRef}
      data-area="field-destination"
      onClick={destination && onInspect ? onInspect : undefined}
      className={[
        "flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[120px] transition-all duration-200",
        dropHover ? "ring-2 ring-emerald-400 scale-105" : "",
        destination && onInspect ? "cursor-pointer hover:brightness-110" : "",
      ].join(" ")}
      style={{
        background: dropHover
          ? "rgba(34,197,94,0.15)"
          : destination
            ? "rgba(34,197,94,0.06)"
            : stagedCard
              ? "rgba(234,179,8,0.06)"
              : "rgba(255,255,255,0.02)",
        border: `1px solid ${
          dropHover
            ? "rgba(34,197,94,0.6)"
            : destination ? "rgba(34,197,94,0.25)" : stagedCard ? "rgba(234,179,8,0.35)" : "rgba(255,255,255,0.05)"
        }`,
      }}
    >
      <div
        className="text-[9px] font-bold tracking-[0.2em] uppercase"
        style={{ color: "var(--text-muted)" }}
      >
        🏟️ Battlefield
      </div>
      {stagedCard ? (
        <>
          <div
            className="text-xs font-display font-bold tracking-wide text-center"
            style={{ color: "rgba(234,179,8,0.9)" }}
          >
            {stagedCard.name}
          </div>
          <div className="text-[9px] tracking-wider" style={{ color: "rgba(234,179,8,0.55)" }}>
            ⏳ Staged — resolves on confirm
          </div>
          {destination && (
            <div className="text-[8px]" style={{ color: "rgba(255,255,255,0.25)" }}>
              Replaces: {destination.name}
            </div>
          )}
        </>
      ) : destination ? (
        <>
          <div
            className="text-xs font-display font-bold tracking-wide text-center"
            style={{ color: "#4ade80" }}
          >
            {destination.name}
          </div>
          {destination.effects.length > 0 && (
            <div className="text-[9px] text-center" style={{ color: "var(--text-muted)" }}>
              {destination.effects[0].description}
            </div>
          )}
          <div className="text-[8px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            Played by {isOwnedByPlayer ? "You" : "Opponent"}
          </div>
        </>
      ) : (
        <div
          className="py-2 text-[10px] tracking-wider"
          style={{ color: "rgba(34,197,94,0.25)" }}
        >
          No Destination
        </div>
      )}
    </div>
  );
}
