/**
 * Satori-compatible JSX templates for rendering card images.
 * Uses only inline styles (Satori does not support Tailwind/CSS classes).
 *
 * Portrait (default): 512 × 880 px — art area 512×680 (~3:4).
 * Landscape (destination): 880 × 560 px — info 880×168 (top), art area 880×392 (bottom).
 */

import type { ReactElement } from "react";

export interface CardRenderData {
  cardId?: string;
  name: string;
  description: string;
  type: "character" | "arsenal" | "destination" | "trick";
  imageUrl: string;
  attack: number;
  defense: number;
  rarity: string;
  characterType?: string;
  comboSource?: { characterName: string; arsenalName: string };
  effects?: { description: string }[];
}

const WIDTH = 512;
const HEIGHT = 880;
const ART_HEIGHT = 620;

// Landscape destination card dimensions
export const L_WIDTH = 880;
export const L_HEIGHT = 560;
const L_ART_HEIGHT = 392;

const RARITY_COLORS: Record<string, string> = {
  normal: "#6b7280",
  nice: "#3b82f6",
  special: "#ef4444",
  uiiiii: "#22c55e",
  unknown: "#a855f7",
};

const TYPE_COLORS: Record<string, string> = {
  character: "rgba(200,150,42,0.35)",
  arsenal: "rgba(59,130,246,0.35)",
  destination: "rgba(34,197,94,0.35)",
  trick: "rgba(168,85,247,0.35)",
};

/** Paths under /public/icons/types/ — provide .png files at these names */
const TYPE_ICON_PATHS: Record<string, string> = {
  character: "/icons/types/character.png",
  arsenal: "/icons/types/arsenal.png",
  destination: "/icons/types/destination.png",
  trick: "/icons/types/trick.png",
};

/** Paths under /public/icons/character-types/ — provide .png files at these names */
const CHARACTER_TYPE_ICON_PATHS: Record<string, string> = {
  human: "/icons/character-types/human.png",
  goblin: "/icons/character-types/goblin.png",
  beast: "/icons/character-types/beast.png",
  underworld: "/icons/character-types/underworld.png",
};

/** Resolve an icon path to an absolute src — uses pre-resolved data URIs when available, otherwise baseUrl prefix. */
function resolveIcon(path: string, baseUrl: string, iconMap?: Record<string, string>): string {
  if (iconMap?.[path]) return iconMap[path];
  return `${baseUrl}${path}`;
}

function TypeIcon({ type, size, baseUrl, iconMap }: { type: string; size: number; baseUrl: string; iconMap?: Record<string, string> }) {
  const path = TYPE_ICON_PATHS[type];
  if (!path) return null;
  return (
    <img
      src={resolveIcon(path, baseUrl, iconMap)}
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  );
}

function CharTypeIcon({ charType, size, baseUrl, iconMap }: { charType: string; size: number; baseUrl: string; iconMap?: Record<string, string> }) {
  const path = CHARACTER_TYPE_ICON_PATHS[charType];
  if (!path) return null;
  return (
    <img
      src={resolveIcon(path, baseUrl, iconMap)}
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  );
}

