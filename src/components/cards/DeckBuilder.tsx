"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";

import FlippableCard from "@/components/ui/FlippableCard";
import type { CardType, CardRarity, CharacterType } from "@/types";
import { RENDER_V } from "@/lib/renderVersion";
import { RARITY_COLORS } from "@/lib/rarityColors";

/* ═══════════════════════════════════════════════════════════════════════════
 *  DeckBuilder — Build / edit a 20-card deck from your collection.
 *
 *  Left pane:  collection cards (filterable)      → click to add
 *  Right pane: current deck contents              → click to remove
 *  Bottom bar: deck name, save/cancel, validation
 * ═══════════════════════════════════════════════════════════════════════════ */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CollectionCard {
  _id: string;
  cardId: string;
  name: string;
  description: string;
  rarity: CardRarity;
  type: CardType;
  imageUrl: string;
  attack: number;
  defense: number;
  effect?: string;
  characterType?: CharacterType;
}

export interface CollectionEntry {
  _id: string;
  quantity: number;
  cardId: CollectionCard;
}

export interface DeckData {
  _id?: string;
  name: string;
  cards: CollectionCard[];
  isActive: boolean;
}

interface DeckBuilderProps {
  /** All collection entries the player owns */
  collection: CollectionEntry[];
  /** Existing deck to edit (null = create new) */
  deck: DeckData | null;
  /** Maximum deck size */
  deckSize: number;
  /** Minimum deck size */
  minDeckSize?: number;
  onSave: (name: string, cardIds: string[], isActive: boolean) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ReactNode> = {
  character: <Image src="/icons/types/character.png" alt="Character" width={16} height={16} className="inline-block" />,
  arsenal: <Image src="/icons/types/arsenal.png" alt="Arsenal" width={16} height={16} className="inline-block" />,
  destination: <Image src="/icons/types/destination.png" alt="Destination" width={16} height={16} className="inline-block" />,
  trick: <Image src="/icons/types/trick.png" alt="Trick" width={16} height={16} className="inline-block" />,
};

const CHARACTER_TYPE_ICONS: Record<string, React.ReactNode> = {
  human: <Image src="/icons/character-types/human.png" alt="Human" width={16} height={16} className="inline-block" />,
  goblin: <Image src="/icons/character-types/goblin.png" alt="Goblin" width={16} height={16} className="inline-block" />,
  beast: <Image src="/icons/character-types/beast.png" alt="Beast" width={16} height={16} className="inline-block" />,
  underworld: <Image src="/icons/character-types/underworld.png" alt="Underworld" width={16} height={16} className="inline-block" />,
};

const RARITY_ORDER: Record<string, number> = {
  unknown: 5,
  uiiiii: 4,
  special: 3,
  nice: 2,
  normal: 1,
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function DeckBuilder({
  collection,
  deck,
  deckSize,
  minDeckSize = deckSize,
  onSave,
  onCancel,
  onDelete,
}: DeckBuilderProps) {
  const [deckName, setDeckName] = useState(deck?.name ?? "");
  const [deckCards, setDeckCards] = useState<CollectionCard[]>(deck?.cards ?? []);
  const [isActive, setIsActive] = useState(deck?.isActive ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<CardType | "all">("all");
  const [rarityFilter, setRarityFilter] = useState<CardRarity | "all">("all");
  const [characterTypeFilter, setCharacterTypeFilter] = useState<CharacterType | "all">("all");
  const [search, setSearch] = useState("");

  // Preview state
  const [previewCard, setPreviewCard] = useState<CollectionCard | null>(null);
  const [previewSource, setPreviewSource] = useState<"collection" | "deck">("collection");
  const [previewDeckIdx, setPreviewDeckIdx] = useState(-1);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [mobileIdx, setMobileIdx] = useState(0);
  const [hasHover, setHasHover] = useState(true);

  useEffect(() => {
    setHasHover(window.matchMedia("(hover: hover)").matches);
  }, []);

  // Count how many of each card are currently in the deck
  const deckCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of deckCards) {
      map.set(c._id, (map.get(c._id) || 0) + 1);
    }
    return map;
  }, [deckCards]);

