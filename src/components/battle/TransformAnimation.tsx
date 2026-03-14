"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { BattleCard } from "@/lib/battle/types";

export interface TransformSlide {
  character: BattleCard;
  arsenal: BattleCard;
  result: BattleCard;
  name: string;
  isPlayer: boolean;
}

// Busts stale browser cache from old 24h Cache-Control headers
import { RENDER_V } from "@/lib/renderVersion";
const CACHE_BUST = `v=${RENDER_V}`;

interface TransformAnimationProps {
  slides: TransformSlide[];
  onDone: () => void;
}

type SlidePhase =
  | "entering"
  | "glowing"
  | "merging"
  | "flashing"
  | "showing-result"
  | "leaving";

const RARITY_BORDER: Record<string, string> = {
  normal: "rgba(156,163,175,0.55)",
  nice: "rgba(96,165,250,0.7)",
  special: "rgba(248,113,113,0.7)",
  uiiiii: "rgba(74,222,128,0.7)",
  unknown: "rgba(168,85,247,0.8)",
};

const PARTICLE_DIRS = [
  { tx: "0px",    ty: "-70px"  },
  { tx: "49px",   ty: "-49px"  },
  { tx: "70px",   ty: "0px"   },
  { tx: "49px",   ty: "49px"   },
  { tx: "0px",    ty: "70px"   },
  { tx: "-49px",  ty: "49px"   },
  { tx: "-70px",  ty: "0px"   },
  { tx: "-49px",  ty: "-49px"  },
  { tx: "30px",   ty: "-65px"  },
  { tx: "-30px",  ty: "-65px"  },
  { tx: "65px",   ty: "30px"   },
  { tx: "-65px",  ty: "-30px"  },
];

export default function TransformAnimation({
  slides,
  onDone,
}: TransformAnimationProps) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [phase, setPhase] = useState<SlidePhase>("entering");
  const phaseRef = useRef<SlidePhase>("entering");
  const [visible, setVisible] = useState(true);
  const doneRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const slide = slides[slideIdx];
  const isPlayer = slide.isPlayer;
  const goldColor = "rgba(200,150,42,0.9)";
  const crimsonColor = "rgba(200,60,80,0.9)";
  const accentColor = isPlayer ? goldColor : crimsonColor;
  const glowRgb = isPlayer ? "200,150,42" : "200,60,80";
  const particleColor = isPlayer ? "#d4a017" : "#c83c50";

  const advance = useCallback(() => {
    if (doneRef.current) return;
    if (phaseRef.current !== "showing-result") {
      // Skip animation — jump straight to the result
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      phaseRef.current = "showing-result";
      setPhase("showing-result");
      return;
    }
    // At result — advance to next slide or finish
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
      const t = setTimeout(fn, ms);
      timersRef.current.push(t);
    };

    after(350,  () => { phaseRef.current = "glowing";        setPhase("glowing");        });
    after(900,  () => { phaseRef.current = "merging";        setPhase("merging");        });
    after(1400, () => { phaseRef.current = "flashing";       setPhase("flashing");       });
    after(1700, () => { phaseRef.current = "showing-result"; setPhase("showing-result"); });
    // No auto-advance — waits for user to tap or press Space

    return () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideIdx]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        advance();
      }
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
          opacity: entering ? 0 : leaving ? 0 : 1,
          transform: entering ? "translateY(-16px)" : "translateY(0)",
          transition: "opacity 400ms, transform 400ms cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div
          className="text-[9px] tracking-[0.35em] uppercase mb-1"
          style={{ color: "var(--text-muted)" }}
        >
          {slide.name}
        </div>
        <div
          className="font-display font-black text-xl sm:text-2xl tracking-widest uppercase"
          style={{
            color: accentColor,
            textShadow: `0 0 24px rgba(${glowRgb},0.7)`,
          }}
        >
          ✦ Transformation ✦
        </div>
      </div>

      {/* Cards row — visible until showing-result */}
      {!showingResult && (
        <div className="flex items-center gap-6 sm:gap-10">
          {/* Character card */}
          <div
            style={{
              animation: entering
                ? "transform-card-in-left 350ms cubic-bezier(0.16,1,0.3,1) forwards"
                : merging
                ? "transform-merge-left 450ms cubic-bezier(0.4,0,0.6,1) forwards"
                : undefined,
            }}
          >
            <MiniCard
              card={slide.character}
              glowRgb={glowColor(glowing, glowRgb)}
            />
          </div>

          {/* Plus sign */}
          <div
            style={{
              opacity: merging ? 0 : entering ? 0 : 1,
              transition: "opacity 200ms",
              pointerEvents: "none",
            }}
          >
            <span
              className="text-3xl sm:text-4xl font-black select-none"
              style={{ color: `rgba(${glowRgb},0.85)` }}
            >
              +
            </span>
          </div>

          {/* Arsenal card */}
          <div
            style={{
              animation: entering
                ? "transform-card-in-right 350ms cubic-bezier(0.16,1,0.3,1) forwards"
                : merging
                ? "transform-merge-right 450ms cubic-bezier(0.4,0,0.6,1) forwards"
                : undefined,
            }}
          >
            <MiniCard
              card={slide.arsenal}
              glowRgb={glowColor(glowing, glowRgb)}
            />
          </div>
        </div>
      )}

      {/* Flash burst + particles */}
      {flashing && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          {/* Radial flash */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center, rgba(255,255,255,0.55) 0%, rgba(${glowRgb},0.25) 40%, transparent 70%)`,
              animation: "transform-flash-out 380ms ease-out forwards",
            }}
          />
          {/* Particles */}
          {PARTICLE_DIRS.map((d, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: particleColor,
                boxShadow: `0 0 6px ${particleColor}`,
                // @ts-expect-error CSS custom props
                "--tx": d.tx,
                "--ty": d.ty,
                animation: `transform-particle-fly 420ms ease-out ${i * 18}ms forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* Result card */}
      {showingResult && (
        <div
          className="flex flex-col items-center gap-3"
          style={{
            opacity: leaving ? 0 : 1,
            transition: leaving ? "opacity 400ms" : undefined,
          }}
        >
          <div
            style={{
              animation: "transform-result-burst 550ms cubic-bezier(0.34,1.56,0.64,1) forwards",
            }}
          >
            <ResultCard card={slide.result} character={slide.character} glowRgb={glowRgb} />
          </div>

          <div
            className="text-sm sm:text-base md:text-lg tracking-[0.25em] uppercase font-display font-bold"
            style={{
              color: `rgba(${glowRgb},0.85)`,
              textShadow: `0 0 20px rgba(${glowRgb},0.6)`,
              animation: "transform-label-in 400ms 300ms ease-out both",
            }}
          >
            ✦ {slide.result.name} ✦
          </div>
        </div>
      )}

      {/* Continue / skip hint */}
      <div
        className="absolute bottom-6 text-[10px] tracking-[0.2em] uppercase transition-opacity duration-300"
        style={{ color: "rgba(255,255,255,0.35)", opacity: showingResult ? 1 : 0.4 }}
      >
        {showingResult ? "Tap or Space to continue" : "Tap to skip"}
      </div>
    </div>
  );
}

