"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { BattleCard } from "@/lib/battle/types";
import type { CombatEventData } from "./BattleBoard2";
import type { TrickBanner2Data } from "./TrickBanner2";
import type { TransformSlideData } from "./BattleBoard2";
import TrickBanner2 from "./TrickBanner2";
import { SwordIcon, ShieldIcon, ComboIcon } from "./icons";
import FlippableCard from "../ui/FlippableCard";
import { RENDER_V } from "@/lib/renderVersion";
import { RARITY_COLORS } from "@/lib/rarityColors";

/*
 * ResolveSequence2 — Full-screen resolve animations.
 *
 * Animation chain:
 *   1. Trick banners (sequential)
 *   2. Combo transformations (full-screen with particle burst)
 *   3. Combat (full-screen sequential: player strikes then opponent strikes)
 *   4. HP update (handled externally via callback)
 */

type ResolvePhase =
  | "tricks"
  | "transform"
  | "combat"
  | "done";

interface ResolveSequence2Props {
  /** Trick activations to show */
  tricks: TrickBanner2Data[];
  /** Combo transformations */
  transforms: TransformSlideData[];
  /** Combat event data */
  combat: CombatEventData | null;
  /** Player / Opponent names */
  playerName: string;
  opponentName: string;
  /** Player / Opponent card back images */
  playerCardBack?: string;
  opponentCardBack?: string;
  /** Called when the entire resolve sequence finishes */
  onDone: () => void;
}