  // Available cards: collection minus what's already in deck (respecting quantities)
  const availableCards = useMemo(() => {
    return collection
      .filter((e) => {
        if (!e.cardId) return false;
        const inDeck = deckCounts.get(e.cardId._id) ?? 0;
        if (inDeck >= e.quantity) return false;
        if (typeFilter !== "all" && e.cardId.type !== typeFilter) return false;
        if (rarityFilter !== "all" && e.cardId.rarity !== rarityFilter) return false;
        if (characterTypeFilter !== "all" && e.cardId.characterType !== characterTypeFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            e.cardId.name.toLowerCase().includes(q) ||
            e.cardId.type.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .map((e) => ({
        card: e.cardId,
        remaining: e.quantity - (deckCounts.get(e.cardId._id) ?? 0),
      }))
      .sort((a, b) => {
        const rarityA = RARITY_ORDER[a.card.rarity || "normal"] || 0;
        const rarityB = RARITY_ORDER[b.card.rarity || "normal"] || 0;
        if (rarityA !== rarityB) {
          return rarityB - rarityA;
        }
        return a.card.name.localeCompare(b.card.name);
      });
  }, [collection, deckCounts, typeFilter, rarityFilter, characterTypeFilter, search]);

  // Deck composition stats
  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const c of deckCards) {
      byType[c.type] = (byType[c.type] || 0) + 1;
    }
    return byType;
  }, [deckCards]);

  const isFull = deckCards.length >= deckSize;
  const isValid = deckCards.length >= minDeckSize && deckCards.length <= deckSize && deckName.trim().length > 0;

  const addCard = useCallback(
    (card: CollectionCard) => {
      if (isFull) return;
      setDeckCards((prev) => [...prev, card]);
      setError(null);
    },
    [isFull],
  );

