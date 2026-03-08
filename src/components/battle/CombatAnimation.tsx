"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { BattleCard } from "@/lib/battle/types";
import type { BattlePlayerInfo } from "./BattleBoard";

export interface CombatAnimationProps {
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
  playerInfo?: BattlePlayerInfo;
  opponentInfo?: BattlePlayerInfo;
  onDone: () => void;
}

/* Sequential attack phases: player strikes first, then opponent */
type AnimPhase =
  | "enter"       // cards fly in from sides
  | "p-strike"    // player's attack hits opponent card
  | "p-result"    // calculation shown, opponent HP drops
  | "gap"         // brief pause between attacks
  | "o-strike"    // opponent's attack hits player card
  | "o-result"    // calculation shown, player HP drops
  | "wait"        // ready to dismiss
  | "exit";       // fade out

const TYPE_ICONS: Record<string, string> = {
  character: "🧹",
  arsenal: "⚔️",
  destination: "🏰",
  trick: "✨",
};

const RARITY_BORDER: Record<string, string> = {
  normal: "rgba(156,163,175,0.6)",
  nice: "rgba(96,165,250,0.6)",
  special: "rgba(248,113,113,0.6)",
  uiiiii: "rgba(74,222,128,0.6)",
  unknown: "rgba(168,85,247,0.6)",
};

