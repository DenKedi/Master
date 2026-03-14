"use client";

import { useEffect, useState, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { BattleCard } from "@/lib/battle/types";
import FlippableCard from "@/components/ui/FlippableCard";
import { RENDER_V } from "@/lib/renderVersion";
import { RARITY_COLORS } from "@/lib/rarityColors";

export interface CardDrawAnimationOverlayProps {
  card: BattleCard;
  /** The uid, used to find the target slot in hand */
  cardUid: string;
  onAnimationComplete: () => void;
}

export default function CardDrawAnimationOverlay({
  card,
  cardUid,
  onAnimationComplete,
}: CardDrawAnimationOverlayProps) {
  const [stage, setStage] = useState<"initial" | "center" | "flipping" | "interactive" | "returning" | "done">("initial");
  
  // Positional state
  const [pos, setPos] = useState({ x: 0, y: 0, width: 144, height: 200, rotationY: 0, rotationZ: 0, scale: 1 });
  const [mounted, setMounted] = useState(false);

  // We need to keep track of starting and target bounds
  const startRectRef = useRef<DOMRect | null>(null);

  useLayoutEffect(() => {
    setMounted(true);
    
    // Find initial position (deck pile)
    const deckEl = document.getElementById("battle2-deck-pile");
    const isDestinationCard = card.type === "destination";
    if (deckEl) {
      const rect = deckEl.getBoundingClientRect();
      startRectRef.current = rect;
      setPos({
        x: rect.left + rect.width / 2, // Centered
        y: rect.top + rect.height / 2, // Centered
        width: 144,
        height: 200,
        rotationY: 180, // Back facing
        rotationZ: isDestinationCard ? 90 : 0, // Destination cards start upright
        scale: 1,
      });
    }

    // Small delay to ensure render, then move to center
    const timer1 = setTimeout(() => {
      setStage("center");
      
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      // Target center position
      // Using a larger width/height instead of CSS scale multiplier prevents the 3D layers 
      // in FlippableCard from translating out excessively (translateZ scales with transform scale)
      
      const isDestination = card.type === "destination";
      const targetWidth = isDestination ? 640 : 280;
      const targetHeight = isDestination ? 406 : 388; // maintains aspect ratio
      
      setPos(prev => ({
        ...prev,
        x: vw / 2,
        y: vh / 2,
        width: targetWidth,
        height: targetHeight,
        rotationZ: 0, // Rotate destination card from upright (90°) to landscape (0°) during flight
        scale: 1, 
      }));
    }, 50);

    const timer2 = setTimeout(() => {
      setStage("flipping");
      setPos(prev => ({ ...prev, rotationY: 0 }));
    }, 600); // After it reaches center

    const timer3 = setTimeout(() => {
      setStage("interactive");
    }, 1200); // 600ms flight + 600ms flip

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handleClose = () => {
    if (stage !== "interactive") return;
    
    setStage("returning");
    
    // Find target slot
    const slotEl = document.getElementById(`hand-card-slot-${cardUid}`);
    if (slotEl) {
      const rect = slotEl.getBoundingClientRect();
      const isDestination = card.type === "destination";
      const targetWidth = isDestination ? 180 : 144;
      const targetHeight = isDestination ? 114 : 200;
      
      setPos({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: targetWidth,
        height: targetHeight,
        rotationY: 0,
        rotationZ: isDestination ? 90 : 0,
        scale: 1,
      });
    } else {
      // Fallback: move off screen bottom
      setPos(p => ({ ...p, y: window.innerHeight + 200, scale: 1 }));
    }

    setTimeout(() => {
      setStage("done");
      onAnimationComplete();
    }, 600); // Duration of return flight
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div 
      className={`fixed inset-0 z-[100] transition-colors duration-500 ${stage === 'center' || stage === 'flipping' || stage === 'interactive' ? 'bg-black/80 pointer-events-auto' : 'bg-transparent pointer-events-none'}`}
      onClick={handleBackdropClick}
    >
      <div 
        className={`absolute top-0 left-0 transition-all duration-500 origin-center ${stage === 'returning' ? 'ease-out' : 'ease-[cubic-bezier(0.34,1.56,0.64,1)]'}`}
        style={{
          width: pos.width,
          height: pos.height,
          transform: `translate(${pos.x - pos.width / 2}px, ${pos.y - pos.height / 2}px) rotate(${pos.rotationZ}deg) scale(${pos.scale})`,
        }}
      >
        <div className="w-full h-full">
          <div className="w-full h-full relative">
            {/* Fully 3D rendered card doing its own flip */}
            {stage !== 'initial' && (
              <div 
                className="w-full h-full" 
                style={{ 
                  pointerEvents: stage === 'interactive' ? 'auto' : 'none'
                }}
              >
                <FlippableCard
                   frontSrc={`/api/cards/render/${encodeURIComponent(card.cardId || card.name)}?atk=${card.attack}&def=${card.defense}&v=${RENDER_V}`}
                   backSrc="/card-back.webp"
                   name={card.name}
                   rarity={card.rarity}
                   rarityColor={RARITY_COLORS[card.rarity] ?? "#9ca3af"}
                   cardType={card.type as any}
                   externalRotationY={pos.rotationY}
                   onClick={handleClose}
                />
              </div>
            )}
            
            {/* Fallback back-only image before the actual 3D card mounts or begins flip */}
            {stage === 'initial' && (
              <div 
                className="absolute inset-0 rounded-[14px] border border-[var(--border-gold)]" 
                style={{ 
                  backgroundImage: 'url(/card-back.webp)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                }}
              />
            )}
          </div>
        </div>
      </div>
      
      {stage === 'interactive' && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 text-sm tracking-widest uppercase animate-pulse">
          Click anywhere to continue
        </div>
      )}
    </div>,
    document.body
  );
}