  const removeCard = useCallback((index: number) => {
    setDeckCards((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  const handleCollectionClick = useCallback(
    (card: CollectionCard, idx: number) => {
      if (!hasHover) {
        setPreviewCard(card);
        setPreviewSource("collection");
        setMobileIdx(idx);
        setMobilePreview(true);
      } else {
        addCard(card);
      }
    },
    [hasHover, addCard],
  );

  const handleDeckClick = useCallback(
    (card: CollectionCard, idx: number) => {
      if (!hasHover) {
        setPreviewCard(card);
        setPreviewSource("deck");
        setPreviewDeckIdx(idx);
        setMobileIdx(idx);
        setMobilePreview(true);
      } else {
        removeCard(idx);
      }
    },
    [hasHover, removeCard],
  );

  const cycleMobilePreview = useCallback(
    (dir: -1 | 1) => {
      if (previewSource === "collection") {
        const len = availableCards.length;
        if (len === 0) return;
        const next = (mobileIdx + dir + len) % len;
        setMobileIdx(next);
        setPreviewCard(availableCards[next].card);
      } else {
        const len = deckCards.length;
        if (len === 0) return;
        const next = (mobileIdx + dir + len) % len;
        setMobileIdx(next);
        setPreviewDeckIdx(next);
        setPreviewCard(deckCards[next]);
      }
    },
    [previewSource, availableCards, deckCards, mobileIdx],
  );

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(
        deckName.trim(),
        deckCards.map((c) => c._id),
        isActive,
      );
    } catch (e: any) {
      setError(e?.message ?? "Failed to save deck");
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full gap-4 animate-slide-up">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div
            className="text-xs tracking-[0.3em] uppercase mb-1"
            style={{ color: "var(--gold)" }}
          >
            ✦ {deck ? "Edit Deck" : "New Deck"} ✦
          </div>
          <input
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="Deck Name..."
            maxLength={40}
            className="input-game text-lg font-display font-bold tracking-wider"
            style={{ maxWidth: 300 }}
          />
        </div>
        <div className="flex items-center gap-3">
          <label
            className="flex items-center gap-2 text-xs cursor-pointer select-none"
            style={{ color: isActive ? "var(--gold-bright)" : "var(--text-muted)" }}
          >
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-yellow-500"
            />
            Active Deck
          </label>
          {deck && onDelete && (
            <button
              onClick={onDelete}
              className="btn-game px-3 py-1.5 text-xs"
              style={{ color: "var(--crimson)" }}
            >
              🗑️ Delete
            </button>
          )}
          <button
            onClick={onCancel}
            className="btn-game btn-game-arcane px-3 py-1.5 text-xs"
          >
            ✕ Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="btn-game btn-game-crimson px-4 py-1.5 text-xs"
          >
            {saving ? "Saving..." : "✦ Save Deck"}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="px-3 py-2 rounded text-sm"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
        >
          {error}
        </div>
      )}

      {/* ── Deck Stats Bar ── */}
      <div
        className="flex items-center gap-4 px-4 py-2 rounded-lg text-xs font-bold tracking-wider"
        style={{
          background: "rgba(15,0,32,0.8)",
          border: `1px solid ${isValid ? "rgba(34,197,94,0.3)" : "rgba(200,150,42,0.2)"}`,
        }}
      >
        <span
          style={{
            color: deckCards.length >= minDeckSize ? "#4ade80" : "var(--gold)",
          }}
        >
          {deckCards.length}/{deckSize} Cards
        </span>
        <span className="h-3 w-px" style={{ background: "rgba(255,255,255,0.1)" }} />
        {(["character", "arsenal", "destination", "trick"] as const).map((t) => (
          <span key={t} style={{ color: "var(--text-muted)" }}>
            {TYPE_ICONS[t]} {stats[t] ?? 0}
          </span>
        ))}
        {/* Progress bar */}
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(deckCards.length / deckSize) * 100}%`,
              background: deckCards.length === deckSize
                ? "linear-gradient(90deg, #22c55e, #4ade80)"
                : "linear-gradient(90deg, var(--gold-dim), var(--gold))",
            }}
          />
        </div>
      </div>

      {/* ── Main Content: Collection | Preview | Deck ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_240px_280px] gap-4 min-h-0 overflow-hidden">
        {/* Left: Available Cards */}
        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex flex-col gap-1.5">
            {/* Search + Type row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                Collection
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="input-game text-xs py-1 px-2"
                style={{ maxWidth: 180 }}
              />
              {(["all", "character", "arsenal", "destination", "trick"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTypeFilter(t);
                    if (t !== "all" && t !== "character") setCharacterTypeFilter("all");
                  }}
                  className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all"
                  style={{
                    color: typeFilter === t ? "#fff" : "var(--text-muted)",
                    background: typeFilter === t ? "rgba(200,150,42,0.15)" : "transparent",
                    border: `1px solid ${typeFilter === t ? "var(--border-gold)" : "rgba(255,255,255,0.05)"}`,
                  }}
                >
                  {t === "all" ? "All" : <>{TYPE_ICONS[t]} {t}</>}
                </button>
              ))}
            </div>

            {/* Rarity row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="text-[10px] font-bold tracking-widest uppercase mr-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                Rarity
              </span>
              {(["all", "normal", "nice", "special", "uiiiii", "unknown"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRarityFilter(r)}
                  className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all"
                  style={{
                    color: rarityFilter === r ? "#fff" : RARITY_COLORS[r],
                    background: rarityFilter === r ? `${RARITY_COLORS[r]}22` : "transparent",
                    border: `1px solid ${rarityFilter === r ? RARITY_COLORS[r] : "rgba(255,255,255,0.05)"}`,
                  }}
                >
                  {r === "all" ? "All" : r === "unknown" ? "?" : r}
                </button>
              ))}
            </div>

            {/* Character type row (only when type is all or character) */}
            {(typeFilter === "all" || typeFilter === "character") && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="text-[10px] font-bold tracking-widest uppercase mr-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  Species
                </span>
                <button
                  onClick={() => setCharacterTypeFilter("all")}
                  className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all"
                  style={{
                    color: characterTypeFilter === "all" ? "#fff" : "var(--text-muted)",
                    background: characterTypeFilter === "all" ? "rgba(200,150,42,0.15)" : "transparent",
                    border: `1px solid ${characterTypeFilter === "all" ? "var(--border-gold)" : "rgba(255,255,255,0.05)"}`,
                  }}
                >
                  All
                </button>
                {(["human", "goblin", "beast", "underworld"] as const).map((ct) => (
                  <button
                    key={ct}
                    onClick={() => setCharacterTypeFilter(ct)}
                    className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all"
                    style={{
                      color: characterTypeFilter === ct ? "#fff" : "var(--text-muted)",
                      background: characterTypeFilter === ct ? "rgba(200,150,42,0.15)" : "transparent",
                      border: `1px solid ${characterTypeFilter === ct ? "var(--border-gold)" : "rgba(255,255,255,0.05)"}`,
                    }}
                  >
                    {CHARACTER_TYPE_ICONS[ct]} {ct}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-3 sm:grid-cols-4 gap-2 content-start">
            {availableCards.length === 0 ? (
              <div
                className="col-span-full text-center py-8 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                {deckCards.length >= deckSize
                  ? "Deck is full!"
                  : "No matching cards available"}
              </div>
            ) : (
              availableCards.map(({ card, remaining }, idx) => (
                <button
                  key={card._id}
                  onClick={() => handleCollectionClick(card, idx)}
                  onMouseEnter={() => { setPreviewCard(card); setPreviewSource("collection"); }}
                  disabled={isFull && hasHover}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                    isFull && hasHover ? "opacity-40 cursor-not-allowed" : "card-lift cursor-pointer"
                  }`}
                  style={{
                    borderColor: RARITY_COLORS[card.rarity] ?? "var(--border-gold)",
                  }}
                >
                  {remaining > 1 && (
                    <span
                      className="absolute top-1 right-1 z-10 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(0,0,0,0.7)", color: RARITY_COLORS[card.rarity], border: `1px solid ${RARITY_COLORS[card.rarity]}44` }}
                    >
                      ×{remaining}
                    </span>
                  )}
                  {card.type === "destination" ? (
                    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "512/880" }}>
                      <img
                        src={`/api/cards/render/${encodeURIComponent(card.cardId)}?v=${RENDER_V}`}
                        alt={card.name}
                        loading="lazy"
                        draggable={false}
                        className="absolute top-1/2 left-1/2 object-contain"
                        onLoad={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
                        style={{
                          width: "171.875%", // 880/512 for full cover, or just wait... object-contain? 
                          // let's just use the same strategy
                          height: "auto",
                          transform: "translate(-50%, -50%) rotate(90deg)",
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                          maxWidth: "none"
                        }}
                      />
                    </div>
                  ) : (
                    <img
                      src={`/api/cards/render/${encodeURIComponent(card.cardId)}?v=${RENDER_V}`}
                      alt={card.name}
                      loading="lazy"
                      draggable={false}
                      className="w-full aspect-[512/880] object-contain"
                      onLoad={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
                      style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                    />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Center: Preview Panel (desktop only) */}
        <div className="hidden lg:flex flex-col">
          <div
            className="sticky top-0 rounded-lg p-3 flex flex-col items-center gap-3"
            style={{
              background: "linear-gradient(180deg, rgba(15,0,32,0.8), rgba(8,0,18,0.9))",
              border: "1px solid rgba(200,150,42,0.15)",
            }}
          >
            <div
              className="text-[10px] font-bold tracking-widest uppercase w-full"
              style={{ color: "var(--gold)" }}
            >
              ✦ Card Preview
            </div>
            {previewCard ? (
              <>
                <div className="w-full">
                  <FlippableCard
                    key={previewCard._id}
                    frontSrc={`/api/cards/render/${encodeURIComponent(previewCard.cardId)}?v=${RENDER_V}`}
                    backSrc="/card-back.webp"
                    name={previewCard.name}
                    rarity={previewCard.rarity}
                    rarityColor={RARITY_COLORS[previewCard.rarity] ?? "var(--border-gold)"}
                    cardType={previewCard.type as any}
                  />
                </div>
                <div className="w-full text-center space-y-1 mt-2">
                  <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    {previewCard.name}
                  </div>
                  <div className="flex items-center justify-center gap-3 text-xs">
                    <span style={{ color: "#f87171" }}>⚔ {previewCard.attack}</span>
                    <span style={{ color: "#60a5fa" }}>🛡 {previewCard.defense}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-[10px]">
                    <span className="uppercase font-bold" style={{ color: RARITY_COLORS[previewCard.rarity] }}>
                      {previewCard.rarity}
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>•</span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {TYPE_ICONS[previewCard.type]} {previewCard.type}
                    </span>
                  </div>
                  {previewCard.effect && (
                    <div
                      className="text-[10px] px-2 py-1 rounded"
                      style={{ color: "var(--text-muted)", background: "rgba(0,0,0,0.3)" }}
                    >
                      {previewCard.effect}
                    </div>
                  )}
                </div>
                {previewSource === "collection" ? (
                  <button
                    onClick={() => addCard(previewCard)}
                    disabled={isFull}
                    className="btn-game btn-game-crimson w-full py-1.5 text-xs"
                  >
                    {isFull ? "Deck Full" : "+ Add to Deck"}
                  </button>
                ) : (
                  <button
                    onClick={() => removeCard(previewDeckIdx)}
                    className="btn-game btn-game-arcane w-full py-1.5 text-xs"
                  >
                    ✕ Remove
                  </button>
                )}
              </>
            ) : (
              <div
                className="w-full aspect-[512/880] rounded flex items-center justify-center"
                style={{ border: "2px dashed rgba(200,150,42,0.15)" }}
              >
                <span className="text-xs text-center px-4" style={{ color: "var(--text-muted)" }}>
                  Hover a card<br />to inspect
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Current Deck */}
        <div
          className="flex flex-col gap-2 min-h-0 rounded-lg p-3"
          style={{
            background: "linear-gradient(180deg, rgba(15,0,32,0.6), rgba(8,0,18,0.8))",
            border: "1px solid rgba(200,150,42,0.15)",
          }}
        >
          <div
            className="text-[10px] font-bold tracking-widest uppercase"
            style={{ color: "var(--gold)" }}
          >
            ✦ Deck ({deckCards.length}/{deckSize})
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-1.5 content-start">
            {deckCards.length === 0 ? (
              <div
                className="col-span-full text-center py-8 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Click cards to add them
              </div>
            ) : (
              deckCards.map((card, index) => (
                <button
                  key={`${card._id}-${index}`}
                  onClick={() => handleDeckClick(card, index)}
                  onMouseEnter={() => { setPreviewCard(card); setPreviewSource("deck"); setPreviewDeckIdx(index); }}
                  className="relative rounded overflow-hidden border transition-all duration-150 hover:border-red-500/50 group cursor-pointer"
                  style={{
                    borderColor: (RARITY_COLORS[card.rarity] ?? "rgba(200,150,42,0.15)") + "66",
                  }}
                >
                  {card.type === "destination" ? (
                    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "512/880" }}>
                      <img
                        src={`/api/cards/render/${encodeURIComponent(card.cardId)}`}
                        alt={card.name}
                        loading="lazy"
                        draggable={false}
                        className="absolute top-1/2 left-1/2 object-contain"
                        onLoad={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
                        style={{
                          width: "171.875%",
                          height: "auto",
                          transform: "translate(-50%, -50%) rotate(90deg)",
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                          maxWidth: "none"
                        }}
                      />
                    </div>
                  ) : (
                    <img
                      src={`/api/cards/render/${encodeURIComponent(card.cardId)}`}
                      alt={card.name}
                      loading="lazy"
                      draggable={false}
                      className="w-full aspect-[512/880] object-contain"
                      onLoad={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
                      style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                    />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-red-900/0 group-hover:bg-red-900/40 transition-all">
                    <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">✕</span>
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Quick-fill hint */}
          {deckCards.length > 0 && deckCards.length < deckSize && (
            <div className="text-[10px] text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
              Need {deckSize - deckCards.length} more card{deckSize - deckCards.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Preview Modal */}
      {mobilePreview && previewCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => setMobilePreview(false)}
        >
          <div
            className="relative flex flex-col items-center gap-4 w-full max-w-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobilePreview(false)}
              className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
            >
              ✕
            </button>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => cycleMobilePreview(-1)}
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                ‹
              </button>
              <div className="flex-1">
                <FlippableCard
                  key={previewCard._id + mobileIdx}
                  frontSrc={`/api/cards/render/${encodeURIComponent(previewCard.cardId)}?v=${RENDER_V}`}
                  backSrc="/card-back.webp"
                  name={previewCard.name}
                  rarity={previewCard.rarity}
                  rarityColor={RARITY_COLORS[previewCard.rarity] ?? "var(--border-gold)"}
                  cardType={previewCard.type as any}
                />
              </div>
              <button
                onClick={() => cycleMobilePreview(1)}
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                ›
              </button>
            </div>
            <div className="text-center space-y-1 w-full">
              <div className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                {previewCard.name}
              </div>
              <div className="flex items-center justify-center gap-3 text-sm">
                <span style={{ color: "#f87171" }}>⚔ {previewCard.attack}</span>
                <span style={{ color: "#60a5fa" }}>🛡 {previewCard.defense}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="uppercase font-bold" style={{ color: RARITY_COLORS[previewCard.rarity] }}>
                  {previewCard.rarity}
                </span>
                <span style={{ color: "var(--text-muted)" }}>•</span>
                <span style={{ color: "var(--text-muted)" }}>
                  {TYPE_ICONS[previewCard.type]} {previewCard.type}
                </span>
              </div>
              {previewCard.effect && (
                <div
                  className="text-xs px-3 py-1.5 rounded"
                  style={{ color: "var(--text-muted)", background: "rgba(0,0,0,0.4)" }}
                >
                  {previewCard.effect}
                </div>
              )}
            </div>
            {previewSource === "collection" ? (
              <button
                onClick={() => { if (!isFull) { addCard(previewCard); setMobilePreview(false); } }}
                disabled={isFull}
                className="btn-game btn-game-crimson w-full py-2 text-sm"
              >
                {isFull ? "Deck Full" : "+ Add to Deck"}
              </button>
            ) : (
              <button
                onClick={() => { removeCard(previewDeckIdx); setMobilePreview(false); }}
                className="btn-game btn-game-arcane w-full py-2 text-sm"
              >
                ✕ Remove from Deck
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
