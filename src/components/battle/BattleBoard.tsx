"use client";

import type { GameState, GameAction, BattleCard } from "@/lib/battle/types";
import { getAvailableCombos, findComboRecipe } from "@/lib/battle/engine";
import { isComboDiscovered, markComboDiscovered } from "@/lib/battle/discovery";
import { useBattleDrag, type DropZoneId } from "@/hooks/useBattleDrag";
import { useCallback, useEffect, useRef, useState } from "react";
import HPBar from "./HPBar";
import PhaseIndicator from "./PhaseIndicator";
import CardInHand from "./CardInHand";
import ActiveSlot from "./ActiveSlot";
import DestinationZone from "./DestinationZone";
import CardDisplayPanel, { type ComboPreviewInfo } from "./CardDisplayPanel";
import CombatAnimation from "./CombatAnimation";

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

interface BattleBoardProps {
  state: GameState;
  onAction: (action: GameAction) => void;
  /** Tutorial highlights: card uids or area ids to glow */
  highlightCards?: string[];
  highlightAreas?: string[];
  /** Disable all player inputs (e.g. during resolve phase) */
  disabled?: boolean;
  /** Recent HP changes for animation */
  playerHpDelta?: number;
  opponentHpDelta?: number;
  /** Name shown on the player's deck pile */
  deckName?: string;
  /** Player info for HUD */
  playerInfo?: BattlePlayerInfo;
  /** Opponent info for HUD */
  opponentInfo?: BattlePlayerInfo;
  /** Combat event for resolve animation */
  combatEvent?: CombatEventData | null;
  /** Called when the combat animation finishes */
  onCombatAnimationDone?: () => void;
}