function glowColor(active: boolean, rgb: string): string | undefined {
  return active ? rgb : undefined;
}

/* ─── Mini source card ─────────────────────────────────────────────── */
function MiniCard({
  card,
  glowRgb,
}: {
  card: BattleCard;
  glowRgb?: string;
}) {
  const border = RARITY_BORDER[card.rarity] ?? RARITY_BORDER.normal;
  const glowing = !!glowRgb;

  return (
    <div
      className="relative w-36 h-[220px] sm:w-44 sm:h-[270px] rounded-lg overflow-hidden border-2 select-none"
      style={{
        borderColor: glowing ? `rgba(${glowRgb},0.9)` : border,
        boxShadow: glowing
          ? `0 0 28px rgba(${glowRgb},0.6), 0 0 60px rgba(${glowRgb},0.25)`
          : `0 0 12px ${border}`,
        transition: "box-shadow 300ms, border-color 300ms",
      }}
    >
      <img
        src={`/api/cards/render/${encodeURIComponent(card.cardId || card.name)}?${CACHE_BUST}`}
        alt={card.name}
        draggable={false}
        className="w-full h-full object-cover select-none"
      />

      {/* Glow sweep */}
      {glowing && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, transparent 40%, rgba(${glowRgb},0.08) 100%)`,
          }}
        />
      )}
    </div>
  );
}

/* ─── Result card (larger, special styling) ────────────────────────── */

type FlameType = "red" | "blue" | "green" | "subtle" | "none";

function getFlameTypes(
  character: BattleCard,
  result: BattleCard,
): { atkFlame: FlameType; defFlame: FlameType } {
  const atkDelta = result.attack - character.attack;
  const defDelta = result.defense - character.defense;
  const total = atkDelta + defDelta;

  // No meaningful change
  if (total <= 0) return { atkFlame: "none", defFlame: "none" };

  const atkRatio = atkDelta / total;

  if (atkRatio >= 0.65) {
    // Heavy offense
    return {
      atkFlame: "red",
      defFlame: defDelta > 0 ? "subtle" : "none",
    };
  }
  if (atkRatio <= 0.35) {
    // Heavy defense
    return {
      atkFlame: atkDelta > 0 ? "subtle" : "none",
      defFlame: "blue",
    };
  }
  // Balanced
  return { atkFlame: "green", defFlame: "green" };
}

function ResultCard({
  card,
  character,
  glowRgb,
}: {
  card: BattleCard;
  character: BattleCard;
  glowRgb: string;
}) {
  return (
    <div
      className="relative w-64 h-[440px] sm:w-72 sm:h-[495px] md:w-80 md:h-[550px] rounded-2xl overflow-hidden border-3 select-none"
      style={{
        borderColor: `rgba(${glowRgb},1)`,
        boxShadow: `0 0 60px rgba(${glowRgb},0.8), 0 0 120px rgba(${glowRgb},0.4), 0 0 200px rgba(${glowRgb},0.15), inset 0 0 40px rgba(${glowRgb},0.1)`,
      }}
    >
      <img
        src={`/api/cards/render/${encodeURIComponent(card.cardId || card.name)}?${CACHE_BUST}`}
        alt={card.name}
        draggable={false}
        className="w-full h-full object-cover select-none"
      />

      {/* Inner glow border shimmer */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: `linear-gradient(135deg, rgba(${glowRgb},0.15) 0%, transparent 50%, rgba(${glowRgb},0.08) 100%)`,
          border: `1px solid rgba(${glowRgb},0.3)`,
        }}
      />

      {/* Animated outer glow ring */}
      <div
        className="absolute -inset-1 pointer-events-none rounded-2xl"
        style={{
          boxShadow: `0 0 30px rgba(${glowRgb},0.5)`,
          animation: "transform-glow-pulse 1.5s ease-in-out infinite alternate",
        }}
      />
    </div>
  );
}
