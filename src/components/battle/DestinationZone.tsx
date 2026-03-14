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

function getStatBoosts(card: BattleCard) {
  const atkBoost = card.effects
    .filter(e => e.handler === "boost_attack")
    .reduce((sum, e) => sum + ((e.params?.amount as number) ?? 0), 0);
  const defBoost = card.effects
    .filter(e => e.handler === "boost_defense")
    .reduce((sum, e) => sum + ((e.params?.amount as number) ?? 0), 0);
  return { atkBoost, defBoost };
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
  const displayCard = stagedCard ?? destination;

  return (
    <div
      ref={dropRef}
      data-area="field-destination"
      onClick={destination && onInspect ? onInspect : undefined}
      className={[
        "flex flex-col gap-1.5 px-3 py-2 rounded-lg transition-all duration-200",
        dropHover ? "ring-2 ring-emerald-400 scale-105" : "",
        destination && onInspect ? "cursor-pointer hover:brightness-110" : "",
      ].join(" ")}
      style={{
        minWidth: 280,
        background: dropHover
          ? "rgba(34,197,94,0.15)"
          : stagedCard
            ? "rgba(234,179,8,0.06)"
            : destination
              ? "rgba(34,197,94,0.06)"
              : "rgba(255,255,255,0.02)",
        border: `1px solid ${
          dropHover
            ? "rgba(34,197,94,0.6)"
            : stagedCard
              ? "rgba(234,179,8,0.35)"
              : destination
                ? "rgba(34,197,94,0.25)"
                : "rgba(255,255,255,0.05)"
        }`,
      }}
    >
      <div
        className="text-[9px] font-bold tracking-[0.2em] uppercase"
        style={{ color: "var(--text-muted)" }}
      >
        🏟️ Battlefield
      </div>

      {displayCard ? (
        <div className="flex items-start gap-3">
          {/* Raw card artwork */}
          <div className="relative flex-shrink-0 rounded overflow-hidden" style={{ width: 56, height: 78 }}>
            <img
              src={displayCard.imageUrl}
              alt={displayCard.name}
              draggable={false}
              className="w-full h-full object-cover select-none"
              style={{ opacity: stagedCard ? 0.75 : 1 }}
            />
            {stagedCard && (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: "rgba(234,179,8,0.18)" }}
              >
                <span className="text-base">⏳</span>
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            {/* Name */}
            <div
              className="text-xs font-display font-bold tracking-wide leading-tight"
              style={{ color: stagedCard ? "rgba(234,179,8,0.9)" : "#4ade80" }}
            >
              {displayCard.name}
            </div>

            {stagedCard && (
              <div className="text-[9px] tracking-wider" style={{ color: "rgba(234,179,8,0.55)" }}>
                Staged — resolves on confirm
              </div>
            )}

            {/* Description as HTML */}
            <div
              className="text-[9px] leading-relaxed mt-0.5"
              style={{ color: "var(--text-muted)" }}
              dangerouslySetInnerHTML={{ __html: displayCard.description }}
            />

            {/* Stat boosts from effects, shown in green */}
            {(() => {
              const { atkBoost, defBoost } = getStatBoosts(displayCard);
              if (atkBoost === 0 && defBoost === 0) return null;
              return (
                <div className="flex items-center gap-2 mt-1">
                  {atkBoost !== 0 && (
                    <span className="text-[10px] font-bold" style={{ color: "#4ade80" }}>
                      ⚔ {atkBoost > 0 ? `+${atkBoost}` : atkBoost}
                    </span>
                  )}
                  {defBoost !== 0 && (
                    <span className="text-[10px] font-bold" style={{ color: "#4ade80" }}>
                      🛡 {defBoost > 0 ? `+${defBoost}` : defBoost}
                    </span>
                  )}
                </div>
              );
            })()}

            {/* Meta line */}
            <div className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
              {stagedCard && destination
                ? `Replaces: ${destination.name}`
                : !stagedCard
                  ? `Played by ${isOwnedByPlayer ? "You" : "Opponent"}`
                  : null}
            </div>
          </div>
        </div>
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