export default function BattleBoard({
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
}: BattleBoardProps) {
  const isSelectPhase = state.phase === "select";
  const playerConfirmed = state.player.selection.confirmed;
  const opponentConfirmed = state.opponent.selection.confirmed;
  const canAct = isSelectPhase && !disabled && !state.winner && !playerConfirmed;
  const canActAfterDraw = canAct && state.player.hasDrawnThisTurn;

  // Get available combos for the player
  const availableCombos = isSelectPhase
    ? getAvailableCombos(state, state.player.id)
    : [];

  // Preview: what the active will look like after selections
  const selectedChar = state.player.selection.characterUid
    ? state.player.hand.find(c => c.uid === state.player.selection.characterUid)
    : null;
  const selectedComboArsenal = state.player.selection.comboArsenalUid
    ? state.player.hand.find(c => c.uid === state.player.selection.comboArsenalUid)
    : null;
  const comboResult = selectedComboArsenal
    ? availableCombos.find(c => c.arsenalUid === selectedComboArsenal.uid)?.result
    : null;

  // ─── Card Display Panel state ───────────────────────────────────────────
  const [inspectedCard, setInspectedCard] = useState<BattleCard | null>(null);
  const [inspectAction, setInspectAction] = useState<{ label: string; onClick: () => void } | null>(null);
  const [inspectComboInfo, setInspectComboInfo] = useState<{ characterName: string; arsenalName: string } | null>(null);
  const [inspectIsHidden, setInspectIsHidden] = useState(false);

  // Hover combo preview state
  const [hoverPreview, setHoverPreview] = useState<{
    card: BattleCard;
    comboInfo: { characterName: string; arsenalName: string };
    isHidden: boolean;
  } | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ─── Discovery: mark combos as discovered when they resolve ─────────────
  useEffect(() => {
    if (state.player.active?.comboSource) {
      markComboDiscovered(
        state.player.active.comboSource.characterName,
        state.player.active.comboSource.arsenalName,
      );
    }
  }, [state.player.active]);

  useEffect(() => {
    if (state.opponent.active?.comboSource) {
      markComboDiscovered(
        state.opponent.active.comboSource.characterName,
        state.opponent.active.comboSource.arsenalName,
      );
    }
  }, [state.opponent.active]);

  // ─── Drag & Drop ───────────────────────────────────────────────────────
  const handleDrop = useCallback(
    (card: BattleCard, zone: DropZoneId) => {
      if (!canActAfterDraw) return;
      if (zone === "player-active") {
        if (card.type === "character") {
          if (state.player.selection.characterUid !== card.uid) {
            onAction({ type: "SELECT_CHARACTER", cardUid: card.uid });
          }
        } else if (card.type === "arsenal") {
          onAction({ type: "SELECT_COMBO", arsenalUid: card.uid });
        }
      } else if (zone === "field-destination") {
        if (card.type === "destination") {
          onAction({ type: "PLAY_DESTINATION", cardUid: card.uid });
        }
      }
    },
    [canActAfterDraw, state.player.selection.characterUid, onAction],
  );

  const drag = useBattleDrag({ onDrop: handleDrop });

  // Can the card be dragged?
  const canDragCard = (card: BattleCard): boolean => {
    if (!canActAfterDraw) return false;
    switch (card.type) {
      case "character":
        return state.player.selection.characterUid !== card.uid;
      case "arsenal":
        return true;
      case "destination":
        return true;
      case "trick":
        return false; // tricks use click via inspect panel
      default:
        return false;
    }
  };

  // ─── Action label for inspect panel ─────────────────────────────────────
  const getActionForCard = (card: BattleCard): { label: string; action: GameAction } | null => {
    if (!canActAfterDraw) return null;
    switch (card.type) {
      case "character":
        if (state.player.selection.characterUid === card.uid) return null;
        return { label: "Select Fighter", action: { type: "SELECT_CHARACTER", cardUid: card.uid } };
      case "arsenal": {
        const hasActiveCharacter = !!(state.player.selection.characterUid || state.player.active);
        if (state.player.selection.comboArsenalUid === card.uid) {
          const hasRecipe = availableCombos.some(c => c.arsenalUid === card.uid);
          return { label: hasRecipe ? "Remove Combo" : "Unequip Arsenal", action: { type: "DESELECT_COMBO" } };
        }
        if (!hasActiveCharacter) return null;
        if (availableCombos.some(c => c.arsenalUid === card.uid)) {
          return { label: "Use for Combo", action: { type: "SELECT_COMBO", arsenalUid: card.uid } };
        }
        return { label: "Equip Arsenal", action: { type: "SELECT_COMBO", arsenalUid: card.uid } };
      }
      case "destination":
        if (state.player.selection.destinationUid === card.uid) {
          return { label: "Unstage Destination", action: { type: "REMOVE_DESTINATION", cardUid: card.uid } };
        }
        return { label: "Play Destination", action: { type: "PLAY_DESTINATION", cardUid: card.uid } };
      case "trick":
        if (state.player.selection.trickUids.includes(card.uid)) {
          return { label: "Remove Trick", action: { type: "REMOVE_TRICK", cardUid: card.uid } };
        }
        return { label: "Play Trick", action: { type: "PLAY_TRICK", cardUid: card.uid } };
      default:
        return null;
    }
  };

  // ─── Click-to-inspect ──────────────────────────────────────────────────
  const handleInspectCard = useCallback((card: BattleCard, isHandCard: boolean) => {
    // Don't open inspect panel if a drag just ended
    if (drag.wasDragged()) return;

    setInspectedCard(card);
    // Clear hover preview when inspecting
    setHoverPreview(null);
    clearTimeout(hoverTimerRef.current);

    // Compute action for hand cards
    if (isHandCard && canActAfterDraw) {
      const actionInfo = getActionForCard(card);
      if (actionInfo) {
        setInspectAction({
          label: actionInfo.label,
          onClick: () => onAction(actionInfo.action),
        });
      } else {
        setInspectAction(null);
      }
    } else {
      setInspectAction(null);
    }

    // Compute combo info for arsenal cards
    if (card.type === "arsenal") {
      const activeChar = selectedChar ?? state.player.active;
      if (activeChar && activeChar.type === "character") {
        const recipe = findComboRecipe(state.comboRecipes, activeChar.name, card.name);
        if (recipe) {
          setInspectComboInfo({
            characterName: activeChar.name,
            arsenalName: card.name,
          });
          setInspectIsHidden(!isComboDiscovered(activeChar.name, card.name));
          return;
        }
      }
    }

    // Compute combo info for character cards (show available combos)
    if (card.type === "character") {
      const arsenals = state.player.hand.filter(c => c.type === "arsenal");
      for (const ars of arsenals) {
        const recipe = findComboRecipe(state.comboRecipes, card.name, ars.name);
        if (recipe) {
          setInspectComboInfo({
            characterName: card.name,
            arsenalName: ars.name,
          });
          setInspectIsHidden(!isComboDiscovered(card.name, ars.name));
          return;
        }
      }
    }

    setInspectComboInfo(null);
    setInspectIsHidden(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAct, selectedChar, state.player.active, state.player.hand, state.comboRecipes, availableCombos, onAction, drag]);

  const closeInspect = useCallback(() => {
    setInspectedCard(null);
    setInspectAction(null);
    setInspectComboInfo(null);
    setInspectIsHidden(false);
  }, []);

  // ─── Hover combo preview (desktop only) ─────────────────────────────────
  const handleCardHoverStart = useCallback((card: BattleCard) => {
    clearTimeout(hoverTimerRef.current);
    // Don't show preview if inspect panel is open
    if (inspectedCard) return;

    const activeChar = selectedChar ?? state.player.active;

    if (card.type === "arsenal" && activeChar && activeChar.type === "character") {
      const recipe = findComboRecipe(state.comboRecipes, activeChar.name, card.name);
      if (recipe) {
        const discovered = isComboDiscovered(activeChar.name, card.name);
        setHoverPreview({
          card: recipe.result,
          comboInfo: { characterName: activeChar.name, arsenalName: card.name },
          isHidden: !discovered,
        });
        return;
      }
    }

    if (card.type === "character") {
      const arsenals = state.player.hand.filter(c => c.type === "arsenal");
      for (const ars of arsenals) {
        const recipe = findComboRecipe(state.comboRecipes, card.name, ars.name);
        if (recipe) {
          const discovered = isComboDiscovered(card.name, ars.name);
          setHoverPreview({
            card: recipe.result,
            comboInfo: { characterName: card.name, arsenalName: ars.name },
            isHidden: !discovered,
          });
          return;
        }
      }
    }

    // No combo — clear preview
    setHoverPreview(null);
  }, [inspectedCard, selectedChar, state.player.active, state.player.hand, state.comboRecipes]);

  const handleCardHoverEnd = useCallback(() => {
    hoverTimerRef.current = setTimeout(() => {
      setHoverPreview(null);
    }, 300);
  }, []);

  const handlePreviewPanelEnter = useCallback(() => {
    clearTimeout(hoverTimerRef.current);
  }, []);

  const handlePreviewPanelLeave = useCallback(() => {
    hoverTimerRef.current = setTimeout(() => {
      setHoverPreview(null);
    }, 300);
  }, []);

  // Is hover over a particular drag zone?
  const isHoverActive = drag.state.overZone === "player-active";
  const isHoverDest = drag.state.overZone === "field-destination";

  return (
    <div className="relative h-full min-h-0 overflow-hidden flex flex-col"
      style={{
        background: "linear-gradient(180deg, rgba(155,26,42,0.04), rgba(255,255,255,0.01), rgba(200,150,42,0.04))",
      }}
    >
      {/* ═══ TOP BAR: Phase center — Opponent top-right ═══ */}
      <div className="flex-shrink-0 flex items-start justify-between px-3 pt-2 pb-1">
        {/* Phase indicator — left/center */}
        <div className="flex-1" />
        <PhaseIndicator
          currentPhase={state.phase}
          turn={state.turn}
          playerConfirmed={playerConfirmed}
          opponentConfirmed={opponentConfirmed}
        />
        {/* Opponent identity + HP — top-right */}
        <div className="flex-1 flex items-start justify-end gap-2">
          <div className="flex flex-col items-end leading-none mt-1">
            <span className="text-xs font-display font-bold tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
              {opponentInfo?.name ?? state.opponent.name}
            </span>
            {opponentInfo?.rankTitle && (
              <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: opponentInfo.rankColor ?? 'var(--text-muted)' }}>
                {opponentInfo.rankTitle}
              </span>
            )}
          </div>
          <div className="relative flex-shrink-0">
            <HPBar
              current={state.opponent.hp}
              max={state.opponent.maxHp}
              label={opponentInfo?.name ?? state.opponent.name}
              align="right"
              recentDelta={opponentHpDelta}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                style={{ background: 'rgba(155,26,42,0.4)', border: '2px solid rgba(155,26,42,0.6)' }}
              >
                {opponentInfo?.avatarUrl ? (
                  <img src={opponentInfo.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base">👹</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ARENA: Opponent Active → Destination → Player Active ═══ */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-1 relative px-3">
        {/* Opponent hand + deck (compact row above opponent active) */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {state.opponent.hand.map((c) => (
            <div key={c.uid} className="w-7 h-10 rounded flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #1a0030, #0a0018)", border: "1px solid rgba(200,150,42,0.15)" }}
            >
              <div className="w-full h-full flex items-center justify-center text-[8px] opacity-20">🂠</div>
            </div>
          ))}
          <div className="relative w-7 h-10 flex-shrink-0 ml-1"
            title={`Deck: ${state.opponent.deck.length}`}
          >
            {state.opponent.deck.length > 0 && (
              <img src="/card-back.webp" alt="Deck" className="absolute inset-0 w-full h-full rounded object-cover" />
            )}
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold"
              style={{ color: 'var(--gold)', textShadow: '0 0 4px rgba(0,0,0,0.9)' }}>
              {state.opponent.deck.length}
            </span>
          </div>
        </div>

        {/* Opponent active fighter
            During the select phase we intentionally show the PRE-combo character
            so the opponent's transformation stays hidden until combat resolves.
            If the opponent has no staged combo we fall back to their current active. */}
        <div className="flex-shrink-0">
          {(() => {
            const opponentDisplayCard = isSelectPhase
              ? (state.opponent.preComboCharacter ?? state.opponent.active)
              : state.opponent.active;
            // Hide the arsenal boost during select phase — it resolves on combat
            const opponentDisplayArsenal = isSelectPhase ? null : state.opponent.activeArsenal;
            return (
              <ActiveSlot
                active={opponentDisplayCard}
                isPlayer={false}
                areaId="opponent-active"
                highlighted={highlightAreas.includes("opponent-active")}
                activeArsenal={opponentDisplayArsenal}
                onInspect={opponentDisplayCard ? () => handleInspectCard(opponentDisplayCard, false) : undefined}
              />
            );
          })()}
        </div>

        {/* Destination zone — contested ground between fighters */}
        <div className="flex-shrink-0">
          <DestinationZone
            destination={state.field.destination}
            owner={state.field.destinationOwner}
            playerId={state.player.id}
            stagedCard={
              state.player.selection.destinationUid
                ? state.player.hand.find(c => c.uid === state.player.selection.destinationUid) ?? null
                : null
            }
            dropHover={isHoverDest}
            dropRef={drag.dropZoneRef("field-destination", ["destination"])}
            onInspect={state.field.destination ? () => handleInspectCard(state.field.destination!, false) : undefined}
          />
        </div>

        {/* Player active fighter */}
        <div className="flex-shrink-0">
          <ActiveSlot
            active={comboResult ?? selectedChar ?? state.player.active}
            isPlayer
            areaId="player-active"
            highlighted={highlightAreas.includes("player-active")}
            comboPreview={comboResult ? {
              characterName: (selectedChar ?? state.player.active)?.name ?? '',
              arsenalName: selectedComboArsenal?.name ?? '',
            } : undefined}
            activeArsenal={state.player.activeArsenal}
            pendingArsenal={!comboResult && selectedComboArsenal ? selectedComboArsenal : null}
            dropHover={isHoverActive}
            dropRef={drag.dropZoneRef("player-active", ["character", "arsenal"])}
            onInspect={
              (comboResult ?? selectedChar ?? state.player.active)
                ? () => handleInspectCard((comboResult ?? selectedChar ?? state.player.active)!, false)
                : undefined
            }
          />
        </div>

        {/* Confirm + status — right side of arena */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5">
          {canAct && (state.player.selection.characterUid || state.player.active) && (
            <button
              data-action="confirm"
              onClick={() => onAction({ type: "CONFIRM_SELECTION" })}
              disabled={!state.player.hasDrawnThisTurn}
              title={!state.player.hasDrawnThisTurn ? "Draw a card first" : undefined}
              className="btn-game px-4 py-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✦ Confirm
            </button>
          )}

          {playerConfirmed && !opponentConfirmed && !state.winner && (
            <div className="text-[10px] tracking-wider uppercase animate-arcane-pulse" style={{ color: "var(--text-muted)" }}>
              Waiting…
            </div>
          )}

          {state.phase === "resolve" && !state.winner && (
            <div className="text-[10px] tracking-wider uppercase animate-arcane-pulse" style={{ color: "#a855f7" }}>
              ⚔️ Resolving…
            </div>
          )}

          {canAct && availableCombos.length > 0 && !state.player.selection.comboArsenalUid && (
            <div className="text-[9px] tracking-wider text-center max-w-[120px]" style={{ color: "rgba(200,150,42,0.5)" }}>
              ✦ {availableCombos.length} combo{availableCombos.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* ═══ BOTTOM BAR: Player info + deck (left) — Hand (center) ═══ */}
      <div className="flex-shrink-0 flex items-end gap-3 px-3 pb-2">
        {/* Player identity + HP + deck — bottom-left */}
        <div className="flex items-end gap-2 flex-shrink-0">
          <div className="relative flex-shrink-0">
            <HPBar
              current={state.player.hp}
              max={state.player.maxHp}
              label={playerInfo?.name ?? 'You'}
              align="left"
              recentDelta={playerHpDelta}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                style={{ background: 'rgba(200,150,42,0.3)', border: '2px solid rgba(200,150,42,0.5)' }}
              >
                {playerInfo?.avatarUrl ? (
                  <img src={playerInfo.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base">⚔️</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col leading-none mb-1">
            <span className="text-xs font-display font-bold tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
              {playerInfo?.name ?? 'You'}
            </span>
            {playerInfo?.rankTitle && (
              <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: playerInfo.rankColor ?? 'var(--text-muted)' }}>
                {playerInfo.rankTitle}
              </span>
            )}
          </div>
          {/* Player deck */}
          {(() => {
            const canDraw = canAct && !state.player.hasDrawnThisTurn && state.player.deck.length > 0;
            const deckHighlighted = canDraw || highlightAreas.includes("player-deck");
            return (
              <div
                className={`relative flex-shrink-0 ${canDraw ? "cursor-pointer" : ""}`}
                title={canDraw ? "Click to draw a card" : `Deck: ${state.player.deck.length}`}
                onClick={canDraw ? () => onAction({ type: "DRAW_CARD" }) : undefined}
                data-area="player-deck"
              >
                <div className={`relative w-[4.5rem] h-[6.25rem] ${deckHighlighted ? "animate-pulse" : ""}`}>
                  {state.player.deck.length > 2 && (
                    <img src="/card-back.webp" alt="" className="absolute top-0 left-0 w-full h-full rounded object-cover" style={{ transform: 'translate(3px, 3px)', filter: 'brightness(0.45)' }} />
                  )}
                  {state.player.deck.length > 1 && (
                    <img src="/card-back.webp" alt="" className="absolute top-0 left-0 w-full h-full rounded object-cover" style={{ transform: 'translate(1.5px, 1.5px)', filter: 'brightness(0.65)' }} />
                  )}
                  {state.player.deck.length > 0 && (
                    <img src="/card-back.webp" alt="Deck" className="absolute top-0 left-0 w-full h-full rounded object-cover shadow-lg" />
                  )}
                  {deckHighlighted && (
                    <div className="absolute inset-0 rounded ring-2 ring-yellow-400 pointer-events-none" style={{ boxShadow: '0 0 16px rgba(200,150,42,0.5)' }} />
                  )}
                  <span className="absolute top-1 right-1 z-10 min-w-[1.35rem] h-[1.35rem] flex items-center justify-center rounded-full text-xs font-bold px-0.5"
                    style={{ background: 'rgba(10,0,25,0.92)', border: '1.5px solid rgba(200,150,42,0.7)', color: 'var(--gold)', boxShadow: '0 0 8px rgba(200,150,42,0.4)' }}>
                    {state.player.deck.length}
                  </span>
                </div>
                {deckName && (
                  <div className="text-center text-[10px] font-display font-bold tracking-wider uppercase whitespace-nowrap mt-0.5" style={{ color: 'var(--gold)', textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>
                    {deckName}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Player hand — fills remaining space */}
        <div className="flex-1 flex items-end justify-center">
          <div
            data-area="player-hand"
            className="flex items-end gap-1.5 flex-wrap justify-center"
          >
            {state.player.hand.map((card) => {
              const isHighlighted = highlightCards.includes(card.uid);
              const isSelected =
                state.player.selection.characterUid === card.uid ||
                state.player.selection.comboArsenalUid === card.uid ||
                state.player.selection.trickUids.includes(card.uid) ||
                state.player.selection.destinationUid === card.uid;
              const isStaged =
                state.player.selection.characterUid === card.uid ||
                state.player.selection.comboArsenalUid === card.uid;
              const isDraggable = canDragCard(card);
              const isBeingDragged = drag.state.dragging?.uid === card.uid;
              const hasCombo =
                (card.type === "arsenal" || card.type === "character") &&
                availableCombos.some(c =>
                  card.type === "arsenal"
                    ? c.arsenalUid === card.uid
                    : state.player.hand.some(
                        a => a.type === "arsenal" && findComboRecipe(state.comboRecipes, card.name, a.name),
                      ),
                );

              return (
                <CardInHand
                  key={card.uid}
                  card={card}
                  onInspect={() => handleInspectCard(card, true)}
                  onHoverStart={hasCombo ? () => handleCardHoverStart(card) : undefined}
                  onHoverEnd={hasCombo ? handleCardHoverEnd : undefined}
                  highlighted={(isHighlighted || isSelected) && !isBeingDragged}
                  staged={isStaged && !isBeingDragged}
                  disabled={isBeingDragged}
                  dragProps={isDraggable ? drag.draggableProps(card, true) : undefined}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Drag ghost overlay ── */}
      {drag.state.dragging && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: drag.state.position.x,
            top: drag.state.position.y,
            transform: "translate(-50%, -50%) rotate(-4deg) scale(1.1)",
          }}
        >
          <div
            className="w-20 h-28 sm:w-24 sm:h-[8.5rem] rounded flex flex-col p-1.5 text-left shadow-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(15,0,32,0.95), rgba(8,0,18,0.95))",
              border: `2px solid ${drag.state.overZone ? "#4ade80" : "var(--gold-bright)"}`,
              boxShadow: drag.state.overZone
                ? "0 0 24px rgba(34,197,94,0.5), 0 8px 32px rgba(0,0,0,0.6)"
                : "0 0 20px rgba(200,150,42,0.5), 0 8px 32px rgba(0,0,0,0.6)",
              opacity: 0.92,
            }}
          >
            <div className="text-[10px] mb-0.5" style={{ color: "var(--text-muted)" }}>
              {drag.state.dragging.type === "character" ? "👤" : drag.state.dragging.type === "arsenal" ? "⚔️" : "🏟️"}
            </div>
            <div
              className="text-[9px] sm:text-[10px] font-bold leading-tight truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {drag.state.dragging.name}
            </div>
            {(drag.state.dragging.type === "character" || drag.state.dragging.type === "arsenal") && (
              <div className="flex items-center justify-between mt-auto">
                <div className="text-[10px] font-bold" style={{ color: "#ef4444" }}>⚔{drag.state.dragging.attack}</div>
                <div className="text-[10px] font-bold" style={{ color: "#3b82f6" }}>🛡{drag.state.dragging.defense}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Hover combo preview panel (near hand) ── */}
      {hoverPreview && !inspectedCard && (
        <CardDisplayPanel
          card={hoverPreview.card}
          isHidden={hoverPreview.isHidden}
          comboInfo={hoverPreview.comboInfo}
          onClose={() => setHoverPreview(null)}
          mode="preview"
          onPanelMouseEnter={handlePreviewPanelEnter}
          onPanelMouseLeave={handlePreviewPanelLeave}
        />
      )}

      {/* ── Click-to-inspect panel (centered overlay) ── */}
      {inspectedCard && (
        <CardDisplayPanel
          card={inspectedCard}
          isHidden={inspectIsHidden}
          action={inspectAction}
          onClose={closeInspect}
          mode="inspect"
        />
      )}

      {/* ── Combat resolve animation ── */}
      {combatEvent && (
        <CombatAnimation
          playerCard={combatEvent.playerCard}
          opponentCard={combatEvent.opponentCard}
          playerAttack={combatEvent.playerAttack}
          playerDefense={combatEvent.playerDefense}
          opponentAttack={combatEvent.opponentAttack}
          opponentDefense={combatEvent.opponentDefense}
          damageToPlayer={combatEvent.damageToPlayer}
          damageToOpponent={combatEvent.damageToOpponent}
          playerHpBefore={combatEvent.playerHpBefore}
          playerHpAfter={combatEvent.playerHpAfter}
          playerMaxHp={combatEvent.playerMaxHp}
          opponentHpBefore={combatEvent.opponentHpBefore}
          opponentHpAfter={combatEvent.opponentHpAfter}
          opponentMaxHp={combatEvent.opponentMaxHp}
          playerInfo={playerInfo}
          opponentInfo={opponentInfo}
          onDone={onCombatAnimationDone ?? (() => {})}
        />
      )}
    </div>
  );
}
