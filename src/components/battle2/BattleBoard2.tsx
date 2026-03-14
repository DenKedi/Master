"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import type { GameState, GameAction, BattleCard } from "@/lib/battle/types";
import { getAvailableCombos, findComboRecipe } from "@/lib/battle/engine";
import { useBattleDrag, type DropZoneId } from "@/hooks/useBattleDrag";
import { markComboDiscovered } from "@/lib/battle/discovery";
import { RENDER_V } from "@/lib/renderVersion";

import PhaseBar2 from "./PhaseBar2";
import HPBar2 from "./HPBar2";
import ActiveSlot2 from "./ActiveSlot2";
import HandTray2 from "./HandTray2";
import CardInHand2 from "./CardInHand2";
import CardInspect2 from "./CardInspect2";
import CardDrawAnimationOverlay from "./CardDrawAnimationOverlay";
import BattleMenu2 from "./BattleMenu2";
import { DestinationIcon } from "./icons";

/** Player/opponent info for the HUD display */
export interface BattlePlayerInfo {
  name: string;
  avatarUrl?: string;
  rankTitle?: string;
  rankColor?: string;
}

/** Combat data for the resolve animation */
export interface CombatEventData {
  playerCard: BattleCard;
  opponentCard: BattleCard;
  playerAttack: number;
  playerDefense: number;
  opponentAttack: number;
  opponentDefense: number;
  damageToPlayer: number;
  damageToOpponent: number;
  playerHpBefore: number;
  playerHpAfter: number;
  playerMaxHp: number;
  opponentHpBefore: number;
  opponentHpAfter: number;
  opponentMaxHp: number;
}

/** Combo transform slide data */
export interface TransformSlideData {
  character: BattleCard;
  arsenal: BattleCard;
  result: BattleCard;
  name: string;
  isPlayer: boolean;
}

interface BattleBoard2Props {
  state: GameState;
  onAction: (action: GameAction) => void;
  /** Tutorial highlights */
  highlightCards?: string[];
  highlightAreas?: string[];
  /** Disable all player inputs */
  disabled?: boolean;
  /** Recent HP changes for animation */
  playerHpDelta?: number;
  opponentHpDelta?: number;
  /** Name shown on the player's deck pile */
  deckName?: string;
  /** Player info */
  playerInfo?: BattlePlayerInfo;
  /** Opponent info */
  opponentInfo?: BattlePlayerInfo;
  /** Combat event for resolve animation */
  combatEvent?: CombatEventData | null;
  /** Called when combat animation finishes */
  onCombatAnimationDone?: () => void;
  /** Card drawn via an effect — show draw animation, then call this when dismissed */
  currentEffectDraw?: BattleCard | null;
  onEffectDrawDismissed?: () => void;
}

