"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  createInitialState,
  applyAction,
} from "@/lib/battle/engine";
import { getAIAction } from "@/lib/battle/ai";
import {
  TUTORIAL_PLAYER_DECK,
  TUTORIAL_OPPONENT_DECK,
  TUTORIAL_STEPS,
  TOTAL_TUTORIAL_STEPS,
  TUTORIAL_COMBO_RECIPES,
} from "@/lib/battle/tutorial";
import { TUTORIAL_XP_REWARD } from "@/lib/battle/constants";
import type { GameState, GameAction, GameEvent } from "@/lib/battle/types";
import BattleBoard from "@/components/battle/BattleBoard";
import type { CombatEventData } from "@/components/battle/BattleBoard";
import TutorialOverlay from "@/components/battle/TutorialOverlay";
import GameOverScreen from "@/components/battle/GameOverScreen";
import TransformAnimation, { type TransformSlide } from "@/components/battle/TransformAnimation";

export default function TutorialPage() {
  const router = useRouter();

  // Tutorial progress
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [loading, setLoading] = useState(true);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  // Game state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [playerHpDelta, setPlayerHpDelta] = useState<number | undefined>();
  const [opponentHpDelta, setOpponentHpDelta] = useState<number | undefined>();
  const [gameOver, setGameOver] = useState(false);
  const [xpGranted, setXpGranted] = useState(false);
  const [combatEvent, setCombatEvent] = useState<CombatEventData | null>(null);
  const pendingHpDeltas = useRef<{ player?: number; opponent?: number }>({});
  const [transformSlides, setTransformSlides] = useState<TransformSlide[] | null>(null);
  const pendingCombatEvent = useRef<CombatEventData | null>(null);

  // AI processing ref to prevent double-runs
  const aiRunning = useRef(false);

  // ── Check existing progress on mount ──
  useEffect(() => {
    async function checkProgress() {
      try {
        const res = await fetch("/api/tutorial");
        const data = await res.json();
        if (data.success && data.data.tutorialCompleted) {
          setAlreadyCompleted(true);
        }
        if (data.success && data.data.tutorialStep > 0 && !data.data.tutorialCompleted) {
          setTutorialStep(data.data.tutorialStep);
        }
      } catch {
        // Ignore — proceed with tutorial from step 0
      }
      setLoading(false);
    }
    checkProgress();
  }, []);

  // ── Initialize game ──
  useEffect(() => {
    if (loading) return;
    const { state } = createInitialState({
      playerDeck: [...TUTORIAL_PLAYER_DECK],
      opponentDeck: [...TUTORIAL_OPPONENT_DECK],
      playerId: "player",
      opponentId: "opponent",
      playerName: "You",
      opponentName: "Tutorial Foe",
      skipShuffle: true, // Fixed order for tutorial
      comboRecipes: TUTORIAL_COMBO_RECIPES,
    });
    setGameState(state);
  }, [loading]);

  // ── Handle HP delta animations ──
  useEffect(() => {
    if (playerHpDelta !== undefined) {
      const t = setTimeout(() => setPlayerHpDelta(undefined), 1500);
      return () => clearTimeout(t);
    }
  }, [playerHpDelta]);
  useEffect(() => {
    if (opponentHpDelta !== undefined) {
      const t = setTimeout(() => setOpponentHpDelta(undefined), 1500);
      return () => clearTimeout(t);
    }
  }, [opponentHpDelta]);

  // ── Process events for UI effects ──
  const processEvents = useCallback((evts: GameEvent[]) => {
    // Check for combo resolved events first
    const comboEvts = evts.filter(e => e.type === 'COMBO_RESOLVED');
    const combatEvt = evts.find(e => e.type === 'SIMULTANEOUS_COMBAT');

    if (comboEvts.length > 0) {
      // Build slides — player first, then opponent
      const slides: TransformSlide[] = comboEvts
        .filter((e): e is Extract<GameEvent, { type: 'COMBO_RESOLVED' }> => e.type === 'COMBO_RESOLVED')
        .sort((a, b) => (a.playerId === 'player' ? -1 : 1))
        .map(e => ({
          character: e.character,
          arsenal: e.arsenal,
          result: e.result,
          name: e.playerId === 'player' ? 'You' : 'Opponent',
          isPlayer: e.playerId === 'player',
        }));
      setTransformSlides(slides);

      // Stash combat event to show after transform
      if (combatEvt && combatEvt.type === 'SIMULTANEOUS_COMBAT') {
        pendingCombatEvent.current = {
          playerCard: combatEvt.playerCard,
          opponentCard: combatEvt.opponentCard,
          playerAttack: combatEvt.playerAttack,
          playerDefense: combatEvt.playerDefense,
          opponentAttack: combatEvt.opponentAttack,
          opponentDefense: combatEvt.opponentDefense,
          damageToPlayer: combatEvt.damageToPlayer,
          damageToOpponent: combatEvt.damageToOpponent,
          playerHpBefore: combatEvt.playerHpBefore,
          playerHpAfter: combatEvt.playerHpAfter,
          playerMaxHp: combatEvt.playerMaxHp,
          opponentHpBefore: combatEvt.opponentHpBefore,
          opponentHpAfter: combatEvt.opponentHpAfter,
          opponentMaxHp: combatEvt.opponentMaxHp,
        };
      }
      // Stash HP deltas too
      for (const evt of evts) {
        if (evt.type === 'HP_CHANGED') {
          if (evt.playerId === 'player') pendingHpDeltas.current.player = evt.delta;
          if (evt.playerId === 'opponent') pendingHpDeltas.current.opponent = evt.delta;
        }
      }
      return;
    }

    // No combo — check for combat event
    if (combatEvt && combatEvt.type === "SIMULTANEOUS_COMBAT") {
      setCombatEvent({
        playerCard: combatEvt.playerCard,
        opponentCard: combatEvt.opponentCard,
        playerAttack: combatEvt.playerAttack,
        playerDefense: combatEvt.playerDefense,
        opponentAttack: combatEvt.opponentAttack,
        opponentDefense: combatEvt.opponentDefense,
        damageToPlayer: combatEvt.damageToPlayer,
        damageToOpponent: combatEvt.damageToOpponent,
        playerHpBefore: combatEvt.playerHpBefore,
        playerHpAfter: combatEvt.playerHpAfter,
        playerMaxHp: combatEvt.playerMaxHp,
        opponentHpBefore: combatEvt.opponentHpBefore,
        opponentHpAfter: combatEvt.opponentHpAfter,
        opponentMaxHp: combatEvt.opponentMaxHp,
      });
      // Store HP deltas to apply after animation
      for (const evt of evts) {
        if (evt.type === "HP_CHANGED") {
          if (evt.playerId === "player") pendingHpDeltas.current.player = evt.delta;
          if (evt.playerId === "opponent") pendingHpDeltas.current.opponent = evt.delta;
        }
      }
      return;
    }

    for (const evt of evts) {
      if (evt.type === "HP_CHANGED") {
        if (evt.playerId === "player") setPlayerHpDelta(evt.delta);
        if (evt.playerId === "opponent") setOpponentHpDelta(evt.delta);
      }
    }
  }, []);

  // ── Apply a player action ──
  const handleAction = useCallback(
    (action: GameAction) => {
      if (!gameState || gameState.winner) return;

      const result = applyAction(gameState, action, "player");
      if (result.error) {
        console.warn("Invalid action:", result.error);
        return;
      }

      setGameState(result.state);
      setEvents(result.events);
      processEvents(result.events);

      // Check tutorial step advancement
      const currentStep = TUTORIAL_STEPS[tutorialStep];
      if (currentStep && currentStep.requiredAction) {
        if (
          action.type === currentStep.requiredAction &&
          (!currentStep.requiredCardUid ||
            ("cardUid" in action && action.cardUid === currentStep.requiredCardUid) ||
            ("arsenalUid" in action && action.arsenalUid === currentStep.requiredCardUid))
        ) {
          // Advance tutorial
          const nextStep = tutorialStep + 1;
          setTutorialStep(nextStep);
          if (nextStep < TOTAL_TUTORIAL_STEPS) {
            setShowOverlay(true);
            // Save progress
            saveTutorialProgress(nextStep);
          }
        }
      }

      // Check win condition
      if (result.state.winner) {
        setGameOver(true);
      }
    },
    [gameState, tutorialStep, processEvents],
  );

  // ── AI selection logic (simultaneous — AI submits all at once) ──
  useEffect(() => {
    if (!gameState || gameState.winner || aiRunning.current) return;
    // AI only acts during the select phase, and only if it hasn't confirmed yet
    if (gameState.phase !== "select") return;
    if (gameState.opponent.selection.confirmed) return;

    aiRunning.current = true;
    const delay = tutorialStep < TOTAL_TUTORIAL_STEPS ? 600 : 800;

    const timeout = setTimeout(() => {
      runAISelections();
      aiRunning.current = false;
    }, delay);

    return () => {
      clearTimeout(timeout);
      aiRunning.current = false;
    };
  }, [gameState, tutorialStep]);

  /** AI submits all its selections and confirms in one batch */
  const runAISelections = useCallback(() => {
    if (!gameState) return;

    let currentState = gameState;
    let iterations = 0;

    // AI takes selection actions until it confirms or hits safety limit
    while (
      currentState.phase === "select" &&
      !currentState.opponent.selection.confirmed &&
      !currentState.winner &&
      iterations < 20
    ) {
      const action = getAIAction(currentState, "opponent", "tutorial");
      if (!action) break;

      const result = applyAction(currentState, action, "opponent");
      if (result.error) break;

      currentState = result.state;
      processEvents(result.events);
      iterations++;
    }

    setGameState(currentState);
    if (currentState.winner) setGameOver(true);
  }, [gameState, processEvents]);

  // ── Transform animation done ──
  const handleTransformDone = useCallback(() => {
    setTransformSlides(null);
    if (pendingCombatEvent.current) {
      setCombatEvent(pendingCombatEvent.current);
      pendingCombatEvent.current = null;
    } else {
      // No combat follows — still apply HP deltas
      if (pendingHpDeltas.current.player !== undefined) setPlayerHpDelta(pendingHpDeltas.current.player);
      if (pendingHpDeltas.current.opponent !== undefined) setOpponentHpDelta(pendingHpDeltas.current.opponent);
      pendingHpDeltas.current = {};
    }
  }, []);

  // ── Combat animation done handler ──
  const handleCombatAnimationDone = useCallback(() => {
    setCombatEvent(null);
    // Apply deferred HP deltas
    if (pendingHpDeltas.current.player !== undefined) {
      setPlayerHpDelta(pendingHpDeltas.current.player);
    }
    if (pendingHpDeltas.current.opponent !== undefined) {
      setOpponentHpDelta(pendingHpDeltas.current.opponent);
    }
    pendingHpDeltas.current = {};
  }, []);

  // ── Tutorial completion ──
  const handleTutorialComplete = useCallback(async () => {
    if (xpGranted) return;
    setXpGranted(true);

    try {
      // Mark tutorial as complete
      await fetch("/api/tutorial", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorialCompleted: true,
          tutorialStep: TOTAL_TUTORIAL_STEPS,
        }),
      });

      // Grant XP
      await fetch("/api/xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "tutorial",
          amount: TUTORIAL_XP_REWARD,
        }),
      });
    } catch (e) {
      console.error("Failed to save tutorial completion:", e);
    }
  }, [xpGranted]);

  // Grant XP on victory
  useEffect(() => {
    if (gameOver && gameState?.winner === "player") {
      handleTutorialComplete();
    }
  }, [gameOver, gameState?.winner, handleTutorialComplete]);

  // ── Overlay handlers ──
  const handleOverlayContinue = useCallback(() => {
    const step = TUTORIAL_STEPS[tutorialStep];
    if (!step) return;

    // If it's a blocking step without a required action, just advance
    if (step.blocking && !step.requiredAction) {
      setShowOverlay(false);
      const nextStep = tutorialStep + 1;
      setTutorialStep(nextStep);
      saveTutorialProgress(nextStep);

      // Show next step overlay after a brief delay
      if (nextStep < TOTAL_TUTORIAL_STEPS) {
        setTimeout(() => setShowOverlay(true), 300);
      }
    } else if (step.blocking && step.requiredAction) {
      // Hide overlay but wait for action
      setShowOverlay(false);
    }
  }, [tutorialStep]);

  const saveTutorialProgress = async (step: number) => {
    try {
      await fetch("/api/tutorial", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorialStep: step }),
      });
    } catch {
      // Silent fail
    }
  };

  // ── Get tutorial highlights ──
  const currentStep = TUTORIAL_STEPS[tutorialStep];
  const highlightCards: string[] = [];
  const highlightAreas: string[] = [];

  if (currentStep && !showOverlay && currentStep.requiredCardUid) {
    highlightCards.push(currentStep.requiredCardUid);
  }

  if (currentStep?.highlight) {
    for (const sel of currentStep.highlight) {
      // Extract data-area and data-card values from CSS selectors
      const areaMatch = sel.match(/data-area="([^"]+)"/);
      const cardMatch = sel.match(/data-card="([^"]+)"/);
      const actionMatch = sel.match(/data-action="([^"]+)"/);
      if (areaMatch) highlightAreas.push(areaMatch[1]);
      if (cardMatch) highlightCards.push(cardMatch[1]);
      if (actionMatch) highlightAreas.push(actionMatch[1]);
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="loading-dot"
                style={{
                  width: 12,
                  height: 12,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
          <div className="text-sm tracking-wider" style={{ color: "var(--text-muted)" }}>
            Preparing tutorial...
          </div>
        </div>
      </div>
    );
  }

  // ── Already completed — replay option ──
  if (alreadyCompleted && !gameState) {
    return (
      <div className="animate-slide-up max-w-lg mx-auto text-center py-20">
        <div className="text-5xl mb-6 animate-float" style={{ display: "inline-block" }}>
          ✅
        </div>
        <h1 className="font-display font-black text-3xl tracking-widest uppercase text-gold-gradient mb-4">
          Tutorial Complete
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          You&apos;ve already shown the Dark Lord your competence. Want to run through it again?
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => {
              setAlreadyCompleted(false);
              setTutorialStep(0);
              setShowOverlay(true);
            }}
            className="btn-game px-6 py-3 text-sm"
          >
            Replay Tutorial
          </button>
          <button
            onClick={() => router.push("/hub")}
            className="btn-game btn-game-arcane px-6 py-3 text-sm"
          >
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) return null;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col relative">
      {/* Battle board */}
      <BattleBoard
        state={gameState}
        onAction={handleAction}
        highlightCards={highlightCards}
        highlightAreas={highlightAreas}
        disabled={gameState.phase !== "select" || gameState.player.selection.confirmed}
        playerHpDelta={playerHpDelta}
        opponentHpDelta={opponentHpDelta}
        deckName="First Steps"
        opponentInfo={{ name: "Tutorial Foe" }}
        combatEvent={combatEvent}
        onCombatAnimationDone={handleCombatAnimationDone}
      />

      {/* Tutorial overlay — hidden while combat animation is active */}
      {showOverlay && currentStep && !gameOver && !combatEvent && !transformSlides && (
        <TutorialOverlay
          title={currentStep.title}
          description={currentStep.description}
          instruction={currentStep.instruction}
          stepIndex={tutorialStep}
          totalSteps={TOTAL_TUTORIAL_STEPS}
          blocking={currentStep.blocking}
          onContinue={handleOverlayContinue}
          waitingForAction={!!currentStep.requiredAction}
        />
      )}

      {/* Transform animation — runs before combat */}
      {transformSlides && (
        <TransformAnimation
          slides={transformSlides}
          onDone={handleTransformDone}
        />
      )}

      {/* Game over screen — hidden while combat animation is active */}
      {gameOver && !combatEvent && !transformSlides && (
        <GameOverScreen
          won={gameState.winner === "player"}
          tie={gameState.winner === "tie"}
          xpReward={gameState.winner === "player" ? TUTORIAL_XP_REWARD : 0}
          isTutorial
          onContinue={() => {
            if (gameState.winner === "player") {
              router.push("/hub");
            } else {
              // Reset for retry
              setGameOver(false);
              setTutorialStep(7); // Go back to free play
              const { state } = createInitialState({
                playerDeck: [...TUTORIAL_PLAYER_DECK],
                opponentDeck: [...TUTORIAL_OPPONENT_DECK],
                playerId: "player",
                opponentId: "opponent",
                playerName: "You",
                opponentName: "Tutorial Foe",
                skipShuffle: true,
                comboRecipes: TUTORIAL_COMBO_RECIPES,
              });
              setGameState(state);
            }
          }}
        />
      )}
    </div>
  );
}
