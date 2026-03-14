"use client";

import React from "react";
import Image from "next/image";

export type ArmoryItemType = "pack" | "card" | "sleeve";

export interface ArmoryPanelProps {
  id: string;
  name: string;
  typeLabel: string;
  itemType: ArmoryItemType;
  price: number;
  rarity: "normal" | "nice" | "special" | "uiiiii" | "unknown" | "none" | string;
  imageUrl?: string;
  onClick: (id: string, type: ArmoryItemType) => void;
  onBuy?: (id: string) => void;
  owned?: boolean;
  disabled?: boolean;
}

const RARITY_COLORS: Record<string, { border: string; glow: string }> = {
  normal: { border: "border-gray-400", glow: "hover:shadow-[0_0_15px_rgba(156,163,175,0.4)]" },
  nice: { border: "border-blue-400", glow: "hover:shadow-[0_0_15px_rgba(96,165,250,0.4)]" },
  special: { border: "border-red-400", glow: "hover:shadow-[0_0_15px_rgba(248,113,113,0.4)]" },
  uiiiii: { border: "border-green-400", glow: "hover:shadow-[0_0_15px_rgba(74,222,128,0.4)]" },
  unknown: { border: "border-purple-400", glow: "hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]" },
  none: { border: "border-[var(--gold)]", glow: "hover:shadow-[0_0_15px_rgba(200,150,42,0.4)]" },
};

const RARITY_BADGE: Record<string, { label: string; className: string }> = {
  normal:  { label: "Normal",  className: "bg-gray-600/70 text-gray-200" },
  nice:    { label: "Nice",    className: "bg-blue-700/70 text-blue-200" },
  special: { label: "Special", className: "bg-red-700/70 text-red-200" },
  uiiiii:  { label: "UIIIII",  className: "bg-green-700/70 text-green-200" },
  unknown: { label: "Unknown", className: "bg-purple-700/70 text-purple-200" },
  none:    { label: "–",       className: "bg-yellow-800/60 text-yellow-300" },
};

export default function ArmoryPanel({
  id,
  name,
  typeLabel,
  itemType,
  price,
  rarity,
  imageUrl,
  onClick,
  onBuy,
  owned,
  disabled
}: ArmoryPanelProps) {
  const rarityStyle = RARITY_COLORS[rarity.toLowerCase()] || RARITY_COLORS.none;
  const rarityBadge = RARITY_BADGE[rarity.toLowerCase()] || RARITY_BADGE.none;

  return (
    <div
      onClick={() => !disabled && onClick(id, itemType)}
      className={`
        relative overflow-hidden cursor-pointer group flex flex-col justify-between 
        aspect-[3/4] rounded-xl border ${rarityStyle.border} bg-[#0f0020]
        transition-all duration-300 card-lift
        ${rarityStyle.glow}
        ${disabled ? "opacity-50 grayscale cursor-not-allowed" : ""}
      `}
      style={{
        clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))"
      }}
    >
      {/* Owned overlay badge */}
      {owned && (
        <div className="absolute top-2 right-2 z-40 bg-green-600/90 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full pointer-events-none">
          Owned
        </div>
      )}

      {/* Background Gradient / Inset */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 pointer-events-none z-10" />

      {/* Main Asset Area */}
      <div className="flex-grow flex items-center justify-center p-4 relative z-0">
        {imageUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className={`object-contain transition-transform duration-300 group-hover:scale-105 ${itemType === 'sleeve' ? 'object-cover rounded-lg' : ''}`}
            />
          </div>
        ) : (
          <div className="text-gray-500 italic text-sm">No Asset</div>
        )}
      </div>

      {/* Info Bar at Bottom */}
      <div className="relative z-20 p-3 flex flex-col gap-1 border-t border-white/10 bg-black/60">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider truncate">
            {typeLabel}
          </p>
          <span className={`shrink-0 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${rarityBadge.className}`}>
            {rarityBadge.label}
          </span>
        </div>
        <p className="text-sm text-white font-bold truncate" title={name}>
          {name}
        </p>
        <div className="flex items-center gap-1 mt-1 text-[var(--gold-bright)]">
          <span className="text-xs">🪙</span>
          <span className="font-bold text-sm">{price}</span>
        </div>

        {onBuy && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!owned && !disabled) onBuy(id);
            }}
            disabled={owned || disabled}
            className={`w-full mt-2 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
              owned
                ? "bg-green-900/60 text-green-400 cursor-not-allowed"
                : "bg-[var(--gold)] hover:bg-[var(--gold-bright)] text-black cursor-pointer"
            }`}
          >
            {owned ? "✓ Owned" : "Buy"}
          </button>
        )}
      </div>

      {/* Hover Highlight */}
      <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/20 rounded-xl transition-colors z-30 pointer-events-none" />
    </div>
  );
}