export default function CardTemplate(props: {
  card: CardRenderData;
  baseUrl?: string;
  iconMap?: Record<string, string>;
}): ReactElement {
  const { card, baseUrl = "", iconMap } = props;
  const isHolo = card.rarity === "uiiiii" || card.rarity === "unknown";
  const rarityColor = isHolo ? "transparent" : (RARITY_COLORS[card.rarity] ?? RARITY_COLORS.normal);
  const typeColor = TYPE_COLORS[card.type] ?? TYPE_COLORS.character;
  const isCombo = !!card.comboSource;
  const hasCombatStats = card.type === "character" || card.type === "arsenal";
  const hasImage = !!card.imageUrl;
  const imageUrl = hasImage
    ? card.imageUrl.startsWith("http") || card.imageUrl.startsWith("data:")
      ? card.imageUrl
      : `${baseUrl}${card.imageUrl}`
    : "";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: WIDTH,
        height: HEIGHT,
        borderRadius: 16,
        border: `4px solid #000000`,
        overflow: "hidden",
        background: "linear-gradient(160deg, #0f0020, #080012)",
        position: "relative",
        fontFamily: "Rajdhani, sans-serif",
      }}
    >
      {/* ── Art area (top ~77%, portrait 3:4) ── */}
      <div
        style={{
          display: "flex",
          width: WIDTH,
          height: ART_HEIGHT,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {hasImage ? (
          <img
            src={imageUrl}
            width={WIDTH}
            height={ART_HEIGHT}
            style={{
              objectFit: "cover",
              objectPosition: "center top",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              background: `linear-gradient(135deg, #1a0030, ${typeColor})`,
              fontSize: 80,
            }}
          >
            <TypeIcon type={card.type} size={80} baseUrl={baseUrl} iconMap={iconMap} />
          </div>
        )}

        {/* Vignette fade at bottom of art */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: 140,
            background:
              "linear-gradient(to top, #080012 0%, rgba(8,0,18,0.85) 40%, transparent 100%)",
          }}
        />

        {/* Type tint overlay */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            inset: "0",
            background: typeColor,
            opacity: 0.15,
          }}
        />

        {/* Card type icon — top-left */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 12,
            left: 12,
            filter: "drop-shadow(0 0 8px rgba(0,0,0,0.7))",
          }}
        >
          <TypeIcon type={card.type} size={52} baseUrl={baseUrl} iconMap={iconMap} />
        </div>

        {/* Character type icon — top-right */}
        {card.characterType && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 12,
              right: 12,
              filter: "drop-shadow(0 0 8px rgba(0,0,0,0.7))",
            }}
          >
            <CharTypeIcon charType={card.characterType} size={52} baseUrl={baseUrl} iconMap={iconMap} />
          </div>
        )}

        {/* COMBO badge */}
        {isCombo && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 12,
              left: 72,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              padding: "3px 10px",
              borderRadius: 6,
              background: "rgba(168,85,247,0.35)",
              border: "1px solid rgba(168,85,247,0.7)",
              color: "#d8b4fe",
              fontFamily: "Cinzel, serif",
            }}
          >
            COMBO
          </div>
        )}
      </div>

      {/* ── Info panel (bottom ~40%) ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "12px 20px 16px",
          gap: 6,
          position: "relative",
        }}
      >
        {/* Type row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 16,
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase" as const,
            letterSpacing: "0.15em",
            fontWeight: 700,
          }}
        >
          <TypeIcon type={card.type} size={18} baseUrl={baseUrl} iconMap={iconMap} />
          <span>{card.type}</span>
        </div>

        {/* Card name */}
        <div
          style={{
            display: "flex",
            fontFamily: "Cinzel, serif",
            fontSize: 30,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
            lineHeight: 1.2,
            textShadow: `0 0 20px ${rarityColor}`,
          }}
        >
          {card.name}
        </div>

        {/* Description */}
        {card.description && (
          <div
            style={{
              display: "flex",
              fontSize: 18,
              fontWeight: 600,
              color: "rgba(255,255,255,0.55)",
              fontStyle: "italic",
              lineHeight: 1.4,
              overflow: "hidden",
            }}
          >
            {card.description}
          </div>
        )}

        {/* Effect text for destination/trick */}
        {(card.type === "destination" || card.type === "trick") &&
          card.effects &&
          card.effects.length > 0 && (
            <div
              style={{
                display: "flex",
                fontSize: 17,
                fontWeight: 600,
                color: "rgba(200,150,42,0.8)",
                lineHeight: 1.35,
                overflow: "hidden",
              }}
            >
              {card.effects[0].description}
            </div>
          )}

        {/* Spacer */}
        <div style={{ display: "flex", flex: 1 }} />

        {/* Stats bar */}
        {hasCombatStats && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 0 0",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 32,
                fontWeight: 800,
                color: "#ef4444",
                fontFamily: "Cinzel, serif",
                textShadow: "0 0 12px rgba(239,68,68,0.5)",
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1, opacity: 0.8 }}>ATK</span>
              {card.attack}
            </div>
            {/* Master of Masters logo — centered between ATK / DEF */}
            <img
              src={resolveIcon("/Master-of-Masters-Logo.png", baseUrl, iconMap)}
              width={90}
              height={36}
              style={{ objectFit: "contain", opacity: 0.75 }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 32,
                fontWeight: 800,
                color: "#3b82f6",
                fontFamily: "Cinzel, serif",
                textShadow: "0 0 12px rgba(59,130,246,0.5)",
              }}
            >
              {card.defense}
              <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1, opacity: 0.8 }}>DEF</span>
            </div>
          </div>
        )}
        {/* Logo bar for non-combat cards */}
        {!hasCombatStats && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "8px 0 0",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <img
              src={resolveIcon("/Master-of-Masters-Logo.png", baseUrl, iconMap)}
              width={110}
              height={44}
              style={{ objectFit: "contain", opacity: 0.75 }}
            />
          </div>
        )}
      </div>

      {/* ── Inner border shimmer ── */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          inset: "0",
          borderRadius: 14,
          border: `1px solid rgba(255,255,255,0.06)`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Landscape card template — used for destination cards.
 *  880 × 560 px. Info top 30% (168px), art bottom 70% (392px).
 * ═══════════════════════════════════════════════════════════════════════════ */

export function CardTemplateLandscape(props: {
  card: CardRenderData;
  baseUrl?: string;
  iconMap?: Record<string, string>;
}): ReactElement {
  const { card, baseUrl = "", iconMap } = props;
  const isHolo = card.rarity === "uiiiii" || card.rarity === "unknown";
  const rarityColor = isHolo ? "transparent" : (RARITY_COLORS[card.rarity] ?? RARITY_COLORS.normal);
  const typeColor = TYPE_COLORS[card.type] ?? TYPE_COLORS.destination;
  const hasImage = !!card.imageUrl;
  const imageUrl = hasImage
    ? card.imageUrl.startsWith("http") || card.imageUrl.startsWith("data:")
      ? card.imageUrl
      : `${baseUrl}${card.imageUrl}`
    : "";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: L_WIDTH,
        height: L_HEIGHT,
        borderRadius: 16,
        border: `4px solid ${rarityColor}`,
        overflow: "hidden",
        background: "linear-gradient(160deg, #0f0020, #080012)",
        position: "relative",
        fontFamily: "Rajdhani, sans-serif",
        flexDirection: "column-reverse",
      }}
    >
      {/* ── Art area (bottom 70%) ── */}
      <div
        style={{
          display: "flex",
          width: L_WIDTH,
          height: L_ART_HEIGHT,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {hasImage ? (
          <img
            src={imageUrl}
            width={L_WIDTH}
            height={L_ART_HEIGHT}
            style={{
              objectFit: "cover",
              objectPosition: "center center",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              background: `linear-gradient(135deg, #1a0030, ${typeColor})`,
              fontSize: 80,
            }}
          >
            <TypeIcon type={card.type} size={80} baseUrl={baseUrl} iconMap={iconMap} />
          </div>
        )}

        {/* Vignette fade at top of art */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 120,
            background:
              "linear-gradient(to bottom, #080012 0%, rgba(8,0,18,0.85) 40%, transparent 100%)",
          }}
        />

        {/* Type tint overlay */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            inset: "0",
            background: typeColor,
            opacity: 0.15,
          }}
        />

      </div>

      {/* Type icon — top-right corner */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 12,
          right: 12,
          filter: "drop-shadow(0 0 8px rgba(0,0,0,0.7))",
        }}
      >
        <TypeIcon type={card.type} size={48} baseUrl={baseUrl} iconMap={iconMap} />
      </div>

      {/* ── Info panel (top 30%) ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "10px 24px 14px",
          gap: 4,
          position: "relative",
        }}
      >
        {/* Type row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 16,
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase" as const,
            letterSpacing: "0.15em",
            fontWeight: 700,
          }}
        >
          <TypeIcon type={card.type} size={18} baseUrl={baseUrl} iconMap={iconMap} />
          <span>{card.type}</span>
        </div>

        {/* Card name */}
        <div
          style={{
            display: "flex",
            fontFamily: "Cinzel, serif",
            fontSize: 28,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
            lineHeight: 1.2,
            textShadow: `0 0 20px ${rarityColor}`,
          }}
        >
          {card.name}
        </div>

        {/* Description */}
        {card.description && (
          <div
            style={{
              display: "flex",
              fontSize: 16,
              fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
              fontStyle: "italic",
              lineHeight: 1.3,
              maxHeight: 42,
              overflow: "hidden",
            }}
          >
            {card.description}
          </div>
        )}

        {/* Effect text */}
        {card.effects && card.effects.length > 0 && (
          <div
            style={{
              display: "flex",
              fontSize: 15,
              fontWeight: 600,
              color: "rgba(200,150,42,0.8)",
              lineHeight: 1.3,
              maxHeight: 40,
              overflow: "hidden",
            }}
          >
            {card.effects[0].description}
          </div>
        )}
      </div>

      {/* Master of Masters logo — bottom center */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: 12,
          left: 0,
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <img
          src={resolveIcon("/Master-of-Masters-Logo.png", baseUrl, iconMap)}
          width={110}
          height={44}
          style={{ objectFit: "contain", opacity: 0.75 }}
        />
      </div>

      {/* ── Inner border shimmer ── */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          inset: "0",
          borderRadius: 14,
          border: `1px solid rgba(255,255,255,0.06)`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
