"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
 *  FlippableCard — Interactive 3D card with spin gesture and holographic
 *  light-refraction border shader. Mobile-first touch + mouse support.
 *
 *  Features:
 *   • Horizontal swipe / drag to spin the card 360°
 *   • Front = rendered card image, Back = custom backside image
 *   • Holographic border that refracts light differently based on rotation
 *   • Optional double-tap / double-click to auto-flip
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface FlippableCardProps {
  /** Rendered card front image URL (e.g. /api/cards/render/...) */
  frontSrc: string;
  /** Card back image URL — user or deck preference */
  backSrc?: string;
  /** Card name for alt text */
  name: string;
  /** Rarity string identifier to determine effects */
  rarity?: string;
  /** Default rarity color for the base border */
  rarityColor?: string;
  /** Card type — destinations are landscape  */
  cardType?: "character" | "arsenal" | "destination" | "trick";
  /** Style overrides */
  className?: string;
  style?: React.CSSProperties;
  /** Stop click-through to parent */
  onClick?: (e: React.MouseEvent) => void;
  /** Optionally control the Y rotation externally */
  externalRotationY?: number;
}

/** Clamp a number between min and max  */
function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export default function FlippableCard({
  frontSrc,
  backSrc = "/card-back.webp",
  name,
  rarity = "normal",
  rarityColor = "rgba(200,150,42,0.6)",
  cardType = "character",
  className = "",
  style,
  onClick,
  externalRotationY,
}: FlippableCardProps) {
  const [rotationY, setRotationY] = useState(externalRotationY ?? 0);

  // Sync external rotation changes
  useEffect(() => {
    if (externalRotationY !== undefined) {
      setRotationY(externalRotationY);
    }
  }, [externalRotationY]);

  const [isDragging, setIsDragging] = useState(false);
  const [velocity, setVelocity] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rotationAtStartRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  const isLandscape = cardType === "destination";
  const aspect = isLandscape ? "880 / 560" : "512 / 880";

  // ── Normalise rotation to 0–360 ──
  const normR = ((rotationY % 360) + 360) % 360;
  // Card shows back when rotation between 90–270 deg
  const showingBack = normR > 90 && normR < 270;

  // ── Holographic hue shifts based on rotation ──
  const hue1 = (normR * 2) % 360;
  const hue2 = (normR * 2 + 120) % 360;
  const hue3 = (normR * 2 + 240) % 360;
  // Light position across the border (0-100%)
  const lightPos = ((normR / 360) * 200) % 100;

  // ── Physics: momentum / inertia ──
  useEffect(() => {
    if (isDragging) return;
    if (Math.abs(velocity) < 0.3) {
      setVelocity(0);
      return;
    }

    let lastTs = performance.now();

    const tick = (ts: number) => {
      const dt = Math.min((ts - lastTs) / 16, 3); // normalised to ~60fps
      lastTs = ts;

      setRotationY((prev) => prev + velocity * dt);
      setVelocity((prev) => {
        const next = prev * (0.95 ** dt); // friction
        if (Math.abs(next) < 0.3) return 0;
        return next;
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isDragging, velocity]);

  // ── Pointer handlers (unified touch + mouse) ──
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only respond to primary pointer (touch or left mouse)
      if (e.button !== 0) return;
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setIsDragging(true);
      setVelocity(0);
      startXRef.current = e.clientX;
      lastXRef.current = e.clientX;
      lastTimeRef.current = performance.now();
      rotationAtStartRef.current = rotationY;
    },
    [rotationY],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      e.stopPropagation();

      const dx = e.clientX - startXRef.current;
      const containerWidth = containerRef.current?.offsetWidth ?? 200;
      // Full swipe across container = 180° rotation
      // Positive multiplier so dragging matches the scroll direction pattern
      const degreesPerPixel = 180 / containerWidth;
      const newRotation = rotationAtStartRef.current + dx * degreesPerPixel;

      setRotationY(newRotation);

      // Track velocity for momentum
      const now = performance.now();
      const dt = now - lastTimeRef.current;
      if (dt > 0) {
        const instantVelocity = ((e.clientX - lastXRef.current) * degreesPerPixel) / (dt / 16);
        setVelocity(instantVelocity);
      }
      lastXRef.current = e.clientX;
      lastTimeRef.current = now;
    },
    [isDragging],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      e.stopPropagation();
      setIsDragging(false);
    },
    [isDragging],
  );

  // ── Double-tap = auto-flip ──
  const lastTapRef = useRef(0);
  const handleDoubleTap = useCallback(
    (e: React.PointerEvent) => {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        e.stopPropagation();
        // Snap to either 0 or 180
        const target = showingBack ? 0 : 180;
        setRotationY(target);
        setVelocity(0);
      }
      lastTapRef.current = now;
    },
    [showingBack],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Only fire parent onClick if we didn't drag significantly
      const dist = Math.abs(rotationY - rotationAtStartRef.current);
      if (dist < 5 && onClick) {
        onClick(e);
      }
    },
    [onClick, rotationY],
  );

  // ── Scroll wheel = spin on PC ──
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      // Use deltaX (horizontal scroll) or fall back to deltaY (regular wheel)
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta === 0) return;
      e.stopPropagation();
      // Negative multiplier so scrolling right/down spins the card face to the right
      const degrees = delta * -0.3;
      setRotationY((prev) => prev + degrees);
      setVelocity(degrees * 0.5);
    },
    [],
  );

  // Holographic border gradient (the "shader" effect)
  const holoGradient = `linear-gradient(
    ${90 + normR}deg,
    hsla(${hue1}, 80%, 65%, 0.9) ${clamp(lightPos - 10, 0, 100)}%,
    hsla(${hue2}, 70%, 55%, 0.7) ${lightPos}%,
    hsla(${hue3}, 80%, 65%, 0.9) ${clamp(lightPos + 10, 0, 100)}%
  )`;

  const niceGradient = `linear-gradient(
    ${90 + normR}deg,
    rgba(59, 130, 246, 0.9) ${clamp(lightPos - 20, 0, 100)}%,
    rgba(255, 255, 255, 1) ${lightPos}%,
    rgba(59, 130, 246, 0.9) ${clamp(lightPos + 20, 0, 100)}%
  )`;

  const specialGradient = `linear-gradient(
    ${90 + normR}deg,
    rgba(220, 38, 38, 0.9) ${clamp(lightPos - 25, 0, 100)}%,
    rgba(255, 255, 255, 1) ${clamp(lightPos - 10, 0, 100)}%,
    rgba(250, 204, 21, 0.9) ${lightPos}%,
    rgba(220, 38, 38, 0.9) ${clamp(lightPos + 20, 0, 100)}%
  )`;

  const uiiiiiGradient = `linear-gradient(
    ${90 + normR}deg,
    rgba(34, 197, 94, 0.9) ${clamp(lightPos - 25, 0, 100)}%,
    rgba(255, 255, 255, 1) ${clamp(lightPos - 10, 0, 100)}%,
    rgba(74, 222, 128, 0.9) ${lightPos}%,
    rgba(255, 255, 255, 1) ${clamp(lightPos + 10, 0, 100)}%,
    rgba(34, 197, 94, 0.9) ${clamp(lightPos + 25, 0, 100)}%
  )`;

  // Glow intensity based on rotation speed
  const glowIntensity = clamp(Math.abs(velocity) * 3, 0, 40);

  // Check if it's a special rarity card type
  const isHoloCard = rarity?.toLowerCase() === "uiiiii" || rarity?.toLowerCase() === "unknown";
  const isNiceCard = rarity?.toLowerCase() === "nice";
  const isSpecialCard = rarity?.toLowerCase() === "special";
  
  const hasCustomGradient = isHoloCard || isNiceCard || isSpecialCard;

  // Standard cards should have a normal border
  let borderBackground = rarityColor;
  if (isHoloCard) borderBackground = holoGradient;
  else if (isNiceCard) borderBackground = niceGradient;
  else if (isSpecialCard) borderBackground = specialGradient;
  
  // Custom box-shadow based on rarity
  let borderBoxShadow = `
      0 0 ${8 + glowIntensity}px ${rarityColor},
      inset 0 0 ${4 + glowIntensity / 2}px ${rarityColor}
    `;

  if (isHoloCard) {
    borderBoxShadow = `
      0 0 ${8 + glowIntensity}px hsla(${hue1}, 80%, 65%, ${0.3 + glowIntensity / 100}),
      0 0 ${20 + glowIntensity}px hsla(${hue2}, 70%, 55%, ${0.15 + glowIntensity / 200}),
      inset 0 0 ${4 + glowIntensity / 2}px hsla(${hue3}, 80%, 65%, 0.2)
    `;
  } else if (isNiceCard) {
    borderBoxShadow = `
      0 0 ${8 + glowIntensity}px rgba(59, 130, 246, ${0.4 + glowIntensity / 100}),
      0 0 ${25 + glowIntensity * 1.5}px rgba(255, 255, 255, ${0.4 + glowIntensity / 150}),
      inset 0 0 ${4 + glowIntensity / 2}px rgba(59, 130, 246, 0.4)
    `;
  } else if (isSpecialCard) {
    borderBoxShadow = `
      0 0 ${8 + glowIntensity}px rgba(220, 38, 38, ${0.4 + glowIntensity / 100}),
      0 0 ${25 + glowIntensity * 1.5}px rgba(255, 255, 255, ${0.4 + glowIntensity / 150}),
      inset 0 0 ${8 + glowIntensity / 2}px rgba(250, 204, 21, 0.5)
    `;
  }

  return (
    <div
      ref={containerRef}
      className={`flippable-card-container ${isLandscape ? "is-landscape" : ""} ${className}`}
      style={{
        perspective: "1200px",
        touchAction: "pan-y",
        userSelect: "none",
        WebkitUserSelect: "none",
        cursor: isDragging ? "grabbing" : "grab",
        ...style,
      }}
      onPointerDown={(e) => {
        onPointerDown(e);
        handleDoubleTap(e);
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      onClick={handleClick}
    >
      {/* Holographic / Rarity border wrapper */}
      <div
        className="flippable-card-holo-border"
        style={{
          width: "100%",
          aspectRatio: aspect,
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `rotateY(${rotationY}deg)`,
          padding: "3px",
          borderRadius: "14px",
          background: borderBackground,
          boxShadow: borderBoxShadow,
          transition: isDragging || Math.abs(velocity) > 0.3 
            ? "none" 
            : "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease",
        }}
      >
        {/* 3D rotating card inner */}
        <div
          className="flippable-card-inner"
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            borderRadius: "12px",
          }}
        >
          {/* ─── Thick Edge Layers ─── */}
          {Array.from({ length: hasCustomGradient ? 8 : 6 }).map((_, i) => (
            <div
              key={`edge-${i}`}
              style={{
                position: "absolute",
                inset: hasCustomGradient ? "-3px" : "0",
                background: hasCustomGradient 
                  ? borderBackground 
                  : (i === 0 || i === 5 ? rarityColor : "#0f0020"),
                borderRadius: hasCustomGradient ? "14px" : "12px",
                transform: hasCustomGradient 
                  ? `translateZ(${-2.8 + i * 0.8}px)`
                  : `translateZ(${-2.5 + i}px)`,
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
                pointerEvents: "none",
              }}
            />
          ))}

          {/* ─── Card Front ─── */}
          <div
            className="flippable-card-face"
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              borderRadius: "12px",
              overflow: "hidden",
              transform: "translateZ(3px)",
            }}
          >
            <img
              src={frontSrc}
              alt={name}
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            {/* Light refraction overlay on front */}
            <div
              className="flippable-card-light-overlay"
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(
                  ${110 + normR * 0.5}deg,
                  transparent 30%,
                  hsla(${hue1}, 60%, 80%, ${clamp(0.03 + Math.abs(velocity) * 0.005, 0, 0.12)}) 50%,
                  transparent 70%
                )`,
                pointerEvents: "none",
                borderRadius: "12px",
              }}
            />
          </div>

          {/* ─── Card Back ─── */}
          <div
            className="flippable-card-face"
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg) translateZ(3px)",
              borderRadius: "12px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={backSrc}
              alt={`${name} (back)`}
              draggable={false}
              style={
                isLandscape
                  ? {
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: "63.636%", // 560 / 880
                      height: "157.142%", // 880 / 560
                      objectFit: "cover",
                      transform: "translate(-50%, -50%) rotate(-90deg)",
                    }
                  : {
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }
              }
            />
            {/* Light refraction overlay on back */}
            <div
              className="flippable-card-light-overlay"
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(
                  ${250 + normR * 0.5}deg,
                  transparent 30%,
                  hsla(${hue2}, 60%, 80%, ${clamp(0.04 + Math.abs(velocity) * 0.005, 0, 0.15)}) 50%,
                  transparent 70%
                )`,
                pointerEvents: "none",
                borderRadius: "12px",
              }}
            />
          </div>
        </div>
      </div>

      {/* Spin hint */}
      <div
        className="flippable-card-hint"
        style={{
          textAlign: "center",
          marginTop: "10px",
          fontSize: "11px",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)",
          fontWeight: 600,
          transition: "opacity 0.3s",
          opacity: isDragging || Math.abs(velocity) > 1 ? 0 : 1,
        }}
      >
        ↔
      </div>
    </div>
  );
}
