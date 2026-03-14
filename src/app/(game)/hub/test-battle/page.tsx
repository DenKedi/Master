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
  TUTORIAL_COMBO_RECIPES,
} from "@/lib/battle/tutorial";
import { TUTORIAL_XP_REWARD } from "@/lib/battle/constants";
import { RENDER_V } from "@/lib/renderVersion";
import type { GameState, GameAction, GameEvent } from "@/lib/battle/types";
import BattleBoard2 from "@/components/battle2/BattleBoard2";
import type { CombatEventData, TransformSlideData } from "@/components/battle2/BattleBoard2";
import type { TrickBanner2Data } from "@/components/battle2/TrickBanner2";
import GameOver2 from "@/components/battle2/GameOver2";
import ResolveSequence2 from "@/components/battle2/ResolveSequence2";
import { markComboDiscovered } from "@/lib/battle/discovery";

export default function BattleV2Page() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerHpDelta, setPlayerHpDelta] = useState<number | undefined>();
  const [opponentHpDelta, setOpponentHpDelta] = useState<number | undefined>();
  const [gameOver, setGameOver] = useState(false);
  const [xpGranted, setXpGranted] = useState(false);

  // Prevent accidental leaving and two-finger back gestures
  useEffect(() => {
    if (gameOver) return;

    // 1) Prevent page reload/close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to abandon the battle?";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // 2) Prevent browser back button / swipe
    // Push an extra history state so the first "back" just consumes this state
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      if (window.confirm("Are you sure you want to flee from this battle? Your progress will be lost.")) {
        // Just let them go back now
        window.history.back();
      } else {
        // Re-push state so they are trapped again unless they confirm next time
        window.history.pushState(null, "", window.location.href);
      }
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [gameOver]);

  // Resolve sequence state
  const [resolveActive, setResolveActive] = useState(false);
  const [resolveTricks, setResolveTricks] = useState<TrickBanner2Data[]>([]);
  const [resolveTransforms, setResolveTransforms] = useState<TransformSlideData[]>([]);
  const [resolveCombat, setResolveCombat] = useState<CombatEventData | null>(null);

  const pendingHpDeltas = useRef<{ player?: number; opponent?: number }>({});
  const aiRunning = useRef(false);

  // ── Init ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { state } = createInitialState({
        playerDeck: [...TUTORIAL_PLAYER_DECK],
        opponentDeck: [...TUTORIAL_OPPONENT_DECK],
        playerId: "player",
        opponentId: "opponent",
        playerName: "You",
        opponentName: "Opponent",
        skipShuffle: true,
        comboRecipes: TUTORIAL_COMBO_RECIPES,
      });

      // Preload all card renders before showing the board
      const ids = new Set<string>();
      for (const c of [...TUTORIAL_PLAYER_DECK, ...TUTORIAL_OPPONENT_DECK]) ids.add(c.cardId || c.name);
      const preloadUrls: string[] = [];
      for (const id of ids) {
        preloadUrls.push(`/api/cards/render/${encodeURIComponent(id)}?v=${RENDER_V}`);
      }
      for (const r of TUTORIAL_COMBO_RECIPES) {
        const finalAtk = r.result.attack + (r.bonus?.attack ?? 0);
        const finalDef = r.result.defense + (r.bonus?.defense ?? 0);
        preloadUrls.push(`/api/cards/render/${encodeURIComponent(r.result.cardId || r.result.name)}?atk=${finalAtk}&def=${finalDef}&v=${RENDER_V}`);
      }
      let loaded = 0;
      await Promise.all(preloadUrls.map(url => new Promise<void>(resolve => {
        const img = new Image();
        img.onload = () => { loaded++; setLoadProgress(Math.round((loaded / preloadUrls.length) * 100)); resolve(); };
        img.onerror = () => { loaded++; setLoadProgress(Math.round((loaded / preloadUrls.length) * 100)); resolve(); };
        img.src = url;
      })));

      if (cancelled) return;
      setGameState(state);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // ── HP delta cleanup ──
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

  // ── Process events ──
  const processEvents = useCallback((evts: GameEvent[]) => {
    // Collect trick activations
    const trickActivations: TrickBanner2Data[] = [];
    for (let i = 0; i < evts.length; i++) {
      const evt = evts[i];
      if (evt.type === "TRICK_PLAYED") {
        const effectEvt = evts.slice(i + 1).find(
          (e) => e.type === "EFFECT_TRIGGERED" && e.card.uid === evt.card.uid,
        );
        trickActivations.push({
          card: evt.card,
          playerId: evt.playerId,
          description:
            effectEvt && effectEvt.type === "EFFECT_TRIGGERED"
              ? effectEvt.description
              : evt.card.description,
        });
      }
    }

    // Collect combos
    const comboEvts = evts.filter((e) => e.type === "COMBO_RESOLVED");
    const combatEvt = evts.find((e) => e.type === "SIMULTANEOUS_COMBAT");

    // Stash HP deltas
    for (const evt of evts) {
      if (evt.type === "HP_CHANGED") {
        if (evt.playerId === "player") {
          pendingHpDeltas.current.player = (pendingHpDeltas.current.player ?? 0) + evt.delta;
        }
        if (evt.playerId === "opponent") {
          pendingHpDeltas.current.opponent = (pendingHpDeltas.current.opponent ?? 0) + evt.delta;
        }
      }
    }

    // Build combat data
    let combatData: CombatEventData | null = null;
    if (combatEvt && combatEvt.type === "SIMULTANEOUS_COMBAT") {
      combatData = {
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

    // Build transform slides
    const transformSlides: TransformSlideData[] = comboEvts
      .filter(
        (e): e is Extract<GameEvent, { type: "COMBO_RESOLVED" }> =>
          e.type === "COMBO_RESOLVED",
      )
      .sort((a, b) => (a.playerId === "player" ? -1 : 1))
      .map((e) => ({
        character: e.character,
        arsenal: e.arsenal,
        result: e.result,
        name: e.playerId === "player" ? "You" : "Opponent",
        isPlayer: e.playerId === "player",
      }));

    // If we have any animations, activate the resolve sequence
    if (trickActivations.length > 0 || transformSlides.length > 0 || combatData) {
      setResolveTricks(trickActivations);
      setResolveTransforms(transformSlides);
      setResolveCombat(combatData);
      setResolveActive(true);
      return;
    }

    // No animations — apply HP deltas immediately
    applyPendingHpDeltas();
  }, []);

  // ── Apply pending HP deltas ──
  const applyPendingHpDeltas = useCallback(() => {
    if (pendingHpDeltas.current.player !== undefined) {
      setPlayerHpDelta(pendingHpDeltas.current.player);
    }
    if (pendingHpDeltas.current.opponent !== undefined) {
      setOpponentHpDelta(pendingHpDeltas.current.opponent);
    }
    pendingHpDeltas.current = {};
  }, []);

  // ── Resolve sequence done ──
  const handleResolveDone = useCallback(() => {
    setResolveActive(false);
    setResolveTricks([]);
    setResolveTransforms([]);
    setResolveCombat(null);
    applyPendingHpDeltas();
  }, [applyPendingHpDeltas]);

  // ── Handle player action ──
  const handleAction = useCallback(
    (action: GameAction) => {
      if (!gameState || gameState.winner) return;

      const result = applyAction(gameState, action, "player");
      if (result.error) {
        console.warn("Invalid action:", result.error);
        return;
      }

      setGameState(result.state);
      processEvents(result.events);

      if (result.state.winner) {
        setGameOver(true);
      }
    },
    [gameState, processEvents],
  );

  // ── AI ──
  useEffect(() => {
    if (!gameState || gameState.winner || aiRunning.current) return;
    if (gameState.phase !== "select") return;
    if (gameState.opponent.selection.confirmed) return;

    aiRunning.current = true;
    const timeout = setTimeout(() => {
      runAISelections();
      aiRunning.current = false;
    }, 800);

    return () => {
      clearTimeout(timeout);
      aiRunning.current = false;
    };
  }, [gameState]);

  const runAISelections = useCallback(() => {
    if (!gameState) return;
    let currentState = gameState;
    let iterations = 0;

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

  // ── XP on win ──
  const handleComplete = useCallback(async () => {
    if (xpGranted) return;
    setXpGranted(true);
    try {
      await fetch("/api/tutorial", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorialCompleted: true }),
      });
      await fetch("/api/xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "tutorial", amount: TUTORIAL_XP_REWARD }),
      });
    } catch (e) {
      console.error("Failed to save:", e);
    }
  }, [xpGranted]);

  useEffect(() => {
    if (gameOver && gameState?.winner === "player") {
      handleComplete();
    }
  }, [gameOver, gameState?.winner, handleComplete]);

  // ── Loading ──
  if (loading || !gameState) {
    return (
      <div className="battle2-root h-screen flex items-center justify-center" style={{
        background: "var(--bg-void)",
        backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(74,30,138,0.25) 0%, transparent 70%)",
      }}>
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="loading-dot" style={{ width: 8, height: 8, animationDelay: "0s" }} />
            <div className="loading-dot" style={{ width: 8, height: 8, animationDelay: "0.15s" }} />
            <div className="loading-dot" style={{ width: 8, height: 8, animationDelay: "0.3s" }} />
          </div>
          {loadProgress > 0 && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{ width: `${loadProgress}%`, background: "var(--gold)" }}
                />
              </div>
              <span className="text-xs" style={{ color: "rgba(200,150,42,0.6)" }}>Preparing cards… {loadProgress}%</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh)] flex flex-col relative">
      {/* Battle board */}
      <BattleBoard2
        state={gameState}
        onAction={handleAction}
        disabled={gameState.phase !== "select" || gameState.player.selection.confirmed}
        playerHpDelta={playerHpDelta}
        opponentHpDelta={opponentHpDelta}
        deckName="Starter Deck"
        playerInfo={{ name: "You" }}
        opponentInfo={{ name: "Opponent" }}
      />

      {/* Resolve sequence — plays inline inside arena */}
      {resolveActive && (
        <div className="absolute inset-0 z-20 pointer-events-auto">
          <ResolveSequence2
            tricks={resolveTricks}
            transforms={resolveTransforms}
            combat={resolveCombat}
            playerName="You"
            opponentName="Opponent"
            onDone={handleResolveDone}
          />
        </div>
      )}

      {/* Game over */}
      {gameOver && !resolveActive && (
        <GameOver2
          won={gameState.winner === "player"}
          tie={gameState.winner === "tie"}
          xpReward={gameState.winner === "player" ? TUTORIAL_XP_REWARD : 0}
          isTutorial
          starterDeckGranted={gameState.winner === "player"}
          onContinue={() => {
            if (gameState.winner === "player") {
              router.push("/hub?tutorialWon=1");
            } else {
              setGameOver(false);
              const { state } = createInitialState({
                playerDeck: [...TUTORIAL_PLAYER_DECK],
                opponentDeck: [...TUTORIAL_OPPONENT_DECK],
                playerId: "player",
                opponentId: "opponent",
                playerName: "You",
                opponentName: "Opponent",
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
