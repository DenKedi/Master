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
  const [visible, setVisible] = useState(true);
  const doneRef = useRef(false);

  const slide = slides[slideIdx];
  const isPlayer = slide.isPlayer;
  const goldColor = "rgba(200,150,42,0.9)";
  const crimsonColor = "rgba(200,60,80,0.9)";
  const accentColor = isPlayer ? goldColor : crimsonColor;
  const glowRgb = isPlayer ? "200,150,42" : "200,60,80";
  const particleColor = isPlayer ? "#d4a017" : "#c83c50";

  const skip = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setVisible(false);
    setTimeout(onDone, 300);
  }, [onDone]);

  useEffect(() => {
    setPhase("entering");
    const timers: ReturnType<typeof setTimeout>[] = [];
    const after = (ms: number, fn: () => void) =>
      timers.push(setTimeout(fn, ms));

    after(350, () => setPhase("glowing"));
    after(900,  () => setPhase("merging"));
    after(1400, () => setPhase("flashing"));
    after(1700, () => setPhase("showing-result"));
    after(3000, () => setPhase("leaving"));
    after(3400, () => {
      if (doneRef.current) return;
      if (slideIdx < slides.length - 1) {
        setSlideIdx((i) => i + 1);
      } else {
        doneRef.current = true;
        setVisible(false);
        setTimeout(onDone, 300);
      }
    });

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideIdx]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [skip]);

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
      onClick={skip}
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
        <div className="flex items-center gap-3 sm:gap-5">
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
              className="text-2xl sm:text-3xl font-black select-none"
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
            className="text-[10px] sm:text-xs tracking-[0.25em] uppercase"
            style={{
              color: `rgba(${glowRgb},0.75)`,
              animation: "transform-label-in 400ms 300ms ease-out both",
            }}
          >
            ✦ {slide.result.name} ✦
          </div>
        </div>
      )}

      {/* Slide counter dots (if 2 slides) */}
      {slides.length > 1 && (
        <div className="flex gap-2 mt-1">
          {slides.map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{
                background:
                  i === slideIdx
                    ? `rgba(${glowRgb},0.9)`
                    : "rgba(255,255,255,0.2)",
                transform: i === slideIdx ? "scale(1.4)" : "scale(1)",
              }}
            />
          ))}
        </div>
      )}

      {/* Skip hint */}
      <div
        className="absolute bottom-6 text-[10px] tracking-[0.2em] uppercase"
        style={{ color: "rgba(255,255,255,0.25)" }}
      >
        Tap to skip
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
      className="relative w-28 h-40 sm:w-32 sm:h-44 flex flex-col rounded-lg overflow-hidden border-2 select-none"
      style={{
        borderColor: glowing ? `rgba(${glowRgb},0.9)` : border,
        background:
          "linear-gradient(160deg, rgba(15,0,32,0.97), rgba(8,0,18,0.97))",
        boxShadow: glowing
          ? `0 0 28px rgba(${glowRgb},0.6), 0 0 60px rgba(${glowRgb},0.25)`
          : `0 0 12px ${border}`,
        transition: "box-shadow 300ms, border-color 300ms",
      }}
    >
      {/* Art area */}
      <div
        className="flex-1 flex items-center justify-center text-3xl sm:text-4xl"
        style={{ background: "rgba(0,0,0,0.45)" }}
      >
        {card.type === "character"
          ? "👤"
          : card.type === "arsenal"
          ? "⚔️"
          : "✨"}
      </div>

      {/* Info */}
      <div className="px-2 py-1.5 flex flex-col gap-0.5">
        <div
          className="text-[9px] font-bold leading-tight truncate uppercase tracking-wide"
          style={{ color: "var(--text-primary)" }}
        >
          {card.name}
        </div>
        {(card.type === "character" || card.type === "arsenal") && (
          <div className="flex gap-2 text-[9px]">
            <span style={{ color: "#f87171" }}>⚔ {card.attack}</span>
            <span style={{ color: "#60a5fa" }}>🛡 {card.defense}</span>
          </div>
        )}
      </div>

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
  const { atkFlame, defFlame } = getFlameTypes(character, card);
  return (
    <div
      className="relative w-36 h-52 sm:w-44 sm:h-60 flex flex-col rounded-xl overflow-hidden border-2 select-none"
      style={{
        borderColor: `rgba(${glowRgb},1)`,
        background:
          "linear-gradient(160deg, rgba(30,5,55,0.98), rgba(10,0,24,0.98))",
        boxShadow: `0 0 40px rgba(${glowRgb},0.7), 0 0 80px rgba(${glowRgb},0.25), inset 0 0 30px rgba(${glowRgb},0.08)`,
      }}
    >
      {/* Inner glow border shimmer */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{
          background: `linear-gradient(135deg, rgba(${glowRgb},0.12) 0%, transparent 60%)`,
        }}
      />

      {/* Art */}
      <div
        className="flex-1 flex items-center justify-center text-5xl sm:text-6xl"
        style={{ background: "rgba(0,0,0,0.35)" }}
      >
        ✨
      </div>

      {/* Info */}
      <div className="px-3 py-2 flex flex-col gap-1">
        <div
          className="text-[10px] sm:text-xs font-display font-black tracking-widest uppercase"
          style={{ color: `rgba(${glowRgb},1)`, textShadow: `0 0 8px rgba(${glowRgb},0.6)` }}
        >
          {card.name}
        </div>
        <div className="flex gap-3 text-xs sm:text-sm font-bold">
          <span className={atkFlame !== "none" ? `flame-${atkFlame}` : ""} style={atkFlame === "none" ? { color: "#f87171" } : undefined}>
            ⚔ {card.attack}
          </span>
          <span className={defFlame !== "none" ? `flame-${defFlame}` : ""} style={defFlame === "none" ? { color: "#60a5fa" } : undefined}>
            🛡 {card.defense}
          </span>
        </div>
      </div>

      {/* Combo badge */}
      <div
        className="absolute top-1.5 right-1.5 text-[7px] sm:text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider font-display"
        style={{
          background: `rgba(${glowRgb},0.25)`,
          border: `1px solid rgba(${glowRgb},0.6)`,
          color: `rgba(${glowRgb},1)`,
        }}
      >
        COMBO
      </div>
    </div>
  );
}