export default function CombatAnimation({
  playerCard,
  opponentCard,
  playerAttack,
  playerDefense,
  opponentAttack,
  opponentDefense,
  damageToPlayer,
  damageToOpponent,
  playerHpBefore,
  playerHpAfter,
  playerMaxHp,
  opponentHpBefore,
  opponentHpAfter,
  opponentMaxHp,
  playerInfo,
  opponentInfo,
  onDone,
}: CombatAnimationProps) {
  const [phase, setPhase] = useState<AnimPhase>("enter");
  const [canDismiss, setCanDismiss] = useState(false);
  const doneRef = useRef(false);

  // Animated HP values — start at "before" and drop on result phases
  const [pHp, setPHp] = useState(playerHpBefore);
  const [oHp, setOHp] = useState(opponentHpBefore);

  const finish = useCallback(() => {
    if (doneRef.current || !canDismiss) return;
    doneRef.current = true;
    setPhase("exit");
    setTimeout(onDone, 400);
  }, [onDone, canDismiss]);

  // Phase sequencer: auto-advances, then waits for user dismiss
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const after = (ms: number, fn: () => void) => {
      timers.push(setTimeout(fn, ms));
    };

    after(1800, () => setPhase("p-strike"));
    after(2500, () => { setPhase("p-result"); setOHp(opponentHpAfter); });
    after(3800, () => setPhase("gap"));
    after(4400, () => setPhase("o-strike"));
    after(5100, () => { setPhase("o-result"); setPHp(playerHpAfter); });
    after(6400, () => { setPhase("wait"); setCanDismiss(true); });

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dismiss on Space / Enter
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [finish]);

  const isExiting = phase === "exit";
  const isEntering = phase === "enter";

  // Visibility helpers
  const AFTER_P_RESULT: AnimPhase[] = ["p-result", "gap", "o-strike", "o-result", "wait", "exit"];
  const AFTER_O_RESULT: AnimPhase[] = ["o-result", "wait", "exit"];

  const opponentHit = phase === "p-strike" || phase === "p-result";
  const playerHit = phase === "o-strike" || phase === "o-result";
  const showPlayerCalc = AFTER_P_RESULT.includes(phase);
  const showOpponentCalc = AFTER_O_RESULT.includes(phase);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4"
      style={{
        background: "rgba(0,0,0,0.88)",
        opacity: isExiting ? 0 : 1,
        transition: "opacity 400ms ease-out",
        pointerEvents: "all",
      }}
      onClick={canDismiss ? finish : undefined}
    >
      {/* Main battle area */}
      <div className="flex items-center gap-5 sm:gap-10">

        {/* ── Player Side: Info + Card ── */}
        <div
          className="flex items-center gap-2 sm:gap-4"
          style={{
            transform: isEntering ? "translateX(-100vw)" : "translateX(0)",
            transition: "transform 500ms cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* Player info (left of card) */}
          <div className="flex flex-col items-center gap-2 min-w-[80px] sm:min-w-[100px]">
            <div
              className="w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center overflow-hidden"
              style={{ background: "rgba(200,150,42,0.2)", border: "2px solid rgba(200,150,42,0.4)" }}
            >
              {playerInfo?.avatarUrl ? (
                <img src={playerInfo.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg">⚔️</span>
              )}
            </div>
            <span
              className="text-xs sm:text-sm font-display font-bold tracking-wider uppercase"
              style={{ color: "var(--gold)" }}
            >
              {playerInfo?.name ?? "You"}
            </span>

            {/* HP display */}
            <div className="text-center">
              <div
                className="text-sm sm:text-base font-bold tabular-nums transition-colors duration-300"
                style={{ color: playerHit ? "#ef4444" : "var(--text-primary)" }}
              >
                {pHp}/{playerMaxHp}
              </div>
              <HPBarMini current={pHp} max={playerMaxHp} flash={playerHit} />
            </div>

            {/* Damage received from opponent */}
            {showOpponentCalc && damageToPlayer > 0 && (
              <div style={{ animation: "combat-dmg-pop 500ms cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
                <span
                  className="text-xl sm:text-2xl font-display font-black"
                  style={{ color: "#ef4444", textShadow: "0 0 12px rgba(239,68,68,0.8)" }}
                >
                  -{damageToPlayer}
                </span>
              </div>
            )}
          </div>

          {/* Player card */}
          <div className="relative">
            <CardDisplay
              card={playerCard}
              shake={playerHit}
              defBroken={showOpponentCalc}
              incomingAttack={showOpponentCalc ? opponentAttack : undefined}
              incomingDamage={showOpponentCalc ? damageToPlayer : undefined}
            />
            {playerHit && (
              <div
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{
                  background: "rgba(239,68,68,0.25)",
                  animation: "combat-flash 500ms ease-out forwards",
                }}
              />
            )}
          </div>
        </div>

        {/* ── Center: VS ── */}
        <div className="flex flex-col items-center justify-center min-w-[60px] sm:min-w-[90px]">
          <div
            className="text-3xl sm:text-5xl font-display font-black tracking-[0.15em]"
            style={{
              color: "var(--crimson)",
              textShadow: "0 0 20px rgba(155,26,42,0.6)",
              opacity: isEntering ? 0 : 1,
              transform: isEntering ? "scale(2.5)" : "scale(1)",
              transition: "all 400ms cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            VS
          </div>
        </div>

        {/* ── Opponent Side: Card + Info ── */}
        <div
          className="flex items-center gap-2 sm:gap-4"
          style={{
            transform: isEntering ? "translateX(100vw)" : "translateX(0)",
            transition: "transform 500ms cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* Opponent card */}
          <div className="relative">
            <CardDisplay
              card={opponentCard}
              shake={opponentHit}
              defBroken={showPlayerCalc}
              incomingAttack={showPlayerCalc ? playerAttack : undefined}
              incomingDamage={showPlayerCalc ? damageToOpponent : undefined}
            />
            {opponentHit && (
              <div
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{
                  background: "rgba(239,68,68,0.25)",
                  animation: "combat-flash 500ms ease-out forwards",
                }}
              />
            )}
          </div>

          {/* Opponent info (right of card) */}
          <div className="flex flex-col items-center gap-2 min-w-[80px] sm:min-w-[100px]">
            <div
              className="w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center overflow-hidden"
              style={{ background: "rgba(155,26,42,0.2)", border: "2px solid rgba(155,26,42,0.5)" }}
            >
              {opponentInfo?.avatarUrl ? (
                <img src={opponentInfo.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg">👹</span>
              )}
            </div>
            <span
              className="text-xs sm:text-sm font-display font-bold tracking-wider uppercase"
              style={{ color: "var(--crimson)" }}
            >
              {opponentInfo?.name ?? "Opponent"}
            </span>

            {/* HP display */}
            <div className="text-center">
              <div
                className="text-sm sm:text-base font-bold tabular-nums transition-colors duration-300"
                style={{ color: opponentHit ? "#ef4444" : "var(--text-primary)" }}
              >
                {oHp}/{opponentMaxHp}
              </div>
              <HPBarMini current={oHp} max={opponentMaxHp} flash={opponentHit} />
            </div>

            {/* Damage received from player */}
            {showPlayerCalc && damageToOpponent > 0 && (
              <div style={{ animation: "combat-dmg-pop 500ms cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
                <span
                  className="text-xl sm:text-2xl font-display font-black"
                  style={{ color: "#ef4444", textShadow: "0 0 12px rgba(239,68,68,0.8)" }}
                >
                  -{damageToOpponent}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dismiss hint */}
      {canDismiss && (
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm tracking-wider uppercase animate-pulse"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          Tap or press Space to continue
        </div>
      )}
    </div>
  );
}

/* ─── Mini HP bar for combat animation ─────────────────────────────── */
function HPBarMini({ current, max, flash }: { current: number; max: number; flash?: boolean }) {
  const pct = Math.max(0, (current / max) * 100);
  const isCritical = pct <= 15;
  const isLow = pct <= 30;

  const barBg = flash
    ? "linear-gradient(90deg, #dc2626, #ef4444)"
    : isCritical
    ? "linear-gradient(90deg, #dc2626, #ef4444)"
    : isLow
    ? "linear-gradient(90deg, #f59e0b, #ef4444)"
    : "linear-gradient(90deg, rgb(17,3,28), rgb(227,185,56))";

  const glow = flash
    ? "0 0 8px rgba(239,68,68,0.6)"
    : isCritical
    ? "0 0 8px rgba(220,38,38,0.5)"
    : isLow
    ? "0 0 6px rgba(245,158,11,0.4)"
    : "0 0 4px rgba(227,185,56,0.3)";

  return (
    <div
      className="w-20 sm:w-28 h-2 rounded-full overflow-hidden"
      style={{ background: "rgba(255,255,255,0.08)" }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: barBg,
          transition: "width 700ms ease-out, background 300ms",
          boxShadow: glow,
        }}
      />
    </div>
  );
}

/* ─── Card display for the animation ──────────────────────────────────── */
function CardDisplay({
  card,
  shake,
  defBroken,
  incomingAttack,
  incomingDamage,
}: {
  card: BattleCard;
  shake: boolean;
  defBroken?: boolean;
  incomingAttack?: number;
  incomingDamage?: number;
}) {
  const borderColor = RARITY_BORDER[card.rarity] ?? RARITY_BORDER.normal;
  const isAdvanced = card.rarity === "uiiiii" || card.rarity === "special";

  return (
    <div
      className="relative w-36 h-52 sm:w-44 sm:h-60 flex flex-col border-2 rounded-lg overflow-hidden"
      style={{
        borderColor: shake ? "#ef4444" : borderColor,
        background: isAdvanced
          ? "linear-gradient(160deg, rgba(40,10,60,0.95), rgba(15,0,32,0.95))"
          : "linear-gradient(160deg, rgba(15,0,32,0.95), rgba(8,0,18,0.95))",
        boxShadow: shake
          ? "0 0 30px rgba(239,68,68,0.5), 0 0 60px rgba(0,0,0,0.5)"
          : `0 0 20px ${borderColor}, 0 0 40px rgba(0,0,0,0.5)`,
        animation: shake ? "combat-shake-anim 300ms ease-in-out" : "none",
        transition: "border-color 300ms, box-shadow 300ms",
      }}
    >
      {/* Card art area */}
      <div
        className="flex-1 flex items-center justify-center text-4xl sm:text-5xl select-none"
        style={{ background: "rgba(0,0,0,0.4)" }}
      >
        {TYPE_ICONS[card.type] ?? "❓"}
      </div>

      {/* Info */}
      <div className="p-2.5 sm:p-3 flex flex-col gap-0.5">
        <div
          className="font-display font-bold text-[10px] sm:text-xs tracking-wider uppercase truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {card.name}
        </div>

        {/* ATK + DEF stats — with break effect when hit */}
        <div className="flex gap-3 text-xs sm:text-sm items-center">
          <span style={{ color: "#f87171" }}>⚔ {card.attack}</span>

          {defBroken ? (
            <span className="flex items-center gap-1" style={{ animation: "combat-calc-in 400ms ease-out both" }}>
              {/* Broken shield */}
              <span style={{ opacity: 0.4, filter: "grayscale(1)" }} className="combat-shield-break">
                🛡
              </span>
              {/* Original DEF struck through */}
              <span style={{ color: "rgba(96,165,250,0.4)", textDecoration: "line-through", textDecorationColor: "#ef4444" }}>
                {card.defense}
              </span>
              {/* Incoming attack → damage result */}
              <span
                className="font-display font-black"
                style={{
                  color: (incomingDamage ?? 0) > 0 ? "#ef4444" : "var(--text-muted)",
                  textShadow: (incomingDamage ?? 0) > 0 ? "0 0 8px rgba(239,68,68,0.6)" : "none",
                }}
              >
                {incomingDamage ?? 0}
              </span>
            </span>
          ) : (
            <span style={{ color: "#60a5fa" }}>🛡 {card.defense}</span>
          )}
        </div>

      </div>

      {/* Combo source badge */}
      {card.comboSource && (
        <div
          className="absolute top-1 left-1 text-[7px] sm:text-[8px] font-bold px-1 py-0.5 rounded font-display tracking-wider uppercase"
          style={{ background: "rgba(200,150,42,0.3)", color: "var(--gold)" }}
        >
          COMBO
        </div>
      )}
    </div>
  );
}