export default function BattleBoard2({
  state,
  onAction,
  highlightCards = [],
  highlightAreas = [],
  disabled,
  playerHpDelta,
  opponentHpDelta,
  deckName,
  playerInfo,
  opponentInfo,
  combatEvent,
  onCombatAnimationDone,
  currentEffectDraw,
  onEffectDrawDismissed,
}: BattleBoard2Props) {
  const isSelectPhase = state.phase === "select";
  const playerConfirmed = state.player.selection.confirmed;
  const opponentConfirmed = state.opponent.selection.confirmed;
  const player = state.player;
  const opponent = state.opponent;

  // ─── Discovery: mark combos as discovered when they resolve ─────────────
  useEffect(() => {
    if (state.player.active?.comboSource) {
      markComboDiscovered(
        state.player.active.comboSource.characterName,
        state.player.active.comboSource.arsenalName,
      );
    }
  }, [state.player.active?.comboSource]);

  useEffect(() => {
    if (state.opponent.active?.comboSource) {
      markComboDiscovered(
        state.opponent.active.comboSource.characterName,
        state.opponent.active.comboSource.arsenalName,
      );
    }
  }, [state.opponent.active?.comboSource]);

  // ── Inspect panel state (only for viewing info, not for play actions) ──
  const [inspectedCard, setInspectedCard] = useState<BattleCard | null>(null);
  const [inspectComboInfo, setInspectComboInfo] = useState<{ characterName: string; arsenalName: string } | null>(null);
  const hoverOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Draw Animation State ──
  const [animatingDrawCard, setAnimatingDrawCard] = useState<BattleCard | null>(null);

  // ── Compute staged UIDs ──
  const stagedUids = useMemo(() => {
    const uids = new Set<string>();
    if (player.selection.characterUid) uids.add(player.selection.characterUid);
    if (player.selection.comboArsenalUid) uids.add(player.selection.comboArsenalUid);
    for (const uid of player.selection.trickUids) uids.add(uid);
    if (player.selection.destinationUid) uids.add(player.selection.destinationUid);
    return uids;
  }, [player.selection]);

  // ── Combos ──
  const availableCombos = useMemo(
    () => getAvailableCombos(state, "player"),
    [state],
  );

  // ── Can confirm ──
  const drawnOrDeckEmpty = player.hasDrawnThisTurn || player.deck.length === 0;
  const canAct = isSelectPhase && !disabled && !playerConfirmed;
  const canActAfterDraw = canAct && drawnOrDeckEmpty;
  const arsenalConfirmed = player.selection.arsenalConfirmed;
  const hasUnconfirmedArsenal = !!player.selection.comboArsenalUid && !arsenalConfirmed;
  const canConfirmArsenal = isSelectPhase && !playerConfirmed && hasUnconfirmedArsenal && canAct && drawnOrDeckEmpty;
  const canConfirm = isSelectPhase && !playerConfirmed && drawnOrDeckEmpty &&
    (player.active !== null || player.selection.characterUid !== null) &&
    !hasUnconfirmedArsenal;

  // ── Drag and drop ──
  const handleDrop = useCallback(
    (card: BattleCard, zone: DropZoneId) => {
      if (!canActAfterDraw) return;

      if (zone === "player-active") {
        if (card.type === "character") {
          onAction({ type: "SELECT_CHARACTER", cardUid: card.uid });
        } else if (card.type === "arsenal") {
          onAction({ type: "SELECT_COMBO", arsenalUid: card.uid });
        }
      } else if (zone === "field-destination") {
        if (card.type === "destination") {
          onAction({ type: "PLAY_DESTINATION", cardUid: card.uid });
        }
      }
    },
    [canActAfterDraw, onAction],
  );

  const drag = useBattleDrag({ onDrop: handleDrop });

  // ── Card click handler — immediately plays the card ──
  const handleCardClick = useCallback(
    (card: BattleCard) => {
      if (canActAfterDraw) {
        if (card.type === "character" && !stagedUids.has(card.uid)) {
          onAction({ type: "SELECT_CHARACTER", cardUid: card.uid });
          return;
        } else if (card.type === "arsenal" && !stagedUids.has(card.uid)) {
          onAction({ type: "SELECT_COMBO", arsenalUid: card.uid });
          return;
        } else if (card.type === "trick" && !stagedUids.has(card.uid)) {
          onAction({ type: "PLAY_TRICK", cardUid: card.uid });
          return;
        } else if (card.type === "destination" && !stagedUids.has(card.uid)) {
          onAction({ type: "PLAY_DESTINATION", cardUid: card.uid });
          return;
        }
      }

      // If can't act or card is already staged, open inspect for info only
      let comboInfo: { characterName: string; arsenalName: string } | null = null;
      if (card.comboSource) {
        comboInfo = {
          characterName: card.comboSource.characterName,
          arsenalName: card.comboSource.arsenalName,
        };
      }
      setInspectedCard(card);
      setInspectComboInfo(comboInfo);
    },
    [canActAfterDraw, stagedUids, onAction],
  );

  // ── Click on placed fighter → withdraw (undo selection) ──
  const handleFighterClick = useCallback(() => {
    if (canActAfterDraw) {
      onAction({ type: "UNDO_SELECTION" });
    }
  }, [canActAfterDraw, onAction]);

  // ── Click on placed arsenal → deselect combo ──
  const handleArsenalClick = useCallback(() => {
    if (canActAfterDraw && !player.selection.arsenalConfirmed) {
      onAction({ type: "DESELECT_COMBO" });
    }
  }, [canActAfterDraw, player.selection.arsenalConfirmed, onAction]);

  // ── Click on placed destination → remove it ──
  const handleDestinationClick = useCallback(() => {
    if (canActAfterDraw && player.selection.destinationUid) {
      onAction({ type: "REMOVE_DESTINATION", cardUid: player.selection.destinationUid });
    }
  }, [canActAfterDraw, player.selection.destinationUid, onAction]);

  // ── Draw card from deck ──
  const handleDeckClick = useCallback(() => {
    if (canAct && !player.hasDrawnThisTurn && player.deck.length > 0) {
      const topCard = player.deck[player.deck.length - 1];
      setAnimatingDrawCard(topCard);
      onAction({ type: "DRAW_CARD" });
    }
  }, [canAct, player.hasDrawnThisTurn, player.deck, onAction]);

  // ── Hover card → open inspect panel ──
  const handleCardHover = useCallback((card: BattleCard) => {
    if (hoverOutTimerRef.current) {
      clearTimeout(hoverOutTimerRef.current);
      hoverOutTimerRef.current = null;
    }
    let comboInfo: { characterName: string; arsenalName: string } | null = null;
    if (card.comboSource) {
      comboInfo = {
        characterName: card.comboSource.characterName,
        arsenalName: card.comboSource.arsenalName,
      };
    }
    setInspectedCard(card);
    setInspectComboInfo(comboInfo);
  }, []);

  const handleCardHoverOut = useCallback(() => {
    hoverOutTimerRef.current = setTimeout(() => {
      setInspectedCard(null);
      setInspectComboInfo(null);
    }, 120);
  }, []);

  const handlePanelMouseEnter = useCallback(() => {
    if (hoverOutTimerRef.current) {
      clearTimeout(hoverOutTimerRef.current);
      hoverOutTimerRef.current = null;
    }
  }, []);

  const handlePanelMouseLeave = useCallback(() => {
    hoverOutTimerRef.current = setTimeout(() => {
      setInspectedCard(null);
      setInspectComboInfo(null);
    }, 120);
  }, []);

  // ── Confirm ──
  const handleConfirm = useCallback(() => {
    if (canConfirm) {
      onAction({ type: "CONFIRM_SELECTION" });
    }
  }, [canConfirm, onAction]);

  // ── Confirm Arsenal ──
  const handleConfirmArsenal = useCallback(() => {
    if (canConfirmArsenal) {
      onAction({ type: "CONFIRM_ARSENAL" });
    }
  }, [canConfirmArsenal, onAction]);

  // ── Background image ──
  const destinationCard = state.field.destination;
  const stagedDestinationCard = player.selection.destinationUid
    ? player.hand.find((c) => c.uid === player.selection.destinationUid) ?? null
    : null;
  const displayDestinationCard = destinationCard ?? stagedDestinationCard;

  // ── Staged character/arsenal to show on board ──
  const stagedCharacter = player.selection.characterUid
    ? player.hand.find((c) => c.uid === player.selection.characterUid) ?? null
    : null;
  const stagedArsenal = player.selection.comboArsenalUid
    ? player.hand.find((c) => c.uid === player.selection.comboArsenalUid) ?? null
    : null;
  const displayPlayerCard = player.active ?? stagedCharacter;
  const displayPlayerArsenal = player.activeArsenal ?? stagedArsenal;

  const bgStyle: React.CSSProperties = displayDestinationCard
    ? {
        backgroundImage: `url(/api/cards/render/${encodeURIComponent(displayDestinationCard.cardId || displayDestinationCard.name)}?v=${RENDER_V})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        backgroundImage: `url(/wallpaper-battle-heros.webp)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };

  return (
    <div className="battle2-root h-full flex flex-col relative" style={{
      background: "transparent",
    }}>

      {/* ═══ Full-board background (destination card covers hand area too) ═══ */}
      <div
        className="absolute inset-0 transition-all duration-700 pointer-events-none z-0"
        style={{
          ...bgStyle,
          opacity: displayDestinationCard ? 0.55 : 0.3,
        }}
      />

      {/* ═══ Row 1: Phase Bar ═══ */}
      <PhaseBar2
        turn={state.turn}
        phase={state.phase}
        playerConfirmed={playerConfirmed}
        opponentConfirmed={opponentConfirmed}
        hasDrawn={player.hasDrawnThisTurn}
      />

      {/* ═══ Row 2: Arena ═══ */}
      <div className="flex-1 relative overflow-hidden">

        {/* Arena content */}
        <div className="relative h-full flex flex-col z-10">

          {/* Opponent hand — top of arena */}
          <div className="flex items-center justify-center gap-1.5 pt-3 pb-1">
            {opponent.hand.map((_, i) => (
              <CardInHand2 key={i} card={opponent.hand[i]} faceDown />
            ))}
            {opponent.hand.length === 0 && (
              <span className="text-xs" style={{ color: "var(--b2-text-muted)" }}>No cards</span>
            )}
          </div>

          {/* HP bars + fighters row */}
          <div className="flex-1 flex flex-col justify-center relative px-4">

            {/* Opponent HP — top right */}
            <div className="absolute top-2 right-4">
              <HPBar2
                current={opponent.hp}
                max={opponent.maxHp}
                delta={opponentHpDelta}
                label={opponentInfo?.name ?? "Opponent"}
                side="right"
              />
            </div>

            {/* Fighter arena + destination — destination left, fighters centered */}
            <div className="relative flex items-center justify-center">

            {/* Destination zone — absolutely pinned to the LEFT */}
            <div className="absolute left-0 flex flex-col items-center gap-1">
              <div
                className={`relative rounded-lg overflow-hidden transition-all duration-200 ${displayDestinationCard ? "cursor-pointer" : ""}`}
                ref={(el) =>
                  drag.dropZoneRef("field-destination", ["destination"])(el)
                }
                data-area="field-destination"
                onMouseEnter={displayDestinationCard ? () => handleCardHover(displayDestinationCard) : undefined}
                onMouseLeave={displayDestinationCard ? handleCardHoverOut : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  if (displayDestinationCard && !destinationCard) {
                    handleDestinationClick();
                  } else if (displayDestinationCard) {
                    setInspectedCard(displayDestinationCard);
                    setInspectComboInfo(null);
                  }
                }}
                style={{
                  width: 210,
                  height: 135,
                  border: drag.state.overZone === "field-destination"
                    ? "2px solid var(--b2-type-destination)"
                    : displayDestinationCard
                    ? "2px solid var(--b2-type-destination)"
                    : "2px dashed rgba(255,255,255,0.08)",
                  boxShadow: displayDestinationCard
                    ? "0 0 16px rgba(72,168,104,0.25)"
                    : "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              >
                {displayDestinationCard ? (
                  <img
                    src={`/api/cards/render/${encodeURIComponent(displayDestinationCard.cardId || displayDestinationCard.name)}?v=${RENDER_V}`}
                    alt={displayDestinationCard.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center backdrop-blur-sm" style={{ background: "rgba(5,0,13,0.7)" }}>
                    <DestinationIcon size={14} style={{ color: "var(--b2-text-muted)", opacity: 0.3 }} />
                    <span className="font-display text-[9px] tracking-wider uppercase ml-1" style={{ color: "var(--b2-text-muted)", opacity: 0.3 }}>
                      Destination
                    </span>
                  </div>
                )}
              </div>
              {displayDestinationCard && (
                <span className="font-display text-[10px] font-bold tracking-wider uppercase" style={{ color: "var(--b2-type-destination)" }}>
                  {displayDestinationCard.name}
                </span>
              )}
            </div>

            {/* Fighters — centered */}
            <div className="flex items-center gap-4 sm:gap-8">
              {/* Player active — LEFT */}
              <ActiveSlot2
                card={displayPlayerCard}
                arsenal={displayPlayerArsenal}
                arsenalBonus={
                  displayPlayerArsenal
                    ? { attack: displayPlayerArsenal.attack, defense: displayPlayerArsenal.defense }
                    : null
                }
                isCombo={!!player.preComboCharacter}
                side="player"
                dropRef={(el) =>
                  drag.dropZoneRef("player-active", ["character", "arsenal"])(el)
                }
                isDropTarget={drag.state.overZone === "player-active"}
                highlighted={highlightAreas.includes("player-active")}
                onClick={displayPlayerCard ? handleFighterClick : undefined}
                onArsenalClick={handleArsenalClick}
                onHover={handleCardHover}
                onHoverOut={handleCardHoverOut}
              />

              {/* VS divider */}
              <div className="flex flex-col items-center">
                <span className="text-lg font-display font-bold tracking-wider uppercase" style={{ color: "var(--b2-text-muted)", opacity: 0.3 }}>
                  VS
                </span>
              </div>

              {/* Opponent active — RIGHT */}
              <ActiveSlot2
                card={opponent.active}
                arsenal={opponent.activeArsenal}
                arsenalBonus={
                  opponent.activeArsenal
                    ? { attack: opponent.activeArsenal.attack, defense: opponent.activeArsenal.defense }
                    : null
                }
                isCombo={!!opponent.preComboCharacter}
                side="opponent"
                onClick={opponent.active ? () => {
                  setInspectedCard(opponent.active!);
                  setInspectComboInfo(opponent.active!.comboSource ? {
                    characterName: opponent.active!.comboSource.characterName,
                    arsenalName: opponent.active!.comboSource.arsenalName,
                  } : null);
                } : undefined}
                onHover={handleCardHover}
                onHoverOut={handleCardHoverOut}
              />
            </div>
            {/* End fighters */}
            </div>
            {/* End fighter arena + destination row */}

            {/* Player HP — bottom left */}
            <div className="absolute bottom-2 left-4">
              <HPBar2
                current={player.hp}
                max={player.maxHp}
                delta={playerHpDelta}
                label={playerInfo?.name ?? "You"}
                side="left"
              />
            </div>
          </div>
        </div>

        {/* Menu — top right of arena */}
        <BattleMenu2 />

        {/* Drag ghost */}
        {drag.state.dragging && (
          <div
            className="fixed pointer-events-none z-50"
            style={{
              left: drag.state.position.x - 45,
              top: drag.state.position.y - 63,
            }}
          >
            <div
              className="rounded-md overflow-hidden shadow-2xl opacity-85"
              style={{ width: 90, height: 126 }}
            >
              <img
                src={`/api/cards/render/${encodeURIComponent(drag.state.dragging.cardId || drag.state.dragging.name)}?atk=${drag.state.dragging.attack}&def=${drag.state.dragging.defense}&v=${RENDER_V}`}
                alt={drag.state.dragging.name}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          </div>
        )}
      </div>

      {/* ═══ Row 3: Hand Tray ═══ */}
      <HandTray2
        hand={player.hand}
        deckCount={player.deck.length}
        deckName={deckName}
        stagedUids={stagedUids}
        highlightUids={highlightCards}
        animatingDrawUid={animatingDrawCard?.uid ?? currentEffectDraw?.uid}
        canConfirm={!!canConfirm}
        confirmed={playerConfirmed}
        disabled={!!disabled || !canActAfterDraw}
        getDraggableProps={(card, canDrag) => drag.draggableProps(card, canDrag)}
        onCardClick={handleCardClick}
        onCardHover={handleCardHover}
        onCardHoverOut={handleCardHoverOut}
        onDeckClick={handleDeckClick}
        onConfirm={handleConfirm}
        canConfirmArsenal={!!canConfirmArsenal}
        onConfirmArsenal={handleConfirmArsenal}
        shouldDraw={isSelectPhase && !playerConfirmed && !player.hasDrawnThisTurn && player.deck.length > 0}
      />

      {/* ═══ Draw Animation Overlay ═══ */}
      {animatingDrawCard ? (
        <CardDrawAnimationOverlay
          card={animatingDrawCard}
          cardUid={animatingDrawCard.uid}
          onAnimationComplete={() => setAnimatingDrawCard(null)}
        />
      ) : currentEffectDraw ? (
        <CardDrawAnimationOverlay
          card={currentEffectDraw}
          cardUid={currentEffectDraw.uid}
          onAnimationComplete={() => onEffectDrawDismissed?.()}
        />
      ) : null}

      {/* ═══ Inspect Panel (info only) ═══ */}
      {inspectedCard && (
        <CardInspect2
          card={inspectedCard}
          comboInfo={inspectComboInfo}
          bottomOffset={230}
          onPanelMouseEnter={handlePanelMouseEnter}
          onPanelMouseLeave={handlePanelMouseLeave}
          onClose={() => {
            setInspectedCard(null);
            setInspectComboInfo(null);
          }}
        />
      )}
    </div>
  );
}