export default function ResolveSequence2({
  tricks,
  transforms,
  combat,
  playerName,
  opponentName,
  playerCardBack = "/card-back.webp",
  opponentCardBack = "/card-back.webp",
  onDone,
}: ResolveSequence2Props) {
  const [phase, setPhase] = useState<ResolvePhase>("tricks");
  const [trickIndex, setTrickIndex] = useState(0);
  const doneRef = useRef(false);

  const handleTrickDone = useCallback(() => {
    if (trickIndex + 1 < tricks.length) {
      setTrickIndex(trickIndex + 1);
    } else {
      if (transforms.length > 0) setPhase("transform");
      else if (combat) setPhase("combat");
      else setPhase("done");
    }
  }, [trickIndex, tricks.length, transforms.length, combat]);

  useEffect(() => {
    if (phase === "tricks" && tricks.length === 0) {
      if (transforms.length > 0) setPhase("transform");
      else if (combat) setPhase("combat");
      else setPhase("done");
    }
  }, [phase, tricks.length, transforms.length, combat]);

  const handleTransformDone = useCallback(() => {
    if (combat) setPhase("combat");
    else setPhase("done");
  }, [combat]);

  const handleCombatDone = useCallback(() => {
    setPhase("done");
  }, []);

  useEffect(() => {
    if (phase === "done" && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  }, [phase, onDone]);

  if (phase === "done") return null;

  return (
    <>
      {/* Trick phase */}
      {phase === "tricks" && tricks[trickIndex] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <TrickBanner2
            key={trickIndex}
            trick={tricks[trickIndex]}
            playerName={playerName}
            opponentName={opponentName}
            onDone={handleTrickDone}
          />
        </div>
      )}

      {/* Transform phase — full-screen */}
      {phase === "transform" && (
        <TransformFullscreen
          slides={transforms}
          playerCardBack={playerCardBack}
          opponentCardBack={opponentCardBack}
          onDone={handleTransformDone}
        />
      )}

      {/* Combat phase — full-screen sequential attack */}
      {phase === "combat" && combat && (
        <CombatFullscreen
          combat={combat}
          playerName={playerName}
          opponentName={opponentName}
          onDone={handleCombatDone}
        />
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 *  Full-screen Transform Animation (ported from old TransformAnimation)
 * ════════════════════════════════════════════════════════════════════════════ */

type SlidePhase = "entering" | "glowing" | "merging" | "flashing" | "showing-result" | "leaving";

const PARTICLE_DIRS = [
  { tx: "0px", ty: "-70px" }, { tx: "49px", ty: "-49px" },
  { tx: "70px", ty: "0px" }, { tx: "49px", ty: "49px" },
  { tx: "0px", ty: "70px" }, { tx: "-49px", ty: "49px" },
  { tx: "-70px", ty: "0px" }, { tx: "-49px", ty: "-49px" },
  { tx: "30px", ty: "-65px" }, { tx: "-30px", ty: "-65px" },
  { tx: "65px", ty: "30px" }, { tx: "-65px", ty: "-30px" },
];

function TransformFullscreen({
  slides,
  playerCardBack,
  opponentCardBack,
  onDone,
}: {
  slides: TransformSlideData[];
  playerCardBack: string;
  opponentCardBack: string;
  onDone: () => void;
}) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [phase, setPhase] = useState<SlidePhase>("entering");
  const phaseRef = useRef<SlidePhase>("entering");
  const [visible, setVisible] = useState(true);
  const doneRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const slide = slides[slideIdx];
  const isPlayer = slide.isPlayer;
  const glowRgb = isPlayer ? "200,150,42" : "200,60,80";
  const accentColor = isPlayer ? "rgba(200,150,42,0.9)" : "rgba(200,60,80,0.9)";
  const particleColor = isPlayer ? "#d4a017" : "#c83c50";

  const advance = useCallback(() => {
    if (doneRef.current) return;
    if (phaseRef.current !== "showing-result") {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      phaseRef.current = "showing-result";
      setPhase("showing-result");
      return;
    }
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (slideIdx < slides.length - 1) {
      setSlideIdx((i) => i + 1);
    } else {
      doneRef.current = true;
      phaseRef.current = "leaving";
      setPhase("leaving");
      setTimeout(() => {
        setVisible(false);
        setTimeout(onDone, 300);
      }, 400);
    }
  }, [slideIdx, slides.length, onDone]);

  useEffect(() => {
    phaseRef.current = "entering";
    setPhase("entering");
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const after = (ms: number, fn: () => void) => {
      timersRef.current.push(setTimeout(fn, ms));
    };
    after(350, () => { phaseRef.current = "glowing"; setPhase("glowing"); });
    after(900, () => { phaseRef.current = "merging"; setPhase("merging"); });
    after(1400, () => { phaseRef.current = "flashing"; setPhase("flashing"); });
    after(1700, () => { phaseRef.current = "showing-result"; setPhase("showing-result"); });

    return () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideIdx]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); advance(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [advance]);

  const entering = phase === "entering";
  const glowing = phase === "glowing" || phase === "merging";
  const merging = phase === "merging" || phase === "flashing";
  const flashing = phase === "flashing";
  const showingResult = phase === "showing-result" || phase === "leaving";
  const leaving = phase === "leaving";

  return (
    <div
      className="fixed inset-0 z-[105] flex flex-col items-center justify-center gap-6 px-4"
      style={{
        background: "rgba(0,0,0,0.92)",
        opacity: visible ? 1 : 0,
        transition: "opacity 300ms ease",
        pointerEvents: "all",
      }}
      onClick={advance}
    >
      {/* Header */}
      <div
        className="text-center"
        style={{
          opacity: entering || leaving ? 0 : 1,
          transform: entering ? "translateY(-16px)" : "translateY(0)",
          transition: "opacity 400ms, transform 400ms cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div className="text-[9px] tracking-[0.35em] uppercase mb-1" style={{ color: "var(--text-muted)" }}>
          {slide.name}
        </div>
        <div
          className="font-display font-black text-xl sm:text-2xl tracking-widest uppercase"
          style={{ color: accentColor, textShadow: `0 0 24px rgba(${glowRgb},0.7)` }}
        >
          Transformation
        </div>
      </div>

      {/* Source cards row */}
      {!showingResult && (
        <div className="flex items-center gap-6 sm:gap-10">
          <div style={{
            animation: entering
              ? "transform-card-in-left 350ms cubic-bezier(0.16,1,0.3,1) forwards"
              : merging ? "transform-merge-left 450ms cubic-bezier(0.4,0,0.6,1) forwards" : undefined,
          }}>
            <div
              className="relative w-36 h-[220px] sm:w-44 sm:h-[270px] rounded-lg overflow-hidden border-2 select-none"
              style={{
                borderColor: glowing ? `rgba(${glowRgb},0.9)` : "rgba(156,163,175,0.55)",
                boxShadow: glowing ? `0 0 28px rgba(${glowRgb},0.6)` : `0 0 12px rgba(156,163,175,0.55)`,
                transition: "box-shadow 300ms, border-color 300ms",
              }}
            >
              <img src={`/api/cards/render/${encodeURIComponent(slide.character.cardId || slide.character.name)}?atk=${slide.character.attack}&def=${slide.character.defense}&v=${RENDER_V}`} alt={slide.character.name} draggable={false} className="w-full h-full object-cover select-none" />
            </div>
          </div>

          <div style={{ opacity: merging ? 0 : entering ? 0 : 1, transition: "opacity 200ms" }}>
            <span className="text-3xl sm:text-4xl font-black select-none" style={{ color: `rgba(${glowRgb},0.85)` }}>+</span>
          </div>

          <div style={{
            animation: entering
              ? "transform-card-in-right 350ms cubic-bezier(0.16,1,0.3,1) forwards"
              : merging ? "transform-merge-right 450ms cubic-bezier(0.4,0,0.6,1) forwards" : undefined,
          }}>
            <div
              className="relative w-36 h-[220px] sm:w-44 sm:h-[270px] rounded-lg overflow-hidden border-2 select-none"
              style={{
                borderColor: glowing ? `rgba(${glowRgb},0.9)` : "rgba(156,163,175,0.55)",
                boxShadow: glowing ? `0 0 28px rgba(${glowRgb},0.6)` : `0 0 12px rgba(156,163,175,0.55)`,
                transition: "box-shadow 300ms, border-color 300ms",
              }}
            >
              <img src={`/api/cards/render/${encodeURIComponent(slide.arsenal.cardId || slide.arsenal.name)}?atk=${slide.arsenal.attack}&def=${slide.arsenal.defense}&v=${RENDER_V}`} alt={slide.arsenal.name} draggable={false} className="w-full h-full object-cover select-none" />
            </div>
          </div>
        </div>
      )}

      {/* Flash burst + particles */}
      {flashing && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0" style={{
            background: `radial-gradient(ellipse at center, rgba(255,255,255,0.55) 0%, rgba(${glowRgb},0.25) 40%, transparent 70%)`,
            animation: "transform-flash-out 380ms ease-out forwards",
          }} />
          {PARTICLE_DIRS.map((d, i) => (
            <div key={i} className="absolute w-2 h-2 rounded-full" style={{
              background: particleColor,
              boxShadow: `0 0 6px ${particleColor}`,
              // @ts-expect-error CSS custom props
              "--tx": d.tx, "--ty": d.ty,
              animation: `transform-particle-fly 420ms ease-out ${i * 18}ms forwards`,
            }} />
          ))}
        </div>
      )}

      {/* Result card */}
      {showingResult && (
        <div className="flex flex-col items-center gap-3" style={{ opacity: leaving ? 0 : 1, transition: leaving ? "opacity 400ms" : undefined }}>
          <div style={{ animation: "transform-result-burst 550ms cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
            <div className="relative w-64 h-[440px] sm:w-72 sm:h-[495px]">
              <FlippableCard
                name={slide.result.name}
                frontSrc={`/api/cards/render/${encodeURIComponent(slide.result.cardId || slide.result.name)}?atk=${slide.result.attack}&def=${slide.result.defense}&v=${RENDER_V}`}
                backSrc={slide.isPlayer ? playerCardBack : opponentCardBack}
                rarity={slide.result.rarity}
                rarityColor={RARITY_COLORS[slide.result.rarity] ?? "#9ca3af"}
                cardType={slide.result.type}
              />
            </div>
          </div>
          <div className="text-sm sm:text-base tracking-[0.25em] uppercase font-display font-bold"
            style={{ color: `rgba(${glowRgb},0.85)`, textShadow: `0 0 20px rgba(${glowRgb},0.6)`, animation: "transform-label-in 400ms 300ms ease-out both" }}>
            {slide.result.name}
          </div>
        </div>
      )}

      <div className="absolute bottom-6 text-[10px] tracking-[0.2em] uppercase transition-opacity duration-300"
        style={{ color: "rgba(255,255,255,0.35)", opacity: showingResult ? 1 : 0.4 }}>
        {showingResult ? "Tap or Space to continue" : "Tap to skip"}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 *  Full-screen Combat Animation (ported from old CombatAnimation)
 *  Sequential: player strikes → result → opponent strikes → result → dismiss
 * ════════════════════════════════════════════════════════════════════════════ */

type AnimPhase = "enter" | "p-strike" | "p-result" | "gap" | "o-strike" | "o-result" | "wait" | "exit";

function CombatFullscreen({
  combat,
  playerName,
  opponentName,
  onDone,
}: {
  combat: CombatEventData;
  playerName: string;
  opponentName: string;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<AnimPhase>("enter");
  const [canDismiss, setCanDismiss] = useState(false);
  const doneRef = useRef(false);

  // Animated HP values — start at "before" and tick down after damage phases
  const [displayPlayerHp, setDisplayPlayerHp] = useState(combat.playerHpBefore);
  const [displayOpponentHp, setDisplayOpponentHp] = useState(combat.opponentHpBefore);

  const finish = useCallback(() => {
    if (doneRef.current || !canDismiss) return;
    doneRef.current = true;
    setPhase("exit");
    setTimeout(onDone, 400);
  }, [onDone, canDismiss]);

  // Animate HP counting down over ~600ms
  const animateHp = useCallback((
    from: number, to: number, setter: (v: number) => void,
  ) => {
    const diff = from - to;
    if (diff <= 0) { setter(to); return; }
    const steps = Math.min(diff, 20);
    const stepMs = 600 / steps;
    for (let i = 1; i <= steps; i++) {
      setTimeout(() => {
        setter(Math.round(from - (diff * (i / steps))));
      }, stepMs * i);
    }
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const after = (ms: number, fn: () => void) => { timers.push(setTimeout(fn, ms)); };
    after(1800, () => setPhase("p-strike"));
    after(2500, () => {
      setPhase("p-result");
      // Player strikes opponent → opponent HP drops
      animateHp(combat.opponentHpBefore, combat.opponentHpAfter, setDisplayOpponentHp);
    });
    after(3800, () => setPhase("gap"));
    after(4400, () => setPhase("o-strike"));
    after(5100, () => {
      setPhase("o-result");
      // Opponent strikes player → player HP drops
      animateHp(combat.playerHpBefore, combat.playerHpAfter, setDisplayPlayerHp);
    });
    after(6400, () => { setPhase("wait"); setCanDismiss(true); });
    return () => timers.forEach(clearTimeout);
  }, [combat, animateHp]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); finish(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [finish]);

  const isExiting = phase === "exit";
  const isEntering = phase === "enter";

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
      <div className="flex items-center gap-5 sm:gap-10">
        {/* Player Side */}
        <div className="flex items-center gap-2 sm:gap-4" style={{
          transform: isEntering ? "translateX(-100vw)" : "translateX(0)",
          transition: "transform 500ms cubic-bezier(0.16,1,0.3,1)",
        }}>
          {/* Player info */}
          <div className="flex flex-col items-center gap-2 min-w-[80px] sm:min-w-[100px]">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(200,150,42,0.2)", border: "2px solid rgba(200,150,42,0.4)" }}>
              <SwordIcon size={20} style={{ color: "var(--gold)" }} />
            </div>
            <span className="text-xs sm:text-sm font-display font-bold tracking-wider uppercase" style={{ color: "var(--gold)" }}>
              {playerName}
            </span>
            <div className="text-center">
              <div className="text-sm sm:text-base font-bold tabular-nums transition-colors duration-300" style={{ color: playerHit ? "#ef4444" : "var(--text-primary)" }}>
                {displayPlayerHp}/{combat.playerMaxHp}
              </div>
              <HPBarMini current={displayPlayerHp} max={combat.playerMaxHp} flash={playerHit} />
            </div>
            {showOpponentCalc && combat.damageToPlayer > 0 && (
              <div style={{ animation: "combat-dmg-pop 500ms cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
                <span className="text-xl sm:text-2xl font-display font-black" style={{ color: "#ef4444", textShadow: "0 0 12px rgba(239,68,68,0.8)" }}>
                  -{combat.damageToPlayer}
                </span>
              </div>
            )}
          </div>
          {/* Player card */}
          <div className="relative">
            <CombatCardDisplay card={combat.playerCard} shake={playerHit} defBroken={showOpponentCalc} incomingDamage={showOpponentCalc ? combat.damageToPlayer : undefined} />
            {playerHit && <div className="absolute inset-0 rounded-lg pointer-events-none" style={{ background: "rgba(239,68,68,0.25)", animation: "combat-flash 500ms ease-out forwards" }} />}
          </div>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center justify-center min-w-[60px] sm:min-w-[90px]">
          <div className="text-3xl sm:text-5xl font-display font-black tracking-[0.15em]" style={{
            color: "var(--crimson)", textShadow: "0 0 20px rgba(155,26,42,0.6)",
            opacity: isEntering ? 0 : 1, transform: isEntering ? "scale(2.5)" : "scale(1)",
            transition: "all 400ms cubic-bezier(0.34,1.56,0.64,1)",
          }}>VS</div>
        </div>

        {/* Opponent Side */}
        <div className="flex items-center gap-2 sm:gap-4" style={{
          transform: isEntering ? "translateX(100vw)" : "translateX(0)",
          transition: "transform 500ms cubic-bezier(0.16,1,0.3,1)",
        }}>
          <div className="relative">
            <CombatCardDisplay card={combat.opponentCard} shake={opponentHit} defBroken={showPlayerCalc} incomingDamage={showPlayerCalc ? combat.damageToOpponent : undefined} />
            {opponentHit && <div className="absolute inset-0 rounded-lg pointer-events-none" style={{ background: "rgba(239,68,68,0.25)", animation: "combat-flash 500ms ease-out forwards" }} />}
          </div>
          <div className="flex flex-col items-center gap-2 min-w-[80px] sm:min-w-[100px]">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(155,26,42,0.2)", border: "2px solid rgba(155,26,42,0.5)" }}>
              <ShieldIcon size={20} style={{ color: "var(--crimson)" }} />
            </div>
            <span className="text-xs sm:text-sm font-display font-bold tracking-wider uppercase" style={{ color: "var(--crimson)" }}>
              {opponentName}
            </span>
            <div className="text-center">
              <div className="text-sm sm:text-base font-bold tabular-nums transition-colors duration-300" style={{ color: opponentHit ? "#ef4444" : "var(--text-primary)" }}>
                {displayOpponentHp}/{combat.opponentMaxHp}
              </div>
              <HPBarMini current={displayOpponentHp} max={combat.opponentMaxHp} flash={opponentHit} />
            </div>
            {showPlayerCalc && combat.damageToOpponent > 0 && (
              <div style={{ animation: "combat-dmg-pop 500ms cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
                <span className="text-xl sm:text-2xl font-display font-black" style={{ color: "#ef4444", textShadow: "0 0 12px rgba(239,68,68,0.8)" }}>
                  -{combat.damageToOpponent}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {canDismiss && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm tracking-wider uppercase animate-pulse" style={{ color: "rgba(255,255,255,0.45)" }}>
          Tap or press Space to continue
        </div>
      )}
    </div>
  );
}

/* ── HP Bar Mini ── */
function HPBarMini({ current, max, flash }: { current: number; max: number; flash?: boolean }) {
  const pct = Math.max(0, (current / max) * 100);
  const isCritical = pct <= 15;
  const isLow = pct <= 30;
  const barBg = flash || isCritical
    ? "linear-gradient(90deg, #dc2626, #ef4444)"
    : isLow ? "linear-gradient(90deg, #f59e0b, #ef4444)"
    : "linear-gradient(90deg, rgb(17,3,28), rgb(227,185,56))";
  const glow = flash || isCritical ? "0 0 8px rgba(239,68,68,0.6)" : isLow ? "0 0 6px rgba(245,158,11,0.4)" : "0 0 4px rgba(227,185,56,0.3)";

  return (
    <div className="w-20 sm:w-28 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barBg, transition: "width 700ms ease-out", boxShadow: glow }} />
    </div>
  );
}

/* ── Combat Card Display ── */
function CombatCardDisplay({ card, shake, defBroken, incomingDamage }: {
  card: BattleCard; shake: boolean; defBroken?: boolean; incomingDamage?: number;
}) {
  return (
    <div className="relative w-36 sm:w-44 flex flex-col items-center" style={{ animation: shake ? "combat-shake-anim 300ms ease-in-out" : "none" }}>
      <img
        src={`/api/cards/render/${encodeURIComponent(card.cardId || card.name)}?atk=${card.attack}&def=${card.defense}&v=${RENDER_V}`}
        alt={card.name}
        className="w-full rounded-lg select-none"
        style={{ boxShadow: shake ? "0 0 30px rgba(239,68,68,0.5)" : "0 0 20px rgba(156,163,175,0.6)" }}
        draggable={false}
      />
      {defBroken && (
        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 flex gap-3 text-xs sm:text-sm items-center px-3 py-1.5 rounded-lg whitespace-nowrap z-10"
          style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(239,68,68,0.3)", animation: "combat-calc-in 400ms ease-out both" }}>
          <span className="flex items-center gap-1">
            <SwordIcon size={12} style={{ color: "#f87171" }} />
            {card.attack}
          </span>
          <span className="flex items-center gap-1">
            <ShieldIcon size={12} style={{ color: "rgba(96,165,250,0.4)" }} />
            <span style={{ textDecoration: "line-through", textDecorationColor: "#ef4444", color: "rgba(96,165,250,0.4)" }}>{card.defense}</span>
            <span className="font-display font-black" style={{
              color: (incomingDamage ?? 0) > 0 ? "#ef4444" : "var(--text-muted)",
              textShadow: (incomingDamage ?? 0) > 0 ? "0 0 8px rgba(239,68,68,0.6)" : "none",
            }}>{incomingDamage ?? 0}</span>
          </span>
        </div>
      )}
    </div>
  );
}
